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
      className="motion-button primary-action"
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
    <form action={action} className="motion-rise mt-10 max-w-[780px]">
      {/* En-tête du parcours type */}
      <div className="motion-stagger rounded-lg border border-line bg-surface p-5">
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
            placeholder="Onboarding développeur"
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
            placeholder="À quoi sert ce parcours, et pour qui."
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
            defaultValue="employee"
            className="motion-input field-control mt-2 sm:w-[240px]"
          >
            <option value="employee">Collaborateur</option>
            <option value="customer">Client</option>
          </select>
        </div>
      </div>

      {/* Étapes */}
      <div className="motion-rise mt-8 rounded-lg border border-line bg-surface-raised p-5">
        <div className="motion-rule flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="text-[14px] font-semibold text-text">
            Étapes
          </h2>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 font-mono text-[11px] tabular-nums text-primary-text">
            {String(steps.length).padStart(2, "0")}
          </span>
        </div>

        <ul className="motion-stagger">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className="motion-row grid gap-3 rounded-md py-4 sm:grid-cols-[28px_1fr_96px_150px_auto] sm:items-end sm:gap-3"
            >
              <span className="motion-avatar path-node">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <label className="field-label sm:hidden">
                  Intitulé
                </label>
                <input
                  name="stepTitle"
                  value={step.title}
                  onChange={(e) => update(step.key, { title: e.target.value })}
                  maxLength={160}
                  placeholder="Créer les comptes"
                  className="motion-input field-control"
                />
              </div>

              <div>
                <label className="field-label">
                  Délai (j)
                </label>
                <input
                  name="stepOffset"
                  value={step.offsetDays}
                  onChange={(e) => update(step.key, { offsetDays: e.target.value })}
                  inputMode="numeric"
                  className="motion-input field-control font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="field-label">
                  Responsable
                </label>
                <select
                  name="stepAssignee"
                  value={step.assigneeId}
                  onChange={(e) => update(step.key, { assigneeId: e.target.value })}
                  className="motion-input field-control"
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
                className="motion-link text-action h-9 disabled:text-line"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setSteps((current) => [...current, newStep()])}
          className="motion-button secondary-action mt-4"
        >
          Ajouter une étape
        </button>

        <p className="mt-4 max-w-[62ch] text-[12px] leading-relaxed text-text-muted">
          Le délai est relatif à la date d&apos;arrivée, en jours ouvrés.
          <strong className="font-semibold text-text"> −3</strong> signifie trois
          jours ouvrés avant l&apos;arrivée,{" "}
          <strong className="font-semibold text-text">0</strong> le jour même. Les
          lignes laissées vides sont ignorées.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Submit />
        {state?.ok === false && (
          <p
            role="status"
            className="motion-rise rounded-md bg-overdue-soft px-3 py-2 text-[12px] font-semibold text-overdue"
          >
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
