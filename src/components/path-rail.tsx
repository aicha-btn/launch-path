import { daysBetween, formatShort, lateDays, today } from "@/lib/dates";
import type { Member, Task } from "@/types";

export type CheckpointState =
  | "completed"
  | "current"
  | "upcoming"
  | "overdue"
  | "skipped";

const STATE_LABEL: Record<CheckpointState, string> = {
  completed: "terminé",
  current: "en cours",
  upcoming: "à venir",
  overdue: "en retard",
  skipped: "ignoré",
};

const NODE: Record<CheckpointState, string> = {
  completed: "border-success bg-success text-surface",
  current: "border-primary bg-primary text-surface ring-4 ring-primary-soft",
  upcoming: "border-line-strong bg-surface text-text-soft",
  overdue: "border-overdue bg-overdue text-surface ring-4 ring-overdue-soft",
  skipped: "border-line bg-surface-muted text-text-soft line-through",
};

const SEGMENT: Record<CheckpointState, string> = {
  completed: "bg-success",
  current: "bg-primary",
  upcoming: "bg-line",
  overdue: "bg-overdue",
  skipped: "bg-line-strong",
};

const DUE_STYLES = {
  done: "bg-success-soft text-success",
  skipped: "bg-surface-muted text-text-soft",
  overdue: "bg-overdue-soft text-overdue",
  today: "bg-warning-soft text-warning",
  soon: "bg-primary-soft text-primary-text",
  later: "bg-surface-muted text-text-muted",
};

export function completedCount(tasks: Task[]): number {
  return tasks.filter((task) => task.status !== "todo").length;
}

export function overdueCount(tasks: Task[]): number {
  return tasks.filter(
    (task) => task.status === "todo" && lateDays(task.dueDate) > 0,
  ).length;
}

export function currentTask(tasks: Task[]): Task | null {
  return tasks.find((task) => task.status === "todo") ?? null;
}

export function nextTask(tasks: Task[]): Task | null {
  const current = currentTask(tasks);
  if (!current) return null;
  return tasks.find(
    (task) => task.status === "todo" && task.position > current.position,
  ) ?? null;
}

export function checkpointState(
  task: Task,
  currentId?: string,
): CheckpointState {
  if (task.status === "done") return "completed";
  if (task.status === "skipped") return "skipped";
  if (lateDays(task.dueDate) > 0) return "overdue";
  return currentId && task.id === currentId ? "current" : "upcoming";
}

function dueCopy(task: Task) {
  if (task.status === "done") return { label: "Terminé", tone: "done" as const };
  if (task.status === "skipped") {
    return { label: "Ignoré", tone: "skipped" as const };
  }

  const late = lateDays(task.dueDate);
  if (late > 0) {
    return { label: `En retard · ${late} j`, tone: "overdue" as const };
  }

  const delta = daysBetween(today(), task.dueDate);
  if (delta === 0) return { label: "Aujourd'hui", tone: "today" as const };
  if (delta === 1) return { label: "Demain", tone: "soon" as const };
  if (delta <= 7) return { label: `Dans ${delta} j`, tone: "soon" as const };
  return { label: formatShort(task.dueDate), tone: "later" as const };
}

export function DueBadge({ task }: { task: Task }) {
  const due = dueCopy(task);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium leading-none ${DUE_STYLES[due.tone]}`}
    >
      {due.label}
    </span>
  );
}

export function OwnerBadge({
  member,
  showName = true,
}: {
  member: Member | null;
  showName?: boolean;
}) {
  if (!member) {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-[12px] font-medium text-text-soft">
        Non assigné
      </span>
    );
  }

  return (
    <span
      title={member.name}
      className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full bg-primary-soft px-2 py-1 text-[12px] font-medium text-primary-text"
    >
      <span
        aria-hidden
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-surface"
      >
        {member.initials}
      </span>
      {showName && <span className="min-w-0 truncate">{member.name}</span>}
    </span>
  );
}

function Checkpoint({
  state,
  children,
  compact = false,
}: {
  state: CheckpointState;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const size = compact
    ? "h-3.5 w-3.5 border-[2px]"
    : "h-8 w-8 border-[2px] text-[11px]";

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-mono font-medium tabular-nums ${size} ${NODE[state]}`}
    >
      {compact ? <span className="sr-only">{children}</span> : children}
    </span>
  );
}

export function PathRail({
  tasks,
  compact = false,
  className = "",
}: {
  tasks: Task[];
  compact?: boolean;
  className?: string;
}) {
  const currentId = currentTask(tasks)?.id;

  return (
    <ol
      className={`motion-folio flex min-w-0 items-center ${className}`}
      aria-label={`Progression : ${completedCount(tasks)} étape${completedCount(tasks) > 1 ? "s" : ""} sur ${tasks.length}`}
    >
      {tasks.map((task, index) => {
        const state = checkpointState(task, currentId);
        const isLast = index === tasks.length - 1;

        return (
          <li
            key={task.id}
            title={`${task.title} · ${STATE_LABEL[state]}`}
            className={`flex min-w-0 items-center ${isLast ? "shrink-0" : "flex-1"}`}
          >
            <Checkpoint state={state} compact={compact}>
              {String(task.position).padStart(2, "0")}
            </Checkpoint>
            <span className="sr-only">
              {task.title} · {STATE_LABEL[state]}
            </span>
            {!isLast && (
              <span
                aria-hidden
                className={`mx-1.5 h-[2px] min-w-3 flex-1 rounded-full ${SEGMENT[state]}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function JourneyPathPreview({
  tasks,
  limit,
  className = "",
}: {
  tasks: Task[];
  limit?: number;
  className?: string;
}) {
  const visible = limit ? tasks.slice(0, limit) : tasks;
  const currentId = currentTask(tasks)?.id;

  return (
    <ol className={`space-y-0 ${className}`}>
      {visible.map((task, index) => {
        const state = checkpointState(task, currentId);
        const isLast = index === visible.length - 1;

        return (
          <li
            key={task.id}
            className="relative grid grid-cols-[34px_minmax(0,1fr)] gap-3 pb-5 last:pb-0"
          >
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-4 top-8 h-[calc(100%-2rem)] w-[2px] rounded-full ${SEGMENT[state]}`}
              />
            )}
            <Checkpoint state={state}>
              {String(task.position).padStart(2, "0")}
            </Checkpoint>
            <div className="-mt-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[14px] font-semibold text-text">
                  {task.title}
                </p>
                {state === "current" && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-text">
                    Actuel
                  </span>
                )}
                {state === "overdue" && (
                  <span className="rounded-full bg-overdue-soft px-2 py-0.5 text-[11px] font-medium text-overdue">
                    À traiter
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OwnerBadge member={task.assignee} />
                <DueBadge task={task} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
