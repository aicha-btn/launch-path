import { and, asc, count, eq, gte, isNotNull, lt, lte, sql } from "drizzle-orm";
import { db } from "../index";
import { journeys, tasks } from "../schema";
import { isUuid } from "./ids";
import { resolveMembers } from "./members-lookup";
import { toBusinessDate } from "@/lib/dates";
import type { Journey, Member, Task } from "@/types";

/**
 * Toutes les lectures des parcours. Chaque fonction exige un
 * `organizationId` — décision d'architecture n° 4.
 *
 * « Aujourd'hui » est calculé en SQL dans le fuseau métier, jamais avec
 * `now()` brut : `CURRENT_DATE` dépend du fuseau de la session Postgres, en
 * pratique UTC. À 00h30 à Paris, il est encore la veille en UTC — une tâche
 * due la veille n'apparaîtrait pas en retard avant 2 h du matin.
 * Décision d'architecture n° 2.
 */
const TODAY = sql`(now() at time zone 'Europe/Paris')::date`;

/* ------------------------------------------------------------------ */
/* Compteurs du dashboard — en SQL                                     */
/* ------------------------------------------------------------------ */

export type DashboardCounts = {
  activeJourneys: number;
  lateTasks: number;
  dueSoon: number;
  completedThisMonth: number;
};

export async function getDashboardCounts(
  organizationId: string,
): Promise<DashboardCounts> {
  const [active] = await db
    .select({ value: count() })
    .from(journeys)
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "active"),
      ),
    );

  const [late] = await db
    .select({ value: count() })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "active"),
        eq(tasks.status, "todo"),
        lt(tasks.dueDate, TODAY),
      ),
    );

  const [soon] = await db
    .select({ value: count() })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "active"),
        eq(tasks.status, "todo"),
        gte(tasks.dueDate, TODAY),
        // `+ 7` reste une `date` ; `+ interval '7 days'` donnerait un timestamp.
        lte(tasks.dueDate, sql`${TODAY} + 7`),
      ),
    );

  const [completed] = await db
    .select({ value: count() })
    .from(journeys)
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "completed"),
        isNotNull(journeys.completedAt),
        gte(journeys.completedAt, sql`now() - interval '30 days'`),
      ),
    );

  return {
    activeJourneys: active?.value ?? 0,
    lateTasks: late?.value ?? 0,
    dueSoon: soon?.value ?? 0,
    completedThisMonth: completed?.value ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* Listes                                                             */
/* ------------------------------------------------------------------ */

type JourneyRowWithTasks = {
  id: string;
  subjectName: string;
  templateName: string;
  startDate: string;
  status: "active" | "completed" | "cancelled";
  completedAt: Date | null;
  ownerId: string | null;
  tasks: {
    id: string;
    title: string;
    description: string;
    assigneeId: string | null;
    position: number;
    dueDate: string;
    status: "todo" | "done" | "skipped";
  }[];
};

function toJourney(
  row: JourneyRowWithTasks,
  members: Map<string, Member>,
): Journey {
  const owner =
    (row.ownerId ? members.get(row.ownerId) : null) ??
    ({ id: "unknown", name: "(sans pilote)", initials: "—" } satisfies Member);

  const list: Task[] = row.tasks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      assignee: task.assigneeId ? members.get(task.assigneeId) ?? null : null,
      dueDate: task.dueDate,
      status: task.status,
      position: task.position,
    }));

  return {
    id: row.id,
    subjectName: row.subjectName,
    templateName: row.templateName,
    owner,
    startDate: row.startDate,
    status: row.status,
    // `toBusinessDate` et non `toISOString()` : un parcours terminé à 23h30
    // à Paris serait daté de la veille.
    completedAt: row.completedAt ? toBusinessDate(row.completedAt) : undefined,
    tasks: list,
  };
}

/**
 * @param status filtre optionnel, appliqué EN SQL.
 *
 * Le filtre doit descendre dans la requête : charger tous les parcours avec
 * toutes leurs tâches pour n'en garder que les actifs coûterait de plus en
 * plus cher à mesure que l'historique grossit.
 */
