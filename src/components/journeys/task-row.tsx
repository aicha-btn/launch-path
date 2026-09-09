"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { formatShort, lateDays, today } from "@/lib/dates";
import { Stamp } from "@/components/marks";
import { Avatar } from "@/components/ui";
import { setTaskStatus } from "@/server/actions/journeys";
import type { Task, TaskStatus } from "@/types";

/**
 * LA ligne du registre — § 9.3. Composant unique pour les quatre contextes :
 *
 *   page d'un parcours  → titre ouvrant le panneau `?task=`, action « ignorer »
 *   dashboard           → titre menant au parcours
 *   mes tâches          → idem
 *   landing publique    → `readOnly`, aucune action
 *
 * Avant, deux composants coexistaient (`LedgerRow` et `TaskRow`) : la même
 * ligne dessinée deux fois, qui aurait fini par diverger.
 *
 * `useOptimistic` : la case se coche immédiatement, avant la réponse du
 * serveur. Cocher est LE geste du produit, il ne doit jamais donner
 * l'impression d'attendre. Si l'action échoue, React restaure l'état.
 */
export function TaskRow({
  task,
  titleHref,
  showSkip = false,
  readOnly = false,
}: {
  task: Task;
  titleHref?: string;
  /** Bouton « ignorer » — utile uniquement sur la page d'un parcours. */
  showSkip?: boolean;
  /** Aucune action : pour la page publique, qui n'a pas de session. */
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setOptimistic] = useOptimistic<TaskStatus, TaskStatus>(
    task.status,
    (_current, next) => next,
  );

  const done = status === "done";
  const skipped = status === "skipped";
  const late = lateDays(task.dueDate);
  const dueToday = task.dueDate === today() && !done && !skipped;

  function submit(next: TaskStatus) {
    startTransition(async () => {
      setOptimistic(next);

      const data = new FormData();
      data.set("taskId", task.id);
      data.set("status", next);

      const result = await setTaskStatus(data);

      /**
       * Sans ce message, un refus serveur était invisible : la case se cochait
       * par mise à jour optimiste, puis revenait toute seule à son état
       * précédent, sans que l'utilisateur sache pourquoi. La mise à jour
       * optimiste ne doit jamais masquer un échec.
       */
      if (!result.ok) {
        toast.error("Modification refusée", { description: result.error });
      }
    });
  }

  const boxClasses = `grid h-4 w-4 place-items-center border transition-colors duration-[120ms] ${
    done
      ? "border-offset bg-offset"
      : skipped
        ? "border-ink-15 bg-ink-08"
        : "border-ink-30"
  }`;

  const mark = done ? (
    <span className="font-mono text-[10px] leading-none text-paper">✕</span>
  ) : null;

  const titleClasses = `truncate text-[13px] font-semibold sm:text-sm ${
    done ? "text-ink-45 line-through" : skipped ? "text-ink-30" : "text-ink"
  }`;

  return (
    <div
      className={`grid min-h-10 grid-cols-[16px_1fr_auto] items-center gap-3 border-b border-ink-15 px-2 py-2 transition-colors duration-[120ms] hover:bg-ink-08 sm:grid-cols-[16px_1fr_auto_auto_92px] sm:gap-4 sm:py-0 ${
        pending ? "opacity-60" : ""
      }`}
    >
      {readOnly ? (
        <span aria-hidden className={boxClasses}>
          {mark}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => submit(done ? "todo" : "done")}
          aria-pressed={done}
          aria-label={
            done ? `Rouvrir « ${task.title} »` : `Terminer « ${task.title} »`
          }
          className={`${boxClasses} ${done ? "" : "hover:border-ink"}`}
        >
          {mark}
        </button>
      )}

      <div className="min-w-0">
        <p className="min-w-0">
          {titleHref ? (
            <Link href={titleHref} className="no-underline hover:underline">
              <span className={titleClasses}>{task.title}</span>
            </Link>
          ) : (
            <span className={titleClasses}>{task.title}</span>
          )}
          {skipped && (
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-30">
              Ignorée
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {task.assignee ? (
          <Avatar member={task.assignee} />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-30">
            Non assignée
          </span>
        )}
      </div>

      {/* Le statut `skipped` doit être atteignable depuis l'interface. */}
      <div className="hidden sm:block">
        {showSkip && !readOnly ? (
          <button
            type="button"
            onClick={() => submit(skipped ? "todo" : "skipped")}
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline transition-colors duration-[120ms] hover:text-ink"
          >
            {skipped ? "Réactiver" : "Ignorer"}
          </button>
        ) : null}
      </div>

      <div className="col-start-2 sm:col-start-5 sm:text-right">
        {late > 0 && !done && !skipped ? (
          <Stamp>{`Retard ${late} j`}</Stamp>
        ) : (
          <span
            className={`font-mono text-[12px] tabular-nums ${
              dueToday
                ? "text-ink underline decoration-1 underline-offset-[3px]"
                : done || skipped
                  ? "text-ink-30"
                  : "text-ink-70"
            }`}
          >
            {formatShort(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
