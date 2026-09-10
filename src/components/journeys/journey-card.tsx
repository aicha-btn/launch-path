import Link from "next/link";
import {
  DueBadge,
  OwnerBadge,
  PathRail,
  completedCount,
  currentTask,
  nextTask,
  overdueCount,
} from "@/components/path-rail";
import type { Journey } from "@/types";

function healthCopy(journey: Journey) {
  const overdue = overdueCount(journey.tasks);

  if (journey.status === "completed") {
    return {
      label: "Parcours terminé",
      className: "bg-success-soft text-success",
    };
  }

  if (journey.status === "cancelled") {
    return {
      label: "Parcours annulé",
      className: "bg-surface-muted text-text-soft",
    };
  }

  if (overdue > 0) {
    return {
      label: `${overdue} checkpoint${overdue > 1 ? "s" : ""} en retard`,
      className: "bg-overdue-soft text-overdue",
    };
  }

  return {
    label: "Sur la trajectoire",
    className: "bg-success-soft text-success",
  };
}

export function JourneyCard({ journey }: { journey: Journey }) {
  const current = currentTask(journey.tasks);
  const next = nextTask(journey.tasks);
  const health = healthCopy(journey);
  const done = completedCount(journey.tasks);

  return (
    <Link
      href={`/journeys/${journey.id}`}
      className="motion-card group block rounded-lg border border-line bg-surface p-5 no-underline transition-colors duration-[160ms] hover:border-primary-soft hover:bg-surface-raised"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold tracking-[-0.01em] text-text">
            {journey.subjectName}
          </p>
          <p className="mt-1 truncate text-[13px] text-text-muted">
            {journey.templateName}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${health.className}`}
        >
          {health.label}
        </span>
      </div>

      <PathRail tasks={journey.tasks} compact className="mt-5" />

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-soft">
            Actuel
          </dt>
          <dd className="mt-1 truncate text-[13px] font-semibold text-text">
            {current?.title ?? "Tous les checkpoints sont passés"}
          </dd>
        </div>

        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-soft">
            Suivant
          </dt>
          <dd className="mt-1 truncate text-[13px] text-text-muted">
            {next?.title ?? "Destination atteinte"}
          </dd>
        </div>

        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-soft">
            Pilote
          </dt>
          <dd className="mt-1">
            <OwnerBadge member={journey.owner} />
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-[12px] tabular-nums text-text-muted">
          {String(done).padStart(2, "0")} /{" "}
          {String(journey.tasks.length).padStart(2, "0")} checkpoints
        </span>
        {current && <DueBadge task={current} />}
      </div>
    </Link>
  );
}
