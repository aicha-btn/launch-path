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
      className="motion-button primary-action mt-8 w-full"
    >
      {pending ? "Création…" : "Créer l'organisation"}
    </button>
  );
}

export function WelcomeForm() {
  const [state, action] = useActionState(createOrganization, null);

  return (
    <form action={action} className="motion-rise mt-10">
      <label
        htmlFor="name"
        className="field-label"
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
        className="motion-input field-control mt-2"
      />

      <SubmitButton />

      {state?.ok === false && (
        <p
          role="status"
          className="motion-rise mt-4 rounded-md bg-overdue-soft px-3 py-2 text-[12px] font-semibold leading-relaxed text-overdue"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