export async function getJourneys(
  organizationId: string,
  status?: "active" | "completed" | "cancelled",
): Promise<Journey[]> {
  const rows = await db.query.journeys.findMany({
    where: (j, { and: a, eq: e }) =>
      status
        ? a(e(j.organizationId, organizationId), e(j.status, status))
        : e(j.organizationId, organizationId),
    orderBy: (j, { desc }) => [desc(j.createdAt)],
    with: { tasks: { orderBy: (t, { asc }) => [asc(t.position)] } },
  });

  const members = await resolveMembers([
    ...rows.map((r) => r.ownerId),
    ...rows.flatMap((r) => r.tasks.map((t) => t.assigneeId)),
  ]);

  return rows.map((row) => toJourney(row as JourneyRowWithTasks, members));
}

export function getActiveJourneys(organizationId: string): Promise<Journey[]> {
  return getJourneys(organizationId, "active");
}

/**
 * Nombre de parcours actifs de l'organisation, **indépendamment de tout
 * filtre d'affichage**.
 *
 * Existe parce que l'en-tête de la liste le déduisait du résultat filtré :
 * choisir « Terminés » affichait « 0 en cours », ce qui est faux. Un sur-titre
 * annonce un fait sur l'organisation, pas sur la vue courante.
 */
export async function countActiveJourneys(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(journeys)
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "active"),
      ),
    );

  return row?.value ?? 0;
}

/* ------------------------------------------------------------------ */
/* Recherche et filtres                                                */
/* ------------------------------------------------------------------ */

export type JourneyFilters = {
  /** Recherche sur le nom de la personne ou du client. */
  q?: string;
  status?: "active" | "completed" | "cancelled";
  ownerId?: string;
  /** Uniquement les parcours ayant au moins une tâche en retard. */
  lateOnly?: boolean;
  sort?: "next" | "recent";
};

/**
 * Tout est filtré et trié EN SQL, y compris ce qui est dérivé.
 *
 * « A-t-il des tâches en retard ? » et « quelle est sa prochaine échéance ? »
 * ne sont pas des colonnes : ce sont des agrégats sur les tâches. La
 * tentation serait de tout charger puis de trier en JavaScript — c'est
 * précisément ce qu'on refuse. Une sous-requête `exists` et une sous-requête
 * `min()` font le travail, et l'index partiel
 * `tasks (due_date) where status = 'todo'` les sert directement.
 */
export async function getFilteredJourneys(
  organizationId: string,
  filters: JourneyFilters,
): Promise<Journey[]> {
  /**
   * ATTENTION — identifiants écrits en dur, et c'est nécessaire.
   *
   * À l'intérieur de `db.query.x.findMany`, Drizzle réécrit les références
   * de colonnes passées dans un fragment `sql` en les préfixant de l'alias
   * de la table EXTÉRIEURE. Écrire `${tasks.journeyId}` produisait
   * `"journeys"."journey_id"` — une colonne qui n'existe pas, donc une
   * erreur Postgres 42703. Vérifié.
   *
   * On écrit donc les sous-requêtes en SQL littéral, avec des alias
   * distincts (`late_t`, `next_t`) pour ne pas entrer en collision avec
   * l'alias `journeys_tasks` généré par la jointure latérale.
   */
  const hasLateTask = sql`exists (
    select 1 from "tasks" late_t
     where late_t."journey_id" = "journeys"."id"
       and late_t."status" = 'todo'
       and late_t."due_date" < ${TODAY}
  )`;

  const nextDueDate = sql`(
    select min(next_t."due_date") from "tasks" next_t
     where next_t."journey_id" = "journeys"."id"
       and next_t."status" = 'todo'
  )`;

  const rows = await db.query.journeys.findMany({
    where: (j, { and: a, eq: e, ilike }) => {
      const conditions = [e(j.organizationId, organizationId)];

      // `ilike` : la recherche ne doit pas dépendre de la casse ni obliger
      // l'utilisateur à taper le nom exact.
      if (filters.q) conditions.push(ilike(j.subjectName, `%${filters.q}%`));
      if (filters.status) conditions.push(e(j.status, filters.status));
      if (filters.ownerId) conditions.push(e(j.ownerId, filters.ownerId));
      if (filters.lateOnly) conditions.push(hasLateTask);

      return a(...conditions);
    },
    orderBy: (j, { desc }) =>
      filters.sort === "next"
        ? // `nulls last` : un parcours sans tâche à faire n'a pas de
          // prochaine échéance, il passe en fin de liste plutôt qu'en tête.
          [sql`${nextDueDate} asc nulls last`]
        : [desc(j.createdAt)],
    with: { tasks: { orderBy: (t, { asc }) => [asc(t.position)] } },
  });

  const members = await resolveMembers([
    ...rows.map((r) => r.ownerId),
    ...rows.flatMap((r) => r.tasks.map((t) => t.assigneeId)),
  ]);

  return rows.map((row) => toJourney(row as JourneyRowWithTasks, members));
}

