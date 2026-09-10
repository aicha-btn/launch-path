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
      className="motion-button primary-action"
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
    <form
      action={action}
      className="motion-stagger mt-6 max-w-[640px] rounded-lg border border-line bg-surface p-5"
    >
      <input type="hidden" name="templateId" value={template.id} />

      <div>
        <label
          htmlFor="name"
          className="field-label"
        >
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={template.name}
          className="motion-input field-control mt-2"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="field-label"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={400}
          defaultValue={template.description}
          className="motion-input field-control mt-2"
        />
      </div>

      <div>
        <label
          htmlFor="targetType"
          className="field-label"
        >
          Type de cible
        </label>
        <select
          id="targetType"
          name="targetType"
          defaultValue={template.targetType}
          className="motion-input field-control mt-2 sm:w-[240px]"
        >
          <option value="employee">Collaborateur</option>
          <option value="customer">Client</option>
        </select>
      </div>

      <Submit />
    </form>
  );
}
