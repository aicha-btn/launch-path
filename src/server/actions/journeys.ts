"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addBusinessDays, isFullyProcessed } from "@/lib/scheduling";
import { formatShort, isValidCivilDate, today } from "@/lib/dates";
import { requireMembership } from "@/server/auth/session";
import { db } from "@/server/db";
import { authUsers } from "@/server/db/auth-users";
import {
  activityEvents,
  journeys,
  memberships,
  notificationLogs,
  tasks,
} from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { taskAssignedEmail } from "@/server/email/templates";
import { getOrigin } from "@/server/origin";
import { readId, readOptionalId } from "@/server/actions/read-id";
import type { ActionResult } from "@/server/actions/auth";

/**
 * LE cœur métier du produit — décisions d'architecture n° 1 et n° 3.
 *
 * Lancer un onboarding ne crée pas un lien vers un parcours type : il en
 * COPIE les étapes en tâches, avec leurs échéances calculées. Modifier le
 * parcours type ensuite ne touche donc pas aux onboardings en cours.
 */


/* ------------------------------------------------------------------ */
/* Lancer un onboarding                                                */
/* ------------------------------------------------------------------ */

export async function launchJourney(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const templateId = readId(formData, "templateId");
  const subjectName = String(formData.get("subjectName") ?? "").trim();
  const subjectEmail = String(formData.get("subjectEmail") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const ownerId = readOptionalId(formData, "ownerId");

  if (!templateId) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }
  if (subjectName.length < 2) {
    return { ok: false, error: "Indiquez le nom de la personne ou du client." };
  }
  // `isValidCivilDate` et non une simple expression régulière de format :
  // celle-ci acceptait « 2026-02-31 », puis `addBusinessDays` levait une
  // exception — donc un écran d'erreur au lieu de ce message.
  if (!isValidCivilDate(startDate)) {
    return { ok: false, error: "La date d'arrivée est invalide." };
  }

  // Le parcours type doit appartenir à l'organisation : sans ce filtre, un
  // identifiant deviné permettrait de copier le parcours type d'une autre
  // organisation.
  const template = await db.query.templates.findFirst({
    where: (t, { and: a, eq: e }) =>
      a(e(t.id, templateId), e(t.organizationId, membership.organizationId)),
    with: { steps: true },
  });

  if (!template) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }
  if (template.isArchived) {
    return {
      ok: false,
      error: "Ce parcours type est archivé. Réactivez-le pour le lancer.",
    };
  }
  if (template.steps.length === 0) {
    return {
      ok: false,
      error: "Ce parcours type n'a aucune étape : il n'y aurait rien à suivre.",
    };
  }

  // Le pilote doit être membre de l'organisation — on ne fait jamais
  // confiance à la valeur reçue du formulaire.
  const memberRows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.organizationId, membership.organizationId));

  const memberIds = new Set(memberRows.map((row) => row.userId));
  // Un pilote absent ou mal formé retombe sur l’utilisateur courant plutôt
  // que de faire échouer le lancement : ce champ a toujours une valeur sensée.
  const owner =
    ownerId && memberIds.has(ownerId) ? ownerId : membership.userId;

  let journeyId = "";

  /**
   * Tout dans UNE transaction.
   *
   * Un parcours créé sans ses tâches serait une coquille vide, invisible
   * dans l'interface mais bien présente en base — le genre d'incohérence
   * qu'on ne découvre que des semaines plus tard.
   */
  await db.transaction(async (tx) => {
    const [journey] = await tx
      .insert(journeys)
      .values({
        organizationId: membership.organizationId,
        templateId: template.id,
        // SNAPSHOT du nom : le parcours type peut être archivé ou supprimé,
        // la page de détail doit continuer d'afficher de quoi il s'agit.
        templateName: template.name,
        subjectName,
        subjectEmail: subjectEmail || null,
        ownerId: owner,
        startDate,
        status: "active",
      })
      .returning();

    journeyId = journey.id;

    const ordered = template.steps
      .slice()
      .sort((a, b) => a.position - b.position);

    await tx.insert(tasks).values(
      ordered.map((step, index) => ({
        journeyId: journey.id,
        title: step.title,
        description: step.description,
        // Les responsables issus du parcours type ont déjà été validés à la
        // création de celui-ci ; on les recontrôle malgré tout, un membre
        // ayant pu quitter l'organisation entre-temps.
        assigneeId:
          step.defaultAssigneeId && memberIds.has(step.defaultAssigneeId)
            ? step.defaultAssigneeId
            : null,
        position: index + 1,
        dueDate: addBusinessDays(startDate, step.offsetDays),
        status: "todo" as const,
      })),
    );

    await tx.insert(activityEvents).values({
      journeyId: journey.id,
      actorId: membership.userId,
      type: "journey_launched",
      payload: { templateName: template.name, stepCount: ordered.length },
    });
  });

  // Les emails partent APRÈS la transaction, jamais dedans : un SMTP lent
  // ou indisponible ne doit pas faire échouer — ni ralentir — la création
  // des données.
  await notifyAssignments(journeyId, subjectName);

  revalidatePath("/dashboard");
  revalidatePath("/journeys");
  redirect(`/journeys/${journeyId}`);
}