export async function getJourney(
  organizationId: string,
  journeyId: string,
): Promise<Journey | null> {
  // Un identifiant mal formé doit donner un 404, pas une erreur Postgres.
  if (!isUuid(journeyId)) return null;

  const row = await db.query.journeys.findFirst({
    // Le filtre sur l'organisation n'est pas décoratif : sans lui, changer
    // l'identifiant dans l'URL donnerait accès au parcours d'une autre
    // organisation.
    where: (j, { and: a, eq: e }) =>
      a(e(j.id, journeyId), e(j.organizationId, organizationId)),
    with: { tasks: { orderBy: (t, { asc }) => [asc(t.position)] } },
  });

  if (!row) return null;

  const members = await resolveMembers([
    row.ownerId,
    ...row.tasks.map((t) => t.assigneeId),
  ]);

  return toJourney(row as JourneyRowWithTasks, members);
}

/* ------------------------------------------------------------------ */
/* Tâches en retard, tous parcours confondus                           */
/* ------------------------------------------------------------------ */

export type LateTask = { task: Task; journeyId: string; subjectName: string };

export async function getLateTasks(
  organizationId: string,
): Promise<LateTask[]> {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      assigneeId: tasks.assigneeId,
      position: tasks.position,
      dueDate: tasks.dueDate,
      status: tasks.status,
      journeyId: journeys.id,
      subjectName: journeys.subjectName,
    })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "active"),
        eq(tasks.status, "todo"),
        lt(tasks.dueDate, TODAY),
      ),
    )
    .orderBy(asc(tasks.dueDate));

  const members = await resolveMembers(rows.map((r) => r.assigneeId));

  return rows.map((row) => ({
    journeyId: row.journeyId,
    subjectName: row.subjectName,
    task: {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      assignee: row.assigneeId ? members.get(row.assigneeId) ?? null : null,
      dueDate: row.dueDate,
      status: row.status,
      position: row.position,
    },
  }));
}

/* ------------------------------------------------------------------ */
/* Mes tâches                                                          */
/* ------------------------------------------------------------------ */

export async function getMyTasks(
  organizationId: string,
  userId: string,
): Promise<LateTask[]> {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      assigneeId: tasks.assigneeId,
      position: tasks.position,
      dueDate: tasks.dueDate,
      status: tasks.status,
      journeyId: journeys.id,
      subjectName: journeys.subjectName,
    })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    .where(
      and(
        eq(journeys.organizationId, organizationId),
        eq(journeys.status, "active"),
        eq(tasks.status, "todo"),
        eq(tasks.assigneeId, userId),
      ),
    )
    .orderBy(asc(tasks.dueDate));

  const members = await resolveMembers([userId]);

  return rows.map((row) => ({
    journeyId: row.journeyId,
    subjectName: row.subjectName,
    task: {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      assignee: members.get(userId) ?? null,
      dueDate: row.dueDate,
      status: row.status,
      position: row.position,
    },
  }));
}
