import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { isUuid } from "./ids";
import { activityEvents, activityType, comments, journeys, tasks } from "../schema";
import { resolveMembers } from "./members-lookup";
import type { Member, Task } from "@/types";

/** Lectures liées à une tâche. Toutes scopées par organisation. */

export type Comment = {
  id: string;
  body: string;
  author: Member | null;
  createdAt: Date;
};

export type TaskDetail = {
  task: Task;
  journeyId: string;
  journeySubject: string;
  totalSteps: number;
  comments: Comment[];
};

export async function getTaskDetail(
  organizationId: string,
  taskId: string,
): Promise<TaskDetail | null> {
  if (!isUuid(taskId)) return null;

  const [row] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      assigneeId: tasks.assigneeId,
      position: tasks.position,
      dueDate: tasks.dueDate,
      status: tasks.status,
      journeyId: journeys.id,
      journeySubject: journeys.subjectName,
    })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    // Le filtre sur l'organisation empêche d'ouvrir, via `?task=`, une tâche
    // appartenant à une autre organisation.
    .where(and(eq(tasks.id, taskId), eq(journeys.organizationId, organizationId)))
    .limit(1);

  if (!row) return null;

  const siblings = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.journeyId, row.journeyId));

  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      authorId: comments.authorId,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.taskId, taskId))
    .orderBy(asc(comments.createdAt));

  const members = await resolveMembers([
    row.assigneeId,
    ...commentRows.map((c) => c.authorId),
  ]);

  const task: Task = {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    assignee: row.assigneeId ? members.get(row.assigneeId) ?? null : null,
    dueDate: row.dueDate,
    status: row.status,
    position: row.position,
  };

  return {
    task,
    journeyId: row.journeyId,
    journeySubject: row.journeySubject,
    totalSteps: siblings.length,
    comments: commentRows.map((c) => ({
      id: c.id,
      body: c.body,
      author: c.authorId ? members.get(c.authorId) ?? null : null,
      createdAt: c.createdAt,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Historique d'activité                                               */
/* ------------------------------------------------------------------ */

/**
 * Les types d'événement, dérivés de l'énumération Postgres.
 *
 * Ici la dérivation est le bon sens de dépendance : l'historique doit
 * **raconter** tout ce que la base sait écrire. Typer `type: string` laissait
 * la timeline afficher un type brut à l'écran si quelqu'un ajoutait une valeur
 * à l'énumération sans lui donner de libellé — et rien ne le signalait.
 * Maintenant, la carte des libellés est un `Record` sur ce type : une valeur
 * ajoutée sans libellé casse la compilation.
 */
export type ActivityEventType = (typeof activityType.enumValues)[number];

export type ActivityEntry = {
  id: string;
  type: ActivityEventType;
  actor: Member | null;
  taskTitle: string | null;
  createdAt: Date;
};

export async function getJourneyActivity(
  organizationId: string,
  journeyId: string,
  limit = 40,
): Promise<ActivityEntry[]> {
  if (!isUuid(journeyId)) return [];

  const rows = await db
    .select({
      id: activityEvents.id,
      type: activityEvents.type,
      actorId: activityEvents.actorId,
      taskTitle: tasks.title,
      createdAt: activityEvents.createdAt,
    })
    .from(activityEvents)
    .innerJoin(journeys, eq(journeys.id, activityEvents.journeyId))
    .leftJoin(tasks, eq(tasks.id, activityEvents.taskId))
    .where(
      and(
        eq(activityEvents.journeyId, journeyId),
        eq(journeys.organizationId, organizationId),
      ),
    )
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);

  const members = await resolveMembers(rows.map((r) => r.actorId));

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    actor: row.actorId ? members.get(row.actorId) ?? null : null,
    taskTitle: row.taskTitle,
    createdAt: row.createdAt,
  }));
}
