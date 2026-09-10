import { PathRail, completedCount } from "@/components/path-rail";
import type { Task } from "@/types";

/**
 * Rail de parcours : l'ancien "folio" reste comme API publique du composant,
 * mais sa forme devient le langage LaunchPath : checkpoints + segments.
 */

export function Folio({ tasks }: { tasks: Task[] }) {
  return <PathRail tasks={tasks} />;
}

/** Version compacte, sans numéro — pour les listes. */
export function FolioCompact({ tasks }: { tasks: Task[] }) {
  const done = completedCount(tasks);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <PathRail tasks={tasks} compact className="flex-1" />
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-muted">
        {done}/{tasks.length}
      </span>
    </div>
  );
}
