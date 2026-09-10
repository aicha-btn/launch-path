import { notFound } from "next/navigation";
import { Masthead } from "@/components/masthead";
import { Folio } from "@/components/folio";
import { JourneyStatusLabel, SectionRule, Stamp } from "@/components/marks";
import {
  DueBadge,
  JourneyPathPreview,
  OwnerBadge,
  completedCount,
  currentTask,
  nextTask,
  overdueCount,
} from "@/components/path-rail";
import { ActivityTimeline } from "@/components/journeys/activity-timeline";
import { TaskRow } from "@/components/journeys/task-row";
import { TaskSheet } from "@/components/journeys/task-sheet";
import { Button } from "@/components/ui";
import { daysBetween, formatShort } from "@/lib/dates";
import { cancelJourney, reopenJourney } from "@/server/actions/journeys";
import { requireMembership } from "@/server/auth/session";
import { getJourney } from "@/server/db/queries/journeys";
import { getMembers } from "@/server/db/queries/members";
import { memberFrom } from "@/server/db/queries/members-lookup";
import { getJourneyActivity, getTaskDetail } from "@/server/db/queries/tasks";
import type { Task } from "@/types";

/** Regroupe les tâches par semaine relative au démarrage. */
function groupByWeek(tasks: Task[], startDate: string) {
  const groups = new Map<number, Task[]>();

  for (const task of tasks) {
    const week = Math.floor(daysBetween(startDate, task.dueDate) / 7);
    groups.set(week, [...(groups.get(week) ?? []), task]);
  }

  return [...groups.entries()].sort(([a], [b]) => a - b);
}

function weekLabel(week: number) {
  if (week < 0) return "Avant l'arrivée";
  if (week === 0) return "Première semaine";
  return `Semaine ${week + 1}`;
}

export default async function JourneyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const [{ id }, { task: openTaskId }] = await Promise.all([
    params,
    searchParams,
  ]);

  const membership = await requireMembership();

  // Toutes ces requêtes filtrent sur l'organisation : un identifiant
  // appartenant à une autre organisation renvoie un 404, pas les données.
  const [journey, activity, memberRows] = await Promise.all([
    getJourney(membership.organizationId, id),
    getJourneyActivity(membership.organizationId, id),
    getMembers(membership.organizationId),
  ]);

  if (!journey) notFound();

  const members = memberRows
    .map((row) => memberFrom(row.userId, row.email))
    .filter((member): member is NonNullable<typeof member> => member !== null);

  // Le panneau ne s'ouvre que si la tâche appartient bien à CE parcours :
  // sinon `?task=` d'un autre parcours afficherait un contenu incohérent.
  const detail = openTaskId
    ? await getTaskDetail(membership.organizationId, openTaskId)
    : null;
  const openDetail = detail && detail.journeyId === journey.id ? detail : null;

  const done = completedCount(journey.tasks);
  const late = overdueCount(journey.tasks);
  const current = currentTask(journey.tasks);
  const next = nextTask(journey.tasks);

  return (
    <>
      <Masthead
        kicker={`Onboarding · ${journey.templateName}`}
        title={journey.subjectName}
        meta={[
          `DÉPART ${formatShort(journey.startDate)}`,
          `ÉTAPE ${done}/${journey.tasks.length}`,
          `PILOTE ${journey.owner.initials}`,
        ]}
        actions={
          journey.status === "cancelled" ? (
            <form action={reopenJourney}>
              <input type="hidden" name="journeyId" value={journey.id} />
              <button
                type="submit"
                className="motion-button primary-action"
              >
                Réactiver
              </button>
            </form>
          ) : (
            <>
              <Button href="/journeys" variant="secondary">
                Retour
              </Button>
              <form action={cancelJourney}>
                <input type="hidden" name="journeyId" value={journey.id} />
                <button
                  type="submit"
                  className="motion-button secondary-action"
                >
                  Annuler
                </button>
              </form>
            </>
          )
        }
      />

      <div className="motion-page mx-auto grid max-w-[1180px] gap-8 px-6 py-8 sm:px-10 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0">
          <div className="motion-card rounded-lg border border-line bg-surface-raised p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
                  Trajectoire
                </p>
                <p className="mt-2 max-w-[54ch] text-[13px] leading-relaxed text-text-muted">
                  Le parcours montre les checkpoints déjà franchis, la position
                  actuelle, et les étapes qui demandent une intervention.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <JourneyStatusLabel status={journey.status} />
                {late > 0 && (
                  <Stamp>{`${late} checkpoint${late > 1 ? "s" : ""} en retard`}</Stamp>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Folio tasks={journey.tasks} />
            </div>
          </div>

          <div className="motion-stagger mt-8 space-y-8">
            {groupByWeek(journey.tasks, journey.startDate).map(([week, tasks]) => (
              <section key={week}>
                <SectionRule count={tasks.length}>{weekLabel(week)}</SectionRule>
                <ul className="mt-3 space-y-2">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <TaskRow
                        task={task}
                        titleHref={`/journeys/${journey.id}?task=${task.id}`}
                        showSkip
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-10">
            <SectionRule count={activity.length}>Historique</SectionRule>
            <ActivityTimeline entries={activity} />
          </section>
        </section>

        <aside className="motion-rise h-fit rounded-lg border border-line bg-surface p-5 xl:sticky xl:top-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
            Position actuelle
          </p>

          <div className="mt-4 space-y-5">
            <div>
              <p className="text-[13px] font-medium text-text-muted">
                Checkpoint actuel
              </p>
              <p className="mt-1 text-[18px] font-semibold leading-tight text-text">
                {current?.title ?? "Destination atteinte"}
              </p>
              {current && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OwnerBadge member={current.assignee} />
                  <DueBadge task={current} />
                </div>
              )}
            </div>

            <div className="border-t border-line pt-5">
              <p className="text-[13px] font-medium text-text-muted">
                Checkpoint suivant
              </p>
              <p className="mt-1 text-[14px] font-semibold text-text">
                {next?.title ?? "Aucun checkpoint suivant"}
              </p>
              {next && (
                <div className="mt-3">
                  <DueBadge task={next} />
                </div>
              )}
            </div>

            <div className="border-t border-line pt-5">
              <p className="text-[13px] font-medium text-text-muted">
                Pilote du parcours
              </p>
              <div className="mt-2">
                <OwnerBadge member={journey.owner} />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-5">
              <div className="rounded-md bg-success-soft p-3 text-success">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  Fait
                </dt>
                <dd className="mt-2 font-mono text-[22px] tabular-nums">
                  {done}/{journey.tasks.length}
                </dd>
              </div>
              <div className="rounded-md bg-overdue-soft p-3 text-overdue">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                  Risque
                </dt>
                <dd className="mt-2 font-mono text-[22px] tabular-nums">
                  {late}
                </dd>
              </div>
            </dl>

            <div className="border-t border-line pt-5">
              <JourneyPathPreview tasks={journey.tasks} limit={5} />
            </div>
          </div>
        </aside>
      </div>

      {openDetail && (
        <TaskSheet
          detail={openDetail}
          members={members}
          closeHref={`/journeys/${journey.id}`}
          currentUserId={membership.userId}
        />
      )}
    </>
  );
}