/**
 * Prévient chaque responsable des étapes qui lui sont assignées.
 *
 * Un seul email par personne, pas un par tâche : recevoir huit emails d'un
 * coup ferait désinstaller le produit. On envoie donc un récapitulatif.
 *
 * L'enregistrement dans `notification_logs` sert la même idempotence que le
 * cron : relancer deux fois le même jour n'enverra pas deux fois.
 */
async function notifyAssignments(journeyId: string, subjectName: string) {
  const rows = await db
    .select({
      taskId: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      assigneeId: tasks.assigneeId,
      email: authUsers.email,
    })
    .from(tasks)
    .innerJoin(authUsers, eq(authUsers.id, tasks.assigneeId))
    .where(eq(tasks.journeyId, journeyId));

  const byAssignee = new Map<
    string,
    { email: string; tasks: { id: string; title: string; dueDate: string }[] }
  >();

  for (const row of rows) {
    if (!row.email || !row.assigneeId) continue;
    const entry = byAssignee.get(row.assigneeId) ?? {
      email: row.email,
      tasks: [],
    };
    entry.tasks.push({ id: row.taskId, title: row.title, dueDate: row.dueDate });
    byAssignee.set(row.assigneeId, entry);
  }

  const origin = await getOrigin();
  const url = `${origin}/journeys/${journeyId}`;
  const sentOn = today();

  for (const [, entry] of byAssignee) {
    const first = entry.tasks.sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    )[0];

    // `onConflictDoNothing` + `returning` : si aucune ligne ne revient,
    // c'est que la notification a déjà été journalisée. La base arbitre,
    // pas le code — donc deux appels simultanés ne peuvent pas doubler.
    const logged = await db
      .insert(notificationLogs)
      .values({ taskId: first.id, kind: "assigned", sentOn })
      .onConflictDoNothing()
      .returning({ id: notificationLogs.id });

    if (logged.length === 0) continue;

    await sendEmail(
      taskAssignedEmail({
        to: entry.email,
        subjectName,
        taskTitle:
          entry.tasks.length === 1
            ? first.title
            : `${first.title} (+${entry.tasks.length - 1} autre${entry.tasks.length > 2 ? "s" : ""})`,
        dueDate: formatShort(first.dueDate),
        url,
      }),
    );
  }
}

/* ------------------------------------------------------------------ */
/* Prévisualisation des échéances                                      */
/* ------------------------------------------------------------------ */

export type PreviewStep = { position: number; title: string; dueDate: string };

/**
 * Calcule les échéances sans rien écrire, pour l'aperçu avant validation.
 *
 * Petit détail, gros effet en démonstration : on voit les vraies dates
 * avant de lancer.
 */
export async function previewSchedule(
  templateId: string,
  startDate: string,
): Promise<PreviewStep[]> {
  const membership = await requireMembership();

  if (!isValidCivilDate(startDate)) return [];

  const template = await db.query.templates.findFirst({
    where: (t, { and: a, eq: e }) =>
      a(e(t.id, templateId), e(t.organizationId, membership.organizationId)),
    with: { steps: true },
  });

  if (!template) return [];

  return template.steps
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((step, index) => ({
      position: index + 1,
      title: step.title,
      dueDate: addBusinessDays(startDate, step.offsetDays),
    }));
}

/* ------------------------------------------------------------------ */
/* Complétion d'une tâche                                              */
/* ------------------------------------------------------------------ */

/**
 * Recalcule le statut du parcours DANS LES DEUX SENS.
 *
 * Passer en `completed` quand tout est traité est évident. L'inverse l'est
 * moins et se retrouve oublié dans la plupart des implémentations : rouvrir
 * une tâche d'un parcours terminé doit le remettre en cours.
 */
