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
      className="h-9 shrink-0 border border-ink px-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink transition-colors duration-[120ms] hover:bg-ink-08 disabled:text-ink-30"
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
    <li className="border-b border-ink-15 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center border border-ink-30 font-mono text-[10px] tabular-nums text-ink-45">
          {String(step.position).padStart(2, "0")}
        </span>

        <form action={action} className="min-w-0 flex-1">
          <input type="hidden" name="templateId" value={templateId} />
          <input type="hidden" name="stepId" value={step.id} />

          <div className="grid gap-3 sm:grid-cols-[1fr_96px_150px_auto] sm:items-end">
            <input
              name="title"
              defaultValue={step.title}
              maxLength={160}
              className="h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
            />

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
                Délai (j)
              </label>
              <input
                name="offsetDays"
                defaultValue={String(step.offsetDays)}
                inputMode="numeric"
                className="h-9 w-full border border-ink-30 bg-paper px-3 font-mono text-[13px] tabular-nums text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
                Responsable
              </label>
              <select
                name="assigneeId"
                defaultValue={step.defaultAssignee?.id ?? ""}
                className="h-9 w-full border border-ink-30 bg-paper px-2 text-[13px] text-ink focus:border-ink focus:outline-none"
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

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
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
                className="grid h-7 w-7 place-items-center border border-ink-30 font-mono text-[11px] text-ink transition-colors duration-[120ms] hover:bg-ink-08 disabled:border-ink-15 disabled:text-ink-15"
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
                className="grid h-7 w-7 place-items-center border border-ink-30 font-mono text-[11px] text-ink transition-colors duration-[120ms] hover:bg-ink-08 disabled:border-ink-15 disabled:text-ink-15"
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
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline transition-colors duration-[120ms] hover:text-correction-text"
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
    <form ref={ref} action={action} className="mt-6">
      <input type="hidden" name="templateId" value={templateId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_96px_150px_auto] sm:items-end">
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
            Nouvelle étape
          </label>
          <input
            name="title"
            required
            maxLength={160}
            placeholder="Point de fin de première semaine"
            className="h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
            Délai (j)
          </label>
          <input
            name="offsetDays"
            defaultValue="0"
            inputMode="numeric"
            className="h-9 w-full border border-ink-30 bg-paper px-3 font-mono text-[13px] tabular-nums text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.08em] text-ink-45">
            Responsable
          </label>
          <select
            name="assigneeId"
            defaultValue=""
            className="h-9 w-full border border-ink-30 bg-paper px-2 text-[13px] text-ink focus:border-ink focus:outline-none"
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
      <ul>
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
        <p className="border-b border-ink-15 py-6 text-[13px] text-ink-70">
          Ce parcours type n&apos;a plus aucune étape. Il ne pourra pas être
          lancé tant qu&apos;il en manque.
        </p>
      )}

      <AddStepForm templateId={templateId} members={members} />
    </>
  );
}
