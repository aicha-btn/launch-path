"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { addComment } from "@/server/actions/comments";
import { updateTask } from "@/server/actions/journeys";
import type { Member, Task } from "@/types";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
    >
      {pending ? "…" : label}
    </button>
  );
}

/** Réassignation et échéance. */
export function TaskEditForm({
  task,
  members,
}: {
  task: Task;
  members: Member[];
}) {
  const [state, action] = useActionState(updateTask, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Enregistré", { description: state.message });
    else toast.error("Refusé", { description: state.error });
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="taskId" value={task.id} />

      <div>
        <label
          htmlFor="assigneeId"
          className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
        >
          Responsable
        </label>
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={task.assignee?.id ?? ""}
          className="mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="">Non assignée</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="dueDate"
          className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
        >
          Échéance
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={task.dueDate}
          className="mt-2 h-9 w-full border border-ink-30 bg-paper px-3 font-mono text-[13px] tabular-nums text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <Submit label="Enregistrer" />
    </form>
  );
}

/** Ajout d'un commentaire. */
export function CommentForm({ taskId }: { taskId: string }) {
  const [state, action] = useActionState(addComment, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Commentaire ajouté");
    else toast.error("Refusé", { description: state.error });
  }, [state]);

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="taskId" value={taskId} />
      <label htmlFor="body" className="sr-only">
        Commentaire
      </label>
      <textarea
        id="body"
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="Ce qui bloque, ce qui a été fait, une précision utile…"
        className="w-full border border-ink-30 bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
      />
      <div className="mt-3">
        <Submit label="Commenter" />
      </div>
    </form>
  );
}
