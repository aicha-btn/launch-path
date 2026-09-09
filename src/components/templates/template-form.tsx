"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createTemplate } from "@/server/actions/templates";
import type { Member } from "@/types";

/**
 * Création d'un parcours type AVEC ses premières étapes.
 *
 * Créer une coquille vide puis naviguer ailleurs pour la remplir est
 * frustrant et ne ressemble à aucun vrai produit — d'où un seul écran.
 */

type StepDraft = { key: number; title: string; offsetDays: string; assigneeId: string };

let nextKey = 1;

function newStep(): StepDraft {
  return { key: nextKey++, title: "", offsetDays: "0", assigneeId: "" };
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button inline-flex h-9 items-center bg-offset px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
    >
      {pending ? "Création…" : "Créer le parcours type"}
    </button>
  );
}

export function TemplateForm({ members }: { members: Member[] }) {
  const [state, action] = useActionState(createTemplate, null);
  const [steps, setSteps] = useState<StepDraft[]>(() => [
    newStep(),
    newStep(),
    newStep(),
  ]);

  function update(key: number, patch: Partial<StepDraft>) {
    setSteps((current) =>
      current.map((step) => (step.key === key ? { ...step, ...patch } : step)),
    );
  }

  return (
    <form action={action} className="motion-rise mt-10 max-w-[720px]">
      {/* En-tête du parcours type */}
      <div className="motion-stagger space-y-5">
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
            placeholder="Onboarding développeur"
            className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
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
            placeholder="À quoi sert ce parcours, et pour qui."
            className="motion-input mt-2 w-full border border-ink-30 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
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
            defaultValue="employee"
            className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none sm:w-[240px]"
          >
            <option value="employee">Collaborateur</option>
            <option value="customer">Client</option>
          </select>
        </div>
      </div>

      {/* Étapes */}
      <div className="motion-rise mt-12">
        <div className="motion-rule flex items-baseline justify-between border-b-[3px] border-ink pb-2">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
            Étapes
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-ink-70">
            {String(steps.length).padStart(2, "0")}
          </span>
        </div>

        <ul className="motion-stagger">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className="motion-row grid gap-3 border-b border-ink-15 py-4 sm:grid-cols-[28px_1fr_96px_150px_auto] sm:items-end sm:gap-3"
            >
              <span className="motion-avatar grid h-6 w-6 place-items-center border border-ink-30 font-mono text-[10px] tabular-nums text-ink-45">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45 sm:hidden">
                  Intitulé
                </label>
                <input
                  name="stepTitle"
                  value={step.title}
                  onChange={(e) => update(step.key, { title: e.target.value })}
                  maxLength={160}
                  placeholder="Créer les comptes"
                  className="motion-input h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
                  Délai (j)
                </label>
                <input
                  name="stepOffset"
                  value={step.offsetDays}
                  onChange={(e) => update(step.key, { offsetDays: e.target.value })}
                  inputMode="numeric"
                  className="motion-input h-9 w-full border border-ink-30 bg-paper px-3 font-mono text-[13px] tabular-nums text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
                  Responsable
                </label>
                <select
                  name="stepAssignee"
                  value={step.assigneeId}
                  onChange={(e) => update(step.key, { assigneeId: e.target.value })}
                  className="motion-input h-9 w-full border border-ink-30 bg-paper px-2 text-[13px] text-ink focus:border-ink focus:outline-none"
                >
                  <option value="">Non assignée</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSteps((current) =>
                    current.length === 1
                      ? current
                      : current.filter((s) => s.key !== step.key),
                  )
                }
                disabled={steps.length === 1}
                aria-label={`Retirer l'étape ${index + 1}`}
                className="motion-link h-9 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline transition-colors duration-[120ms] hover:text-correction-text disabled:text-ink-15 disabled:no-underline"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setSteps((current) => [...current, newStep()])}
          className="motion-button mt-4 h-9 border border-ink px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-colors duration-[120ms] hover:bg-ink-08"
        >
          Ajouter une étape
        </button>

        <p className="mt-4 max-w-[62ch] text-[12px] leading-relaxed text-ink-70">
          Le délai est relatif à la date d&apos;arrivée, en jours ouvrés.
          <strong className="font-semibold text-ink"> −3</strong> signifie trois
          jours ouvrés avant l&apos;arrivée,{" "}
          <strong className="font-semibold text-ink">0</strong> le jour même. Les
          lignes laissées vides sont ignorées.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Submit />
        {state?.ok === false && (
          <p
            role="status"
            className="motion-rise font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-correction-text"
          >
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
