"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  addStep,
  deleteStep,
  moveStep,
  updateStep,
} from "@/server/actions/templates";
import type { Member, TemplateStep } from "@/types";

/** Traduit un offset en langage clair — c'est ce que l'utilisateur pense. */
export function offsetLabel(offsetDays: number): string {
  if (offsetDays === 0) return "Le jour de l'arrivée";
  if (offsetDays < 0) {
    const n = Math.abs(offsetDays);
    return `${n} jour${n > 1 ? "s" : ""} avant l'arrivée`;
  }
  return `${offsetDays} jour${offsetDays > 1 ? "s" : ""} après l'arrivée`;
}

function useToastFeedback(state: { ok: boolean; message?: string; error?: string } | null) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Enregistré", { description: state.message });
    else toast.error("Refusé", { description: state.error });
  }, [state]);
}

function SavePending({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button secondary-action h-9 shrink-0 px-3 text-[12px]"
    >
      {pending ? "…" : label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Une ligne d'étape                                                   */
/* ------------------------------------------------------------------ */

function StepRow({
  templateId,
  step,
  members,
  isFirst,
  isLast,
}: {
  templateId: string;
  step: TemplateStep;
  members: Member[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, action] = useActionState(updateStep, null);
  useToastFeedback(state);

  return (
    <li className="motion-row rounded-md py-4">
      <div className="flex items-start gap-3">
        <span className="path-node mt-1 shrink-0">
          {String(step.position).padStart(2, "0")}
        </span>

        <form action={action} className="min-w-0 flex-1">
          <input type="hidden" name="templateId" value={templateId} />
          <input type="hidden" name="stepId" value={step.id} />

          <div className="motion-stagger grid gap-3 sm:grid-cols-[1fr_96px_150px_auto] sm:items-end">
            <input
              name="title"
              defaultValue={step.title}
              maxLength={160}
              className="motion-input field-control h-9"
            />

            <div>
              <label className="field-label">
                Délai (j)
              </label>
              <input
                name="offsetDays"
                defaultValue={String(step.offsetDays)}
                inputMode="numeric"
                className="motion-input field-control h-9 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="field-label">
                Responsable
              </label>
              <select
                name="assigneeId"
                defaultValue={step.defaultAssignee?.id ?? ""}
                className="motion-input field-control h-9"
              >
                <option value="">Non assignée</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <SavePending label="Enregistrer" />
          </div>

          <p className="mt-2 text-action">
            {offsetLabel(step.offsetDays)}
          </p>
        </form>

        {/* Déplacement et suppression : des formulaires séparés, sinon ils
            soumettraient les champs de l'étape en cours d'édition. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex gap-1">
            <form action={moveStep}>
              <input type="hidden" name="templateId" value={templateId} />
              <input type="hidden" name="stepId" value={step.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={isFirst}
                aria-label={`Monter l'étape ${step.position}`}
                className="motion-button grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-[13px] font-semibold text-text-muted transition-colors duration-[120ms] hover:border-primary hover:text-primary-text disabled:border-line disabled:text-line-strong"
              >
                ↑
              </button>
            </form>
            <form action={moveStep}>
              <input type="hidden" name="templateId" value={templateId} />
              <input type="hidden" name="stepId" value={step.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={isLast}
                aria-label={`Descendre l'étape ${step.position}`}
                className="motion-button grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-[13px] font-semibold text-text-muted transition-colors duration-[120ms] hover:border-primary hover:text-primary-text disabled:border-line disabled:text-line-strong"
              >
                ↓
              </button>
            </form>
          </div>

          <form action={deleteStep}>
            <input type="hidden" name="templateId" value={templateId} />
            <input type="hidden" name="stepId" value={step.id} />
            <button
              type="submit"
              aria-label={`Supprimer l'étape ${step.position}`}
              className="motion-link text-action"
            >
              Supprimer
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Ajout                                                               */
/* ------------------------------------------------------------------ */

function AddStepForm({
  templateId,
  members,
}: {
  templateId: string;
  members: Member[];
}) {
  const [state, action] = useActionState(addStep, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Étape ajoutée");
      ref.current?.reset();
    } else {
      toast.error("Refusé", { description: state.error });
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="motion-rise mt-6">
      <input type="hidden" name="templateId" value={templateId} />
      <div className="motion-stagger grid gap-3 sm:grid-cols-[1fr_96px_150px_auto] sm:items-end">
        <div>
          <label className="field-label">
            Nouvelle étape
          </label>
          <input
            name="title"
            required
            maxLength={160}
            placeholder="Point de fin de première semaine"
            className="motion-input field-control h-9"
          />
        </div>
        <div>
          <label className="field-label">
            Délai (j)
          </label>
          <input
            name="offsetDays"
            defaultValue="0"
            inputMode="numeric"
            className="motion-input field-control h-9 font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="field-label">
            Responsable
          </label>
          <select
            name="assigneeId"
            defaultValue=""
            className="motion-input field-control h-9"
          >
            <option value="">Non assignée</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <SavePending label="Ajouter" />
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

export function StepEditor({
  templateId,
  steps,
  members,
}: {
  templateId: string;
  steps: TemplateStep[];
  members: Member[];
}) {
  return (
    <>
      <ul className="motion-stagger">
        {steps.map((step, index) => (
          <StepRow
            key={step.id}
            templateId={templateId}
            step={step}
            members={members}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
          />
        ))}
      </ul>

      {steps.length === 0 && (
        <p className="motion-rise border-b border-line py-6 text-[13px] text-text-muted">
          Ce parcours type n&apos;a plus aucune étape. Il ne pourra pas être
          lancé tant qu&apos;il en manque.
        </p>
      )}

      <AddStepForm templateId={templateId} members={members} />
    </>
  );
}
