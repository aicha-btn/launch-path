"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestMagicLink, signInAsDemo } from "@/server/actions/auth";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button primary-action w-full"
    >
      {pending ? "Envoi…" : children}
    </button>
  );
}

function DemoButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button secondary-action w-full"
    >
      {pending ? "Connexion…" : "Entrer avec le compte de démonstration"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(requestMagicLink, null);

  return (
    <>
      <form action={action} className="motion-rise mt-12">
        <input type="hidden" name="suivant" value={next} />

        <label
          htmlFor="email"
          className="field-label"
        >
          Adresse email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="manon@exemple.fr"
          aria-invalid={state?.ok === false}
          aria-describedby={state ? "login-message" : undefined}
          className="motion-input field-control mt-2"
        />

        <div className="mt-8">
          <SubmitButton>Recevoir un lien de connexion</SubmitButton>
        </div>

        {state && (
          <p
            id="login-message"
            role="status"
            className={`motion-rise mt-4 rounded-md px-3 py-2 text-[12px] font-semibold leading-relaxed ${
              state.ok
                ? "bg-success-soft text-success"
                : "bg-overdue-soft text-overdue"
            }`}
          >
            {state.ok ? state.message : state.error}
          </p>
        )}
      </form>

      {/* Accès démonstration : sans ce raccourci, un visiteur venu de la
          page publique buterait sur un formulaire et repartirait. */}
      <div className="motion-rise-delay mt-10 border-t border-line pt-6">
        <p className="text-action">
          Ou sans inscription
        </p>
        <form action={signInAsDemo} className="mt-3">
          <DemoButton />
        </form>
        <p className="mt-3 text-[12px] leading-relaxed text-text-muted">
          Compte de lecture avec des données réalistes : quatre onboardings en
          cours, dont un en retard.
        </p>
      </div>
    </>
  );
}
