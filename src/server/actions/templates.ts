"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMembership } from "@/server/auth/session";
import { db } from "@/server/db";
import { memberships, templateSteps, templates } from "@/server/db/schema";
import { readId, readOptionalId } from "@/server/actions/read-id";
import type { ActionResult } from "@/server/actions/auth";

/**
 * Écritures sur les parcours types.
 *
 * Chaque action re-vérifie la session et l'organisation : une Server Action
 * est un endpoint HTTP public, appelable directement avec un identifiant
 * deviné. Le filtre `organizationId` dans chaque `where` n'est donc pas
 * décoratif — c'est la seule chose qui empêche de modifier le parcours type
 * d'une autre organisation.
 */

const MAX_STEPS = 40;
const OFFSET_MIN = -60;
const OFFSET_MAX = 365;

function parseOffset(raw: FormDataEntryValue | null): number | null {
  const texte = String(raw ?? "").trim();

  // Un champ vidé doit être refusé, pas silencieusement transformé en 0.
  // `Number("")` vaut 0 et `Number.isInteger(0)` vaut true : sans ce test,
  // effacer le délai enregistrait « le jour de l'arrivée » sans le dire.
  if (texte === "") return null;

  const value = Number(texte);
  if (!Number.isInteger(value)) return null;
  if (value < OFFSET_MIN || value > OFFSET_MAX) return null;
  return value;
}

/** Vérifie que le template appartient bien à l'organisation courante. */
async function assertOwnedTemplate(organizationId: string, templateId: string) {
  const [row] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(
      and(eq(templates.id, templateId), eq(templates.organizationId, organizationId)),
    )
    .limit(1);

  return Boolean(row);
}

/**
 * Identifiants des membres de l'organisation.
 *
 * Indispensable : les responsables arrivent d'un `<select>`, mais une Server
 * Action est un endpoint HTTP public. Une requête forgée pourrait envoyer
 * l'identifiant d'un utilisateur d'une AUTRE organisation — la clé étrangère
 * vers `auth.users` l'accepterait, et son email apparaîtrait ensuite dans
 * l'interface. On ne fait donc jamais confiance à la valeur reçue.
 */
async function getMemberIds(organizationId: string): Promise<Set<string>> {
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.organizationId, organizationId));

  return new Set(rows.map((row) => row.userId));
}

/**
 * Trois cas distincts, et il faut les distinguer :
 *   `undefined` → valeur mal formée, on refuse
 *   `null` ou `""` → « non assignée », légitime
 *   sinon → doit être membre de l’organisation
 */
function checkAssignee(
  raw: string | null | undefined,
  memberIds: Set<string>,
): { ok: true; value: string | null } | { ok: false } {
  if (raw === undefined) return { ok: false };
  if (raw === null || raw === "") return { ok: true, value: null };
  if (!memberIds.has(raw)) return { ok: false };
  return { ok: true, value: raw };
}

/* ------------------------------------------------------------------ */
/* Créer un template AVEC ses premières étapes                         */
/* ------------------------------------------------------------------ */

export async function createTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetType =
    formData.get("targetType") === "customer" ? "customer" : "employee";

  if (name.length < 2) {
    return { ok: false, error: "Le nom doit faire au moins deux caractères." };
  }
  if (name.length > 80) {
    return { ok: false, error: "Le nom ne peut pas dépasser quatre-vingts caractères." };
  }

  // Les étapes arrivent en tableaux parallèles depuis le formulaire.
  const titles = formData.getAll("stepTitle").map((v) => String(v).trim());
  const offsets = formData.getAll("stepOffset");
  const assignees = formData.getAll("stepAssignee").map((v) => String(v));

  const memberIds = await getMemberIds(membership.organizationId);
  const steps: { title: string; offsetDays: number; assigneeId: string | null }[] = [];

  for (let i = 0; i < titles.length; i += 1) {
    if (titles[i].length === 0) continue; // ligne laissée vide : ignorée

    const offset = parseOffset(offsets[i] ?? null);
    if (offset === null) {
      return {
        ok: false,
        error: `Le délai de l'étape « ${titles[i]} » doit être un entier entre ${OFFSET_MIN} et ${OFFSET_MAX}.`,
      };
    }

    const assignee = checkAssignee(assignees[i] ?? "", memberIds);
    if (!assignee.ok) {
      return {
        ok: false,
        error: "Un responsable choisi ne fait pas partie de l'organisation.",
      };
    }

    steps.push({
      title: titles[i].slice(0, 160),
      offsetDays: offset,
      assigneeId: assignee.value,
    });
  }

  // Un parcours type sans étape ne sert à rien : on refuse tôt plutôt que
  // de laisser créer une coquille vide qu'il faudra retrouver plus tard.
  if (steps.length === 0) {
    return { ok: false, error: "Ajoutez au moins une étape." };
  }
  if (steps.length > MAX_STEPS) {
    return { ok: false, error: `Un parcours type est limité à ${MAX_STEPS} étapes.` };
  }

  let templateId = "";

  await db.transaction(async (tx) => {
    const [template] = await tx
      .insert(templates)
      .values({
        organizationId: membership.organizationId,
        name,
        description,
        targetType,
      })
      .returning();

    templateId = template.id;

    await tx.insert(templateSteps).values(
      steps.map((step, i) => ({
        templateId: template.id,
        title: step.title,
        position: i + 1,
        offsetDays: step.offsetDays,
        defaultAssigneeId: step.assigneeId,
      })),
    );
  });

  revalidatePath("/templates");
  redirect(`/templates/${templateId}`);
}

