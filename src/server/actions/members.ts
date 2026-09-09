"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { countAdmins, getMembers } from "@/server/db/queries";
import {
  invitations,
  journeys,
  memberships,
  tasks,
  templateSteps,
  templates,
} from "@/server/db/schema";
import { invitationEmail } from "@/server/email/templates";
import { sendEmail } from "@/server/email/send";
import { getOrigin } from "@/server/origin";
import { readId } from "@/server/actions/read-id";
import type { ActionResult } from "@/server/actions/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Inviter                                                             */
/* ------------------------------------------------------------------ */

export async function inviteMember(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Une Server Action est un endpoint HTTP public : on re-vérifie la
  // session, l'organisation ET le rôle, même si l'écran est déjà protégé.
  const admin = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role") === "admin" ? "admin" : "member";

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Cette adresse email n'est pas valide." };
  }

  // Déjà membre ? On ne crée pas d'invitation qui ne servira à rien.
  const members = await getMembers(admin.organizationId);
  if (members.some((m) => m.email.toLowerCase() === email)) {
    return { ok: false, error: "Cette personne est déjà membre de l'organisation." };
  }

  // Invitation déjà en attente ? L'index partiel de la base le refuserait,
  // mais un message clair vaut mieux qu'une erreur de contrainte.
  const [pending] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.organizationId, admin.organizationId),
        eq(invitations.email, email),
        isNull(invitations.acceptedAt),
      ),
    )
    .limit(1);

  if (pending) {
    return { ok: false, error: "Une invitation est déjà en attente pour cette adresse." };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITATION_DAYS * 86_400_000);

  await db.insert(invitations).values({
    organizationId: admin.organizationId,
    email,
    role,
    token,
    invitedBy: admin.userId,
    expiresAt,
  });

  const origin = await getOrigin();

  // L'envoi ne peut pas faire échouer l'action : l'invitation existe déjà
  // en base et le lien reste copiable. Voir sendEmail().
  await sendEmail(
    invitationEmail({
      to: email,
      organizationName: admin.organizationName,
      inviterEmail: admin.email,
      url: `${origin}/invitations/${token}`,
    }),
  );

  revalidatePath("/settings/members");

  return { ok: true, message: `Invitation envoyée à ${email}.` };
}

/* ------------------------------------------------------------------ */
/* Annuler une invitation                                              */
/* ------------------------------------------------------------------ */

export async function cancelInvitation(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = readId(formData, "id");
  if (!id) return;

  // Le filtre sur l'organisation n'est pas décoratif : sans lui, un
  // administrateur pourrait annuler l'invitation d'une AUTRE organisation
  // en devinant un identifiant.
  await db
    .delete(invitations)
    .where(
      and(
        eq(invitations.id, id),
        eq(invitations.organizationId, admin.organizationId),
      ),
    );

  revalidatePath("/settings/members");
}

/* ------------------------------------------------------------------ */
/* Retirer un membre                                                   */
/* ------------------------------------------------------------------ */

export async function removeMember(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const userId = readId(formData, "userId");
  if (!userId) {
    return { ok: false, error: "Ce membre ne fait pas partie de l'organisation." };
  }

  // On ne se retire pas soi-même. L'interface masque déjà le bouton, mais
  // l'action est un endpoint public — et sans cette garde, les parcours du
  // partant seraient « transférés » à lui-même, donc à un non-membre.
  if (userId === admin.userId) {
    return {
      ok: false,
      error: "Vous ne pouvez pas vous retirer vous-même de l'organisation.",
    };
  }

  const [target] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, admin.organizationId),
        eq(memberships.userId, userId),
      ),
    )
    .limit(1);

  if (!target) {
    return { ok: false, error: "Ce membre ne fait pas partie de l'organisation." };
  }

  // Sans ce garde-fou, l'organisation devient ingérable : plus personne ne
  // peut inviter ni retirer qui que ce soit.
  if (target.role === "admin" && (await countAdmins(admin.organizationId)) <= 1) {
    return {
      ok: false,
      error: "Impossible de retirer le dernier administrateur.",
    };
  }

  await db.transaction(async (tx) => {
    /**
     * DÉCISION N° 7 — la désassignation est explicite.
     *
     * `tasks.assignee_id` référence `auth.users`, pas `memberships` : retirer
     * un membership ne déclenche donc AUCUN `on delete set null`. Sans ce
     * traitement, on garderait des tâches assignées à quelqu'un qui n'a plus
     * accès à l'organisation.
     */
    /**
     * Sous-requêtes plutôt que chargement des identifiants en mémoire.
     *
     * La version précédente faisait un `select` de tous les parcours de
     * l'organisation, puis un `inArray` sur la liste obtenue — le motif « je
     * charge tout pour filtrer ensuite » que ce projet refuse ailleurs. Trois
     * allers-retours devenus trois instructions.
     */
    await tx
      .update(tasks)
      .set({ assigneeId: null })
      .where(
        and(
          eq(tasks.assigneeId, userId),
          inArray(
            tasks.journeyId,
            tx
              .select({ id: journeys.id })
              .from(journeys)
              .where(eq(journeys.organizationId, admin.organizationId)),
          ),
        ),
      );

    // Les parcours dont il était pilote passent à l'administrateur agissant.
    await tx
      .update(journeys)
      .set({ ownerId: admin.userId })
      .where(
        and(
          eq(journeys.ownerId, userId),
          eq(journeys.organizationId, admin.organizationId),
        ),
      );

    // Idem pour les responsables par défaut des parcours types.
    await tx
      .update(templateSteps)
      .set({ defaultAssigneeId: null })
      .where(
        and(
          eq(templateSteps.defaultAssigneeId, userId),
          inArray(
            templateSteps.templateId,
            tx
              .select({ id: templates.id })
              .from(templates)
              .where(eq(templates.organizationId, admin.organizationId)),
          ),
        ),
      );

    await tx
      .delete(memberships)
      .where(
        and(
          eq(memberships.organizationId, admin.organizationId),
          eq(memberships.userId, userId),
        ),
      );
  });

  revalidatePath("/settings/members");

  return { ok: true, message: "Membre retiré. Ses tâches ont été désassignées." };
}
