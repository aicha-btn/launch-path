import Link from "next/link";
import { Masthead } from "@/components/masthead";
import { FolioCompact } from "@/components/folio";
import { JourneyStatusLabel, SectionRule, Stamp } from "@/components/marks";
import { Button, EmptyState, Figure } from "@/components/ui";
import { TaskRow } from "@/components/journeys/task-row";
import { formatLong, formatShort, lateDays, today } from "@/lib/dates";
import { requireMembership } from "@/server/auth/session";
import {
  getActiveJourneys,
  getDashboardCounts,
  getLateTasks,
} from "@/server/db/queries/journeys";

export default async function DashboardPage() {
  const membership = await requireMembership();
  const org = membership.organizationId;

  // Trois requêtes en parallèle : elles ne dépendent pas les unes des autres.
  const [counts, active, lateTasks] = await Promise.all([
    getDashboardCounts(org),
    getActiveJourneys(org),
    getLateTasks(org),
  ]);

  return (
    <>
      <Masthead
        kicker={`Synthèse · ${formatLong(today())}`}
        title={membership.organizationName}
        actions={<Button href="/journeys/new">Lancer un onboarding</Button>}
      />

      <div className="motion-page px-6 py-10 sm:px-10">
        {/* Chaque encre garde son sens : bleu pour la structure, jaune pour
            l'emphase, rouge pour le seul retard. Les compteurs viennent de
            requêtes SQL, pas d'un filtre en mémoire. */}
        <div className="motion-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Figure tone="offset" value={counts.activeJourneys} label="Onboardings actifs" />
          <Figure tone="correction" value={counts.lateTasks} label="Tâches en retard" />
          <Figure tone="signal" value={counts.dueSoon} label="Dues sous 7 jours" />
          <Figure tone="paper" value={counts.completedThisMonth} label="Terminés ce mois" />
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
          <section className="motion-rise mt-14">
            <SectionRule count={active.length}>Parcours actifs</SectionRule>

            <ul>
              {active.map((journey) => {
                const late = journey.tasks.filter(
                  (t) => t.status === "todo" && lateDays(t.dueDate) > 0,
                ).length;
                const next = journey.tasks.find((t) => t.status === "todo");

                return (
                  <li
                    key={journey.id}
                    className="motion-row border-b border-ink-15 transition-colors duration-[120ms] hover:bg-ink-08"
                  >
                    <Link
                      href={`/journeys/${journey.id}`}
                      className="grid gap-3 px-2 py-4 no-underline sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-ink">
                          {journey.subjectName}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
                          {journey.templateName}
                        </p>
                      </div>

                      <FolioCompact tasks={journey.tasks} />

                      <div className="sm:w-[140px] sm:text-right">
                        {late > 0 ? (
                          <Stamp>{`Retard ${late} tâche${late > 1 ? "s" : ""}`}</Stamp>
                        ) : next ? (
                          <span className="font-mono text-[12px] tabular-nums text-ink-70">
                            {formatShort(next.dueDate)}
                          </span>
                        ) : (
                          <JourneyStatusLabel status={journey.status} />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Le seul bloc rouge de la page. */}
        {lateTasks.length > 0 && (
          <section className="motion-rise mt-14">
            <SectionRule count={lateTasks.length}>Tâches en retard</SectionRule>
            <ul>
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
