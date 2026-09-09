import { notFound } from "next/navigation";
import { Masthead } from "@/components/masthead";
import { Folio } from "@/components/folio";
import { JourneyStatusLabel, SectionRule, Stamp } from "@/components/marks";
import { ActivityTimeline } from "@/components/journeys/activity-timeline";
import { TaskRow } from "@/components/journeys/task-row";
import { TaskSheet } from "@/components/journeys/task-sheet";
import { Avatar, Button } from "@/components/ui";
import { daysBetween, formatShort, lateDays } from "@/lib/dates";
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

  const done = journey.tasks.filter((t) => t.status !== "todo").length;
  const late = journey.tasks.filter(
    (t) => t.status === "todo" && lateDays(t.dueDate) > 0,
  ).length;

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
                className="inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink"
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
                  className="inline-flex h-9 items-center border border-ink px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-colors duration-[120ms] hover:bg-ink-08"
                >
                  Annuler
                </button>
              </form>
            </>
          )
        }
      />

      <div className="px-6 py-10 sm:px-10">
        {/* Le tampon incliné : une seule fois par page, ici. */}
        <div className="flex flex-wrap items-center gap-4">
          <JourneyStatusLabel status={journey.status} />
          {late > 0 && (
            <Stamp tilted>{`Retard ${late} tâche${late > 1 ? "s" : ""}`}</Stamp>
          )}
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
            <Avatar member={journey.owner} /> {journey.owner.name}
          </span>
        </div>

        {/* Le composant héros : la progression en folios numérotés. */}
        <div className="mt-8">
          <Folio tasks={journey.tasks} />
        </div>

        <div className="mt-14 space-y-12">
          {groupByWeek(journey.tasks, journey.startDate).map(([week, tasks]) => (
            <section key={week}>
              <SectionRule count={tasks.length}>{weekLabel(week)}</SectionRule>
              <ul>
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

        <section className="mt-14">
          <SectionRule count={activity.length}>Historique</SectionRule>
          <ActivityTimeline entries={activity} />
        </section>
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
