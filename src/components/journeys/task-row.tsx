"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { lateDays } from "@/lib/dates";
import { DueBadge, OwnerBadge } from "@/components/path-rail";
import { setTaskStatus } from "@/server/actions/journeys";
import type { Task, TaskStatus } from "@/types";

/**
 * Ligne de checkpoint. Composant unique pour les quatre contextes :
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

  const visualTask = { ...task, status };

  const boxClasses = `motion-avatar grid h-5 w-5 place-items-center rounded-full border-[2px] transition-colors duration-[120ms] ${
    done
      ? "border-success bg-success"
      : skipped
        ? "border-line bg-surface-muted"
        : late > 0
          ? "border-overdue bg-overdue-soft"
          : "border-primary bg-surface"
  }`;

  const mark = done ? (
    <span className="text-[11px] font-bold leading-none text-surface">✓</span>
  ) : null;

  const titleClasses = `truncate text-[13px] font-semibold sm:text-sm ${
    done
      ? "text-text-soft line-through"
      : skipped
        ? "text-text-soft"
        : "text-text"
  }`;

  return (
    <div
      className={`motion-row grid min-h-[58px] grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 transition-colors duration-[120ms] hover:border-primary-soft hover:bg-surface-raised sm:grid-cols-[20px_minmax(0,1fr)_auto_auto_128px] sm:gap-4 ${
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
          className={`${boxClasses} ${done ? "" : "hover:border-primary hover:bg-primary-soft"}`}
        >
          {mark}
        </button>
      )}

      <div className="min-w-0">
        <p className="min-w-0">
          {titleHref ? (
            <Link href={titleHref} className="motion-link inline-block max-w-full no-underline hover:underline">
              <span className={titleClasses}>{task.title}</span>
            </Link>
          ) : (
            <span className={titleClasses}>{task.title}</span>
          )}
          {skipped && (
            <span className="text-action ml-2 text-line-strong">
              Ignorée
            </span>
          )}
        </p>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <OwnerBadge member={task.assignee} showName={false} />
      </div>

      {/* Le statut `skipped` doit être atteignable depuis l'interface. */}
      <div className="hidden sm:block">
        {showSkip && !readOnly ? (
          <button
            type="button"
            onClick={() => submit(skipped ? "todo" : "skipped")}
            className="motion-link text-action"
          >
            {skipped ? "Réactiver" : "Ignorer"}
          </button>
        ) : null}
      </div>

      <div className="col-start-2 sm:col-start-5 sm:text-right">
        <DueBadge task={visualTask} />
      </div>
    </div>
  );
}