async function recomputeJourneyStatus(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  journeyId: string,
) {
  const rows = await tx
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.journeyId, journeyId));

  const [journey] = await tx
    .select({ status: journeys.status })
    .from(journeys)
    .where(eq(journeys.id, journeyId))
    .limit(1);

  // Un parcours annulé n'est pas concerné : c'est une décision humaine.
  if (!journey || journey.status === "cancelled") return;

  const finished = isFullyProcessed(rows);

  if (finished && journey.status !== "completed") {
    await tx
      .update(journeys)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(journeys.id, journeyId));
  } else if (!finished && journey.status === "completed") {
    await tx
      .update(journeys)
      .set({ status: "active", completedAt: null })
      .where(eq(journeys.id, journeyId));
  }
}

/** Vérifie que la tâche appartient bien à l'organisation courante. */
async function findOwnedTask(organizationId: string, taskId: string) {
  const [row] = await db
    .select({
      id: tasks.id,
      journeyId: tasks.journeyId,
      status: tasks.status,
      assigneeId: tasks.assigneeId,
      // Nécessaire pour savoir si l'échéance a changé, et donc s'il faut
      // écrire l'événement correspondant.
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(and(eq(tasks.id, taskId), eq(journeys.organizationId, organizationId)))
    .limit(1);

  return row ?? null;
}

/**
 * Renvoie un résultat, et ne se contente pas d'un `void`.
 *
 * L'appelant (`TaskRow`) coche la case avant la réponse du serveur, par mise à
 * jour optimiste. Si l'action refusait en silence, la case se décochait toute
 * seule et l'utilisateur n'avait AUCUNE explication — la mise à jour optimiste
 * masquait l'échec. Elle est appelée impérativement, pas comme `action` de
 * formulaire, donc elle peut renvoyer une valeur.
 */
export async function setTaskStatus(
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const taskId = readId(formData, "taskId");
  const requested = String(formData.get("status") ?? "");

  if (!taskId) {
    return { ok: false, error: "Cette tâche est introuvable." };
  }

  if (requested !== "todo" && requested !== "done" && requested !== "skipped") {
    return { ok: false, error: "Statut inconnu." };
  }

  const task = await findOwnedTask(membership.organizationId, taskId);
  if (!task) {
    return { ok: false, error: "Cette tâche est introuvable." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({
        status: requested,
        completedAt: requested === "done" ? new Date() : null,
        completedBy: requested === "done" ? membership.userId : null,
      })
      .where(eq(tasks.id, taskId));

    await tx.insert(activityEvents).values({
      journeyId: task.journeyId,
      taskId,
      actorId: membership.userId,
      type:
        requested === "done"
          ? "task_completed"
          : requested === "skipped"
            ? "task_skipped"
            : "task_reopened",
      payload: { from: task.status, to: requested },
    });

    await recomputeJourneyStatus(tx, task.journeyId);
  });

  revalidatePath(`/journeys/${task.journeyId}`);
  revalidatePath("/dashboard");
  revalidatePath("/my-tasks");
  revalidatePath("/journeys");

  return { ok: true, message: "Étape mise à jour." };
}

/* ------------------------------------------------------------------ */
/* Annuler un onboarding                                               */
/* ------------------------------------------------------------------ */

export async function cancelJourney(formData: FormData): Promise<void> {
  const membership = await requireMembership();
  const journeyId = readId(formData, "journeyId");
  if (!journeyId) return;

  const updated = await db
    .update(journeys)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(
      and(
        eq(journeys.id, journeyId),
        eq(journeys.organizationId, membership.organizationId),
      ),
    )
    .returning({ id: journeys.id });

  if (updated.length === 0) return;

  await db.insert(activityEvents).values({
    journeyId,
    actorId: membership.userId,
    type: "journey_cancelled",
    payload: {},
  });

  revalidatePath(`/journeys/${journeyId}`);
  revalidatePath("/dashboard");
  revalidatePath("/journeys");
}

export async function reopenJourney(formData: FormData): Promise<void> {
  const membership = await requireMembership();
  const journeyId = readId(formData, "journeyId");
  if (!journeyId) return;

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(journeys)
      .set({ status: "active", cancelledAt: null, completedAt: null })
      .where(
        and(
          eq(journeys.id, journeyId),
          eq(journeys.organizationId, membership.organizationId),
        ),
      )
      .returning({ id: journeys.id });

    if (updated.length === 0) return;

    /**
     * Recalcul après réactivation.
     *
     * Sans lui, réactiver un parcours dont toutes les tâches sont déjà
     * traitées l'affichait « en cours » avec 8/8 — et le dashboard le
     * comptait parmi les actifs. `recomputeJourneyStatus` ignore les parcours
     * annulés, d'où l'ordre : on remet en cours d'abord, on recalcule ensuite.
     */
    await recomputeJourneyStatus(tx, journeyId);
  });

  revalidatePath(`/journeys/${journeyId}`);
  revalidatePath("/dashboard");
  revalidatePath("/journeys");
}