/* ------------------------------------------------------------------ */
/* Modifier l'en-tête                                                  */
/* ------------------------------------------------------------------ */

export async function updateTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const templateId = readId(formData, "templateId");
  if (!templateId) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetType =
    formData.get("targetType") === "customer" ? "customer" : "employee";

  if (name.length < 2) {
    return { ok: false, error: "Le nom doit faire au moins deux caractères." };
  }

  const result = await db
    .update(templates)
    .set({ name, description, targetType })
    .where(
      and(eq(templates.id, templateId), eq(templates.organizationId, membership.organizationId)),
    )
    .returning({ id: templates.id });

  if (result.length === 0) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }

  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/templates");

  return { ok: true, message: "Parcours type enregistré." };
}

/* ------------------------------------------------------------------ */
/* Archiver / réactiver                                                */
/* ------------------------------------------------------------------ */

export async function toggleArchive(formData: FormData): Promise<void> {
  const membership = await requireMembership();
  const templateId = readId(formData, "templateId");
  if (!templateId) return;
  const archive = formData.get("archive") === "true";

  await db
    .update(templates)
    .set({ isArchived: archive })
    .where(
      and(eq(templates.id, templateId), eq(templates.organizationId, membership.organizationId)),
    );

  revalidatePath(`/templates/${templateId}`);
  revalidatePath("/templates");
}

/* ------------------------------------------------------------------ */
/* Étapes                                                              */
/* ------------------------------------------------------------------ */

export async function addStep(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const templateId = readId(formData, "templateId");
  if (!templateId) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }

  if (!(await assertOwnedTemplate(membership.organizationId, templateId))) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const offset = parseOffset(formData.get("offsetDays"));
  const assignee = readOptionalId(formData, "assigneeId");

  if (title.length < 2) {
    return { ok: false, error: "L'intitulé de l'étape est trop court." };
  }
  if (offset === null) {
    return {
      ok: false,
      error: `Le délai doit être un entier entre ${OFFSET_MIN} et ${OFFSET_MAX}.`,
    };
  }

  const checked = checkAssignee(assignee, await getMemberIds(membership.organizationId));
  if (!checked.ok) {
    return {
      ok: false,
      error: "Ce responsable ne fait pas partie de l'organisation.",
    };
  }

  const existing = await db
    .select({ position: templateSteps.position })
    .from(templateSteps)
    .where(eq(templateSteps.templateId, templateId));

  if (existing.length >= MAX_STEPS) {
    return { ok: false, error: `Un parcours type est limité à ${MAX_STEPS} étapes.` };
  }

  const nextPosition =
    existing.reduce((max, row) => Math.max(max, row.position), 0) + 1;

  await db.insert(templateSteps).values({
    templateId,
    title: title.slice(0, 160),
    position: nextPosition,
    offsetDays: offset,
    defaultAssigneeId: checked.value,
  });

  revalidatePath(`/templates/${templateId}`);

  return { ok: true, message: "Étape ajoutée." };
}

