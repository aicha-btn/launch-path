import Link from "next/link";
import { Masthead } from "@/components/masthead";
import { SectionRule } from "@/components/marks";
import { DueBadge, OwnerBadge, currentTask } from "@/components/path-rail";
import { JourneyCard } from "@/components/journeys/journey-card";
import { Button, EmptyState, Figure } from "@/components/ui";
import { TaskRow } from "@/components/journeys/task-row";
import { formatLong, today } from "@/lib/dates";
import { requireMembership } from "@/server/auth/session";
import {
  getActiveJourneys,
  getDashboardCounts,
  type LateTask,
  getLateTasks,
} from "@/server/db/queries/journeys";

type NextAction = LateTask & { tone: "attention" | "current" };

function nextActions(
  active: Awaited<ReturnType<typeof getActiveJourneys>>,
  lateTasks: LateTask[],
) {
  const map = new Map<string, NextAction>();

  for (const item of lateTasks) {
    map.set(item.task.id, { ...item, tone: "attention" });
  }

  for (const journey of active) {
    const task = currentTask(journey.tasks);
    if (!task || map.has(task.id)) continue;
    map.set(task.id, {
      task,
      journeyId: journey.id,
      subjectName: journey.subjectName,
      tone: "current",
    });
  }

  return [...map.values()].sort((a, b) =>
    a.task.dueDate.localeCompare(b.task.dueDate),
  );
}

export default async function DashboardPage() {
  const membership = await requireMembership();
  const org = membership.organizationId;

  // Trois requêtes en parallèle : elles ne dépendent pas les unes des autres.
  const [counts, active, lateTasks] = await Promise.all([
    getDashboardCounts(org),
    getActiveJourneys(org),
    getLateTasks(org),
  ]);
  const actions = nextActions(active, lateTasks);
  const focus = actions[0] ?? null;

  return (
    <>
      <Masthead
        kicker={`Synthèse · ${formatLong(today())}`}
        title={membership.organizationName}
        actions={<Button href="/journeys/new">Lancer un onboarding</Button>}
      />

      <div className="motion-page mx-auto max-w-[1180px] px-6 py-8 sm:px-10">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <section className="motion-card rounded-lg border border-line bg-surface-raised p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
                  Prochaine action
                </p>
                <h2 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.01em] text-text">
                  {focus
                    ? "Le prochain checkpoint est clair."
                    : "Tout est sous contrôle aujourd'hui."}
                </h2>
              </div>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary-text">
                {actions.length} action{actions.length > 1 ? "s" : ""}
              </span>
            </div>

            {focus ? (
              <Link
                href={`/journeys/${focus.journeyId}?task=${focus.task.id}`}
                className="mt-6 grid gap-4 rounded-md border border-line bg-surface p-4 no-underline transition-colors duration-[160ms] hover:border-primary-soft hover:bg-primary-soft/40 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-semibold text-text">
                    {focus.task.title}
                  </p>
                  <p className="mt-1 text-[13px] text-text-muted">
                    {focus.subjectName}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <OwnerBadge member={focus.task.assignee} />
                    <DueBadge task={focus.task} />
                  </div>
                </div>
                <span className="self-end text-[13px] font-semibold text-primary-text">
                  Ouvrir le checkpoint
                </span>
              </Link>
            ) : (
              <div className="mt-6 rounded-md border border-line bg-surface p-4 text-[13px] leading-relaxed text-text-muted">
                Aucun checkpoint ne demande une intervention immédiate. Les
                parcours actifs peuvent continuer leur trajectoire.
              </div>
            )}
          </section>

          <section className="motion-stagger grid grid-cols-2 gap-3">
            <Figure
              tone="offset"
              value={counts.activeJourneys}
              label="Parcours actifs"
            />
            <Figure
              tone="correction"
              value={counts.lateTasks}
              label="Checkpoints en retard"
            />
            <Figure tone="signal" value={counts.dueSoon} label="À venir sous 7 jours" />
            <Figure
              tone="paper"
              value={counts.completedThisMonth}
              label="Arrivés à destination"
            />
          </section>
        </div>

        {active.length === 0 ? (
          <div className="mt-14">
            <EmptyState
              title="Aucun départ programmé."
              action={<Button href="/journeys/new">Lancer un onboarding</Button>}
            >
              Créez un parcours type, puis lancez-le pour une nouvelle recrue :
              les tâches et leurs échéances apparaîtront ici.
            </EmptyState>
          </div>
        ) : (
          <section className="motion-rise mt-10">
            <SectionRule count={active.length}>Parcours actifs</SectionRule>

            <div className="motion-stagger mt-4 grid gap-4 lg:grid-cols-2">
              {active.map((journey) => (
                <JourneyCard key={journey.id} journey={journey} />
              ))}
            </div>
          </section>
        )}

        {lateTasks.length > 0 && (
          <section className="motion-rise mt-10">
            <SectionRule count={lateTasks.length}>Checkpoints à rattraper</SectionRule>
            <ul className="mt-4 space-y-2">
              {lateTasks.map(({ task, journeyId }) => (
                <li key={task.id}>
                  <TaskRow task={task} titleHref={`/journeys/${journeyId}?task=${task.id}`} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
