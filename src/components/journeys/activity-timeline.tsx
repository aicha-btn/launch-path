import { formatDateTime } from "@/lib/dates";
import { Avatar } from "@/components/ui";
import type {
  ActivityEntry,
  ActivityEventType,
} from "@/server/db/queries/tasks";

/**
 * Historique construit depuis `activity_events`.
 *
 * Les libellés sont écrits ici et non stockés en base : un jour on voudra
 * reformuler « a terminé » en autre chose, et réécrire l'historique pour
 * changer un libellé serait absurde. La base stocke le FAIT, l'interface le
 * raconte.
 */

/**
 * `Record<ActivityEventType, …>` et non `Record<string, …>` : c'est le
 * compilateur qui exige désormais un libellé pour chaque type d'événement que
 * la base sait écrire. Avec `string` en clé, ajouter une valeur à
 * l'énumération passait sans bruit et la timeline affichait le type brut.
 */
export const LABEL: Record<
  ActivityEventType,
  (taskTitle: string | null) => string
> = {
  journey_launched: () => "a lancé l'onboarding",
  journey_cancelled: () => "a annulé l'onboarding",
  task_completed: (t) => `a terminé ${quote(t)}`,
  task_reopened: (t) => `a rouvert ${quote(t)}`,
  task_skipped: (t) => `a ignoré ${quote(t)}`,
  task_assigned: (t) => `a réassigné ${quote(t)}`,
  task_due_date_changed: (t) => `a déplacé l'échéance de ${quote(t)}`,
  comment_added: (t) => `a commenté ${quote(t)}`,
};

function quote(title: string | null): string {
  return title ? `« ${title} »` : "une étape supprimée";
}

function describe(entry: ActivityEntry): string {
  // La carte est exhaustive par construction ; le repli protège le cas où une
  // migration ajouterait une valeur en base avant que le code ne soit déployé.
  const build = LABEL[entry.type] as
    | ((taskTitle: string | null) => string)
    | undefined;
  return build ? build(entry.taskTitle) : entry.type;
}

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-5 text-[13px] text-ink-70">
        Aucune activité enregistrée pour le moment.
      </p>
    );
  }

  return (
    <ul className="mt-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-ink-15 py-3"
        >
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-45">
            {formatDateTime(entry.createdAt)}
          </span>

          <span className="flex min-w-0 items-center gap-2">
            {entry.actor && <Avatar member={entry.actor} />}
            <span className="text-[13px] text-ink">
              <strong className="font-semibold">
                {entry.actor?.name ?? "Quelqu'un"}
              </strong>{" "}
              <span className="text-ink-70">{describe(entry)}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