export async function updateStep(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const templateId = readId(formData, "templateId");
  const stepId = readId(formData, "stepId");
  if (!templateId || !stepId) {
    return { ok: false, error: "Cette étape est introuvable." };
  }

  if (!(await assertOwnedTemplate(membership.organizationId, templateId))) {
    return { ok: false, error: "Ce parcours type est introuvable." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const offset = parseOffset(formData.get("offsetDays"));
  const assignee = readOptionalId(formData, "assigneeId");

  if (title.length < 2) {
    return { ok: false, error: "L'intitulé de l'étape est trop court." };
  }
  if (offset === null) {
    return {
      ok: false,
      error: `Le délai doit être un entier entre ${OFFSET_MIN} et ${OFFSET_MAX}.`,
    };
  }

  const checked = checkAssignee(assignee, await getMemberIds(membership.organizationId));
  if (!checked.ok) {
    return {
      ok: false,
      error: "Ce responsable ne fait pas partie de l'organisation.",
    };
  }

  await db
    .update(templateSteps)
    .set({
      title: title.slice(0, 160),
      offsetDays: offset,
      defaultAssigneeId: checked.value,
    })
    .where(
      and(eq(templateSteps.id, stepId), eq(templateSteps.templateId, templateId)),
    );

  revalidatePath(`/templates/${templateId}`);

  return { ok: true, message: "Étape enregistrée." };
}

export async function deleteStep(formData: FormData): Promise<void> {
  const membership = await requireMembership();
  const templateId = readId(formData, "templateId");
  const stepId = readId(formData, "stepId");
  if (!templateId || !stepId) return;

  if (!(await assertOwnedTemplate(membership.organizationId, templateId))) return;

  await db.transaction(async (tx) => {
    await tx
      .delete(templateSteps)
      .where(
        and(eq(templateSteps.id, stepId), eq(templateSteps.templateId, templateId)),
      );

    // Renumérotation : sans elle, les positions deviennent 1,2,4,5 et le
    // déplacement suivant se comporte de façon imprévisible.
    await renumber(tx, templateId);
  });

  revalidatePath(`/templates/${templateId}`);
}

/**
 * Déplace une étape d'un cran.
 *
 * On échange les positions de deux voisines plutôt que de tout réécrire :
 * c'est une seule paire de mises à jour, et l'ordre reste toujours une suite
 * continue de 1 à N.
 */
export async function moveStep(formData: FormData): Promise<void> {
  const membership = await requireMembership();
  const templateId = readId(formData, "templateId");
  const stepId = readId(formData, "stepId");
  if (!templateId || !stepId) return;
  const direction = formData.get("direction") === "up" ? -1 : 1;

  if (!(await assertOwnedTemplate(membership.organizationId, templateId))) return;

  await db.transaction(async (tx) => {
    const steps = await tx
      .select({ id: templateSteps.id, position: templateSteps.position })
      .from(templateSteps)
      .where(eq(templateSteps.templateId, templateId))
      .orderBy(asc(templateSteps.position));

    const index = steps.findIndex((s) => s.id === stepId);
    const target = index + direction;

    // Déjà en haut ou en bas : rien à faire, et surtout pas d'erreur.
    if (index === -1 || target < 0 || target >= steps.length) return;

    const a = steps[index];
    const b = steps[target];

    // Position temporaire négative : la contrainte d'unicité n'existe pas
    // sur (template_id, position), mais on garde l'échange atomique et
    // lisible plutôt que de dépendre de l'ordre des deux updates.
    await tx
      .update(templateSteps)
      .set({ position: -1 })
      .where(eq(templateSteps.id, a.id));
    await tx
      .update(templateSteps)
      .set({ position: a.position })
      .where(eq(templateSteps.id, b.id));
    await tx
      .update(templateSteps)
      .set({ position: b.position })
      .where(eq(templateSteps.id, a.id));
  });

  revalidatePath(`/templates/${templateId}`);
}

/** Réécrit les positions en 1..N dans l'ordre courant. */
async function renumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  templateId: string,
) {
  const steps = await tx
    .select({ id: templateSteps.id })
    .from(templateSteps)
    .where(eq(templateSteps.templateId, templateId))
    .orderBy(asc(templateSteps.position));

  for (let i = 0; i < steps.length; i += 1) {
    await tx
      .update(templateSteps)
      .set({ position: i + 1 })
      .where(eq(templateSteps.id, steps[i].id));
  }
}
