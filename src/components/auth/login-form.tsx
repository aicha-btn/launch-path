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
      className="h-9 w-full bg-offset font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
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
      className="h-9 w-full border border-ink font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-colors duration-[120ms] hover:bg-signal disabled:text-ink-30"
    >
      {pending ? "Connexion…" : "Entrer avec le compte de démonstration"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(requestMagicLink, null);

  return (
    <>
      <form action={action} className="mt-12">
        <input type="hidden" name="suivant" value={next} />

        <label
          htmlFor="email"
          className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70"
        >
          Adresse email
        </label>

        {/* Exception unique du système : champ souligné, sans cadre. */}
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="manon@exemple.fr"
          aria-invalid={state?.ok === false}
          aria-describedby={state ? "login-message" : undefined}
          className="mt-2 h-9 w-full border-b border-ink bg-transparent text-sm text-ink placeholder:text-ink-30 focus:outline-none focus-visible:border-b-2"
        />

        <div className="mt-8">
          <SubmitButton>Recevoir un lien de connexion</SubmitButton>
        </div>

        {state && (
          <p
            id="login-message"
            role="status"
            className={`mt-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] ${
              state.ok ? "text-ink-70" : "text-correction-text"
            }`}
          >
            {state.ok ? state.message : state.error}
          </p>
        )}
      </form>

      {/* Accès démonstration : sans ce raccourci, un visiteur venu de la
          page publique buterait sur un formulaire et repartirait. */}
      <div className="mt-10 border-t border-ink pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
          Ou sans inscription
        </p>
        <form action={signInAsDemo} className="mt-3">
          <DemoButton />
        </form>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-70">
          Compte de lecture avec des données réalistes : quatre onboardings en
          cours, dont un en retard.
        </p>
      </div>
    </>
  );
}
