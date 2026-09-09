import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../index";
import { authUsers } from "../auth-users";
import { invitations, memberships } from "../schema";

/**
 * Décision d'architecture n° 4 : toutes les lectures passent par ici, et
 * TOUTES exigent un `organizationId`.
 *
 * Aucune fonction de ce fichier ne doit accepter d'être appelée sans lui.
 * C'est la garantie mécanique qu'un utilisateur ne verra jamais les données
 * d'une autre organisation, et c'est la réponse à donner quand on demande
 * comment l'isolation est assurée.
 */

export type MemberRow = {
  userId: string;
  email: string;
  role: "admin" | "member";
  joinedAt: Date;
};

export async function getMembers(organizationId: string): Promise<MemberRow[]> {
  const rows = await db
    .select({
      userId: memberships.userId,
      email: authUsers.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(authUsers, eq(authUsers.id, memberships.userId))
    .where(eq(memberships.organizationId, organizationId))
    .orderBy(asc(memberships.createdAt));

  return rows.map((row) => ({
    userId: row.userId,
    email: row.email ?? "(email inconnu)",
    role: row.role,
    joinedAt: row.joinedAt,
  }));
}

export type InvitationRow = {
  id: string;
  email: string;
  role: "admin" | "member";
  expiresAt: Date;
  invitedByEmail: string | null;
};

export async function getPendingInvitations(
  organizationId: string,
): Promise<InvitationRow[]> {
  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      invitedByEmail: authUsers.email,
    })
    .from(invitations)
    .leftJoin(authUsers, eq(authUsers.id, invitations.invitedBy))
    .where(
      and(
        eq(invitations.organizationId, organizationId),
        isNull(invitations.acceptedAt),
      ),
    )
    .orderBy(asc(invitations.createdAt));

  return rows;
}

/** Nombre d'administrateurs — sert à interdire le retrait du dernier. */
export async function countAdmins(organizationId: string): Promise<number> {
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.role, "admin"),
      ),
    );

  return rows.length;
}
