"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOrganization } from "@/server/actions/organization";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 h-9 w-full bg-offset font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
    >
      {pending ? "Création…" : "Créer l'organisation"}
    </button>
  );
}

export function WelcomeForm() {
  const [state, action] = useActionState(createOrganization, null);

  return (
    <form action={action} className="mt-10">
      <label
        htmlFor="name"
        className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70"
      >
        Nom de l&apos;organisation
      </label>

      <input
        id="name"
        name="name"
        type="text"
        required
        maxLength={60}
        autoComplete="organization"
        placeholder="Atelier Novembre"
        aria-invalid={state?.ok === false}
        className="mt-2 h-9 w-full border-b border-ink bg-transparent text-sm text-ink placeholder:text-ink-30 focus:outline-none focus-visible:border-b-2"
      />

      <SubmitButton />

      {state?.ok === false && (
        <p
          role="status"
          className="mt-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-correction-text"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
