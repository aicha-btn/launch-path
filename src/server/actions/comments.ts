"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/auth/session";
import { db } from "@/server/db";
import { activityEvents, comments, journeys, tasks } from "@/server/db/schema";
import { readId } from "@/server/actions/read-id";
import type { ActionResult } from "@/server/actions/auth";

const MAX_LENGTH = 2000;

/** Retrouve la tâche en vérifiant qu'elle appartient à l'organisation. */
async function findOwnedTask(organizationId: string, taskId: string) {
  const [row] = await db
    .select({ id: tasks.id, journeyId: tasks.journeyId })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(and(eq(tasks.id, taskId), eq(journeys.organizationId, organizationId)))
    .limit(1);

  return row ?? null;
}

export async function addComment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const membership = await requireMembership();

  const taskId = readId(formData, "taskId");
  const body = String(formData.get("body") ?? "").trim();

  if (!taskId) return { ok: false, error: "Cette tâche est introuvable." };

  if (body.length === 0) {
    return { ok: false, error: "Le commentaire est vide." };
  }
  if (body.length > MAX_LENGTH) {
    return {
      ok: false,
      error: `Un commentaire est limité à ${MAX_LENGTH} caractères.`,
    };
  }

  const task = await findOwnedTask(membership.organizationId, taskId);
  if (!task) return { ok: false, error: "Cette tâche est introuvable." };

  await db.transaction(async (tx) => {
    await tx.insert(comments).values({
      taskId,
      authorId: membership.userId,
      body,
    });

    // L'historique enregistre le geste, pas le contenu : le commentaire est
    // déjà stocké, le dupliquer dans le `payload` créerait deux vérités.
    await tx.insert(activityEvents).values({
      journeyId: task.journeyId,
      taskId,
      actorId: membership.userId,
      type: "comment_added",
      payload: {},
    });
  });

  revalidatePath(`/journeys/${task.journeyId}`);

  return { ok: true, message: "Commentaire ajouté." };
}

export async function deleteComment(formData: FormData): Promise<void> {
  const membership = await requireMembership();
  const commentId = readId(formData, "commentId");
  if (!commentId) return;

  // On ne peut supprimer que SON commentaire, et seulement si la tâche
  // appartient à son organisation. Les deux conditions comptent.
  const [row] = await db
    .select({ id: comments.id, journeyId: tasks.journeyId })
    .from(comments)
    .innerJoin(tasks, eq(tasks.id, comments.taskId))
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(
      and(
        eq(comments.id, commentId),
        eq(comments.authorId, membership.userId),
        eq(journeys.organizationId, membership.organizationId),
      ),
    )
    .limit(1);

  if (!row) return;

  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath(`/journeys/${row.journeyId}`);
}
