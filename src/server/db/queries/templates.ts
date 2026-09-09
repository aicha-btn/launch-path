import { db } from "../index";
import { isUuid } from "./ids";
import { resolveMembers } from "./members-lookup";
import type { Template } from "@/types";

/** Toutes les lectures des parcours types. Scopées par organisation. */

export async function getTemplates(organizationId: string): Promise<Template[]> {
  const rows = await db.query.templates.findMany({
    where: (t, { eq }) => eq(t.organizationId, organizationId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
    // Tri en SQL plutôt qu’un `.sort()` après coup, comme partout ailleurs.
    with: { steps: { orderBy: (s, { asc }) => [asc(s.position)] } },
  });

  const members = await resolveMembers(
    rows.flatMap((r) => r.steps.map((s) => s.defaultAssigneeId)),
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    targetType: row.targetType,
    isArchived: row.isArchived,
    steps: row.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((step) => ({
        id: step.id,
        title: step.title,
        position: step.position,
        offsetDays: step.offsetDays,
        defaultAssignee: step.defaultAssigneeId
          ? members.get(step.defaultAssigneeId) ?? null
          : null,
      })),
  }));
}

export async function getTemplate(
  organizationId: string,
  templateId: string,
): Promise<Template | null> {
  if (!isUuid(templateId)) return null;

  const row = await db.query.templates.findFirst({
    // Filtre sur l'organisation : sans lui, changer l'identifiant dans
    // l'URL donnerait accès au parcours type d'une autre organisation.
    where: (t, { and, eq }) =>
      and(eq(t.id, templateId), eq(t.organizationId, organizationId)),
    // Tri en SQL plutôt qu’un `.sort()` après coup, comme partout ailleurs.
    with: { steps: { orderBy: (s, { asc }) => [asc(s.position)] } },
  });

  if (!row) return null;

  const members = await resolveMembers(row.steps.map((s) => s.defaultAssigneeId));

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    targetType: row.targetType,
    isArchived: row.isArchived,
    steps: row.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((step) => ({
        id: step.id,
        title: step.title,
        position: step.position,
        offsetDays: step.offsetDays,
        defaultAssignee: step.defaultAssigneeId
          ? members.get(step.defaultAssigneeId) ?? null
          : null,
      })),
  };
}
