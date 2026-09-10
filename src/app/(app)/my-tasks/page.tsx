import { Masthead } from "@/components/masthead";
import { SectionRule } from "@/components/marks";
import { TaskRow } from "@/components/journeys/task-row";
import { Button, EmptyState } from "@/components/ui";
import { daysBetween, lateDays, today } from "@/lib/dates";
import { requireMembership } from "@/server/auth/session";
import { getMyTasks, type LateTask } from "@/server/db/queries/journeys";

export default async function MyTasksPage() {
  const membership = await requireMembership();
  const mine = await getMyTasks(membership.organizationId, membership.userId);

  const T = today();

  const groups: { label: string; items: LateTask[] }[] = [
    {
      label: "En retard",
      items: mine.filter(({ task }) => lateDays(task.dueDate) > 0),
    },
    {
      label: "Aujourd'hui",
      items: mine.filter(({ task }) => task.dueDate === T),
    },
    {
      label: "7 prochains jours",
      items: mine.filter(({ task }) => {
        const delta = daysBetween(T, task.dueDate);
        return delta >= 1 && delta <= 7;
      }),
    },
    {
      label: "Plus tard",
      items: mine.filter(({ task }) => daysBetween(T, task.dueDate) > 7),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      <Masthead
        kicker={`Mes tâches · ${mine.length} à traiter`}
        title="Mes tâches"
      />

      <div className="motion-page px-6 py-10 sm:px-10">
        {groups.length === 0 ? (
          <EmptyState
            title="Rien ne vous attend."
            action={<Button href="/journeys">Voir les onboardings</Button>}
          >
            Aucune étape ne vous est assignée pour le moment. Les tâches
            apparaissent ici dès qu&apos;un onboarding vous en confie une.
          </EmptyState>
        ) : (
          <div className="motion-stagger space-y-12">
            {groups.map((group) => (
              <section key={group.label}>
                <SectionRule count={group.items.length}>
                  {group.label}
                </SectionRule>
                <ul>
                  {group.items.map(({ task, journeyId, subjectName }) => (
                    <li key={task.id}>
                      {/* Le nom de la personne concernée : sur cet écran, la
                          tâche est sortie de son contexte. */}
                      <p className="text-action px-2 pt-3">
                        {subjectName}
                      </p>
                      <TaskRow task={task} titleHref={`/journeys/${journeyId}?task=${task.id}`} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
