import { lateDays } from "@/lib/dates";
import type { Task } from "@/types";

/**
 * Le composant identitaire du produit — docs/design-system.md § 9.2.
 *
 * Les étapes deviennent des numéros de page : une rangée de carrés
 * numérotés, empruntée à la pagination d'un livre. Il dit trois choses
 * qu'une barre de progression ne dit pas — combien d'étapes au total,
 * laquelle est en retard, et où l'on en est dans la séquence.
 */

type FolioState = "done" | "todo" | "skipped" | "late";

const STATE_LABEL: Record<FolioState, string> = {
  done: "terminée",
  todo: "à faire",
  skipped: "ignorée",
  late: "en retard",
};

export function folioState(task: Task): FolioState {
  if (task.status === "done") return "done";
  if (task.status === "skipped") return "skipped";
  return lateDays(task.dueDate) > 0 ? "late" : "todo";
}

const CELL: Record<FolioState, string> = {
  done: "border-offset bg-offset text-paper",
  todo: "border-ink-30 bg-transparent text-ink-45",
  skipped: "border-ink-15 bg-ink-08 text-ink-30 line-through",
  late: "border-correction bg-correction text-paper",
};

export function Folio({ tasks }: { tasks: Task[] }) {
  return (
    <ol
      className="motion-folio flex flex-wrap gap-[3px]"
      aria-label={`Progression : ${tasks.length} étapes`}
    >
      {tasks.map((task) => {
        const state = folioState(task);
        return (
          <li
            key={task.id}
            title={`${task.title} — ${STATE_LABEL[state]}`}
            className={`grid h-6 w-6 place-items-center border font-mono text-[10px] tabular-nums ${CELL[state]}`}
          >
            {String(task.position).padStart(2, "0")}
            <span className="sr-only">{STATE_LABEL[state]}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Version compacte, sans numéro — pour les listes. */
export function FolioCompact({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((t) => t.status !== "todo").length;

  return (
    <div className="flex items-center gap-3">
      <ol
        className="motion-folio flex flex-wrap gap-[2px]"
        aria-label={`${done} étapes sur ${tasks.length} traitées`}
      >
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`h-2.5 w-2.5 border ${CELL[folioState(task)]}`}
          />
        ))}
      </ol>
      <span className="font-mono text-[11px] tabular-nums text-ink-70">
        {done}/{tasks.length}
      </span>
    </div>
  );
}
