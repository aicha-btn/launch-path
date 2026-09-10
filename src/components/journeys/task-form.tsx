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
      className="motion-button primary-action"
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
    <form action={action} className="motion-stagger space-y-4">
      <input type="hidden" name="taskId" value={task.id} />

      <div>
        <label
          htmlFor="assigneeId"
          className="field-label"
        >
          Responsable
        </label>
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={task.assignee?.id ?? ""}
          className="motion-input field-control mt-2"
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
          className="field-label"
        >
          Échéance
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          required
          defaultValue={task.dueDate}
          className="motion-input field-control mt-2 font-mono tabular-nums"
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
    <form action={action} className="motion-rise mt-5">
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
        className="motion-input field-control w-full"
      />
      <div className="mt-3">
        <Submit label="Commenter" />
      </div>
    </form>
  );
}
