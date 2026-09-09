"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateTemplate } from "@/server/actions/templates";
import type { Template } from "@/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
    >
      {pending ? "Enregistrement…" : "Enregistrer"}
    </button>
  );
}

export function TemplateHeaderForm({ template }: { template: Template }) {
  const [state, action] = useActionState(updateTemplate, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Enregistré", { description: state.message });
    else toast.error("Refusé", { description: state.error });
  }, [state]);

  return (
    <form action={action} className="motion-stagger mt-6 max-w-[640px] space-y-5">
      <input type="hidden" name="templateId" value={template.id} />

      <div>
        <label
          htmlFor="name"
          className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
        >
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={template.name}
          className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={400}
          defaultValue={template.description}
          className="motion-input mt-2 w-full border border-ink-30 bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="targetType"
          className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
        >
          Type de cible
        </label>
        <select
          id="targetType"
          name="targetType"
          defaultValue={template.targetType}
          className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none sm:w-[240px]"
        >
          <option value="employee">Collaborateur</option>
          <option value="customer">Client</option>
        </select>
      </div>

      <Submit />
    </form>
  );
}