/* ------------------------------------------------------------------ */
/* Réassignation et échéance                                           */
/* ------------------------------------------------------------------ */

export async function updateTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const taskId = readId(formData, "taskId");
  const assigneeRaw = readOptionalId(formData, "assigneeId");
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!taskId) return { ok: false, error: "Cette tâche est introuvable." };

  const task = await findOwnedTask(membership.organizationId, taskId);
  if (!task) return { ok: false, error: "Cette tâche est introuvable." };

  if (!isValidCivilDate(dueDate)) {
    return { ok: false, error: "L'échéance est invalide." };
  }

  const memberRows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.organizationId, membership.organizationId));

  const memberIds = new Set(memberRows.map((row) => row.userId));

  // `undefined` = identifiant mal formé, `null` = « non assignée ».
  if (assigneeRaw === undefined || (assigneeRaw && !memberIds.has(assigneeRaw))) {
    return { ok: false, error: "Ce responsable ne fait pas partie de l’organisation." };
  }

  const assigneeId = assigneeRaw;

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ assigneeId, dueDate })
      .where(eq(tasks.id, taskId));

    if (assigneeId !== task.assigneeId) {
      await tx.insert(activityEvents).values({
        journeyId: task.journeyId,
        taskId,
        actorId: membership.userId,
        type: "task_assigned",
        payload: { assigneeId },
      });
    }

    /**
     * Le type `task_due_date_changed` existait au schéma et dans la timeline,
     * mais RIEN ne l'écrivait : déplacer une échéance ne laissait aucune
     * trace. Or c'est précisément le geste qu'on veut pouvoir expliquer plus
     * tard — « pourquoi cette étape a-t-elle glissé de deux semaines ? ».
     */
    if (dueDate !== task.dueDate) {
      await tx.insert(activityEvents).values({
        journeyId: task.journeyId,
        taskId,
        actorId: membership.userId,
        type: "task_due_date_changed",
        payload: { from: task.dueDate, to: dueDate },
      });
    }
  });

  /**
   * Prévenir le NOUVEAU responsable.
   *
   * Ce trou était visible depuis la page publique, qui promet « chaque
   * responsable reçoit sa tâche » : l'email partait au lancement, mais
   * réassigner une étape ensuite ne prévenait personne. Le nouveau
   * responsable ne l'apprenait qu'au rappel de la veille de l'échéance —
   * ou jamais, si l'échéance était lointaine.
   *
   * Pas de passage par `notification_logs` ici, contrairement au cron : une
   * réassignation est un geste humain délibéré, pas une tâche planifiée
   * rejouable. Et la clé du journal ne contient pas le destinataire, donc
   * elle aurait bloqué à tort l'email du nouveau responsable le jour du
   * lancement.
   */
  if (assigneeId && assigneeId !== task.assigneeId) {
    await notifyReassignment(taskId, assigneeId);
  }

  revalidatePath(`/journeys/${task.journeyId}`);
  revalidatePath("/my-tasks");

  return { ok: true, message: "Tâche enregistrée." };
}

async function notifyReassignment(taskId: string, assigneeId: string) {
  const [row] = await db
    .select({
      title: tasks.title,
      dueDate: tasks.dueDate,
      journeyId: journeys.id,
      subjectName: journeys.subjectName,
      email: authUsers.email,
    })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .innerJoin(authUsers, eq(authUsers.id, tasks.assigneeId))
    .where(and(eq(tasks.id, taskId), eq(tasks.assigneeId, assigneeId)))
    .limit(1);

  if (!row?.email) return;

  const origin = await getOrigin();

  await sendEmail(
    taskAssignedEmail({
      to: row.email,
      subjectName: row.subjectName,
      taskTitle: row.title,
      dueDate: formatShort(row.dueDate),
      url: `${origin}/journeys/${row.journeyId}?task=${taskId}`,
    }),
  );
}
