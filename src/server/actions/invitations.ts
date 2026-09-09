"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentMembership, getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/db/errors";
import { invitations, memberships, organizations } from "@/server/db/schema";

export type InvitationState =
  | { status: "invalid" }
  | { status: "expired"; organizationName: string }
  | { status: "accepted"; organizationName: string }
  | {
      status: "pending";
      organizationName: string;
      email: string;
      role: "admin" | "member";
    };

/**
 * Lecture publique : cette page est accessible sans session, puisque la
 * personne invitée n'a pas encore de compte. Le jeton est la seule preuve,
 * d'où sa longueur — 24 octets aléatoires, non devinables.
 */
export async function readInvitation(token: string): Promise<InvitationState> {
  const [row] = await db
    .select({
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      organizationName: organizations.name,
    })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.organizationId))
    .where(eq(invitations.token, token))
    .limit(1);

  if (!row) return { status: "invalid" };
  if (row.acceptedAt) {
    return { status: "accepted", organizationName: row.organizationName };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return { status: "expired", organizationName: row.organizationName };
  }

  return {
    status: "pending",
    organizationName: row.organizationName,
    email: row.email,
    role: row.role,
  };
}

/**
 * Accepte l'invitation pour l'utilisateur connecté.
 *
 * Volontairement, on ne vérifie PAS que l'email du compte correspond à celui
 * de l'invitation : une personne invitée sur son adresse professionnelle peut
 * très bien se connecter avec une autre. Le jeton est la preuve, pas l'email.
 * C'est un choix, et il se défend — l'inverse bloquerait des cas légitimes.
 */
export async function acceptInvitation(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?suivant=${encodeURIComponent(`/invitations/${token}`)}`);

  // Déjà dans une organisation : on ne gère pas le multi-organisation (hors MVP).
  const existing = await getCurrentMembership();
  if (existing) redirect("/dashboard");

  const [invitation] = await db
    .select({
      id: invitations.id,
      organizationId: invitations.organizationId,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(and(eq(invitations.token, token), isNull(invitations.acceptedAt)))
    .limit(1);

  if (!invitation) redirect(`/invitations/${token}`);
  if (invitation.expiresAt.getTime() < Date.now()) redirect(`/invitations/${token}`);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(memberships).values({
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
      });

      // Marquer l'invitation comme acceptée la rend inutilisable une seconde
      // fois, et libère l'index partiel pour une future réinvitation.
      await tx
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id));
    });
  } catch (error) {
    // L'utilisateur appartient déjà à une organisation — la contrainte
    // `memberships_user_key` a tranché. L'invitation reste non acceptée,
    // donc utilisable par la bonne personne.
    if (isUniqueViolation(error)) redirect("/dashboard");
    throw error;
  }

  redirect("/dashboard");
}
