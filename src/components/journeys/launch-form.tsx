"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { addBusinessDays } from "@/lib/scheduling";
import { formatShort } from "@/lib/dates";
import { launchJourney } from "@/server/actions/journeys";
import type { Member, Template } from "@/types";

/**
 * L'aperçu des échéances est calculé CÔTÉ CLIENT avec la même fonction pure
 * que le serveur (`addBusinessDays`). Deux avantages : aucun aller-retour
 * réseau à chaque frappe, et une seule implémentation des règles métier —
 * donc aucun risque de divergence entre ce qui est montré et ce qui sera
 * écrit en base.
 */

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="motion-button primary-action"
    >
      {pending ? "Lancement…" : "Lancer l'onboarding"}
    </button>
  );
}

export function LaunchForm({
  templates,
  members,
  today,
  defaultOwnerId,
}: {
  templates: Template[];
  members: Member[];
  today: string;
  defaultOwnerId: string;
}) {
  const [state, action] = useActionState(launchJourney, null);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today);

  const template = templates.find((t) => t.id === templateId) ?? null;

  const preview = useMemo(() => {
    if (!template) return [];
    try {
      return template.steps.map((step, index) => ({
        position: index + 1,
        title: step.title,
        assignee: step.defaultAssignee,
        dueDate: addBusinessDays(startDate, step.offsetDays),
      }));
    } catch {
      // Date incomplète pendant la saisie : on n'affiche rien plutôt que
      // de faire planter le composant.
      return [];
    }
  }, [template, startDate]);

  if (templates.length === 0) {
    return (
      <div className="motion-rise mt-10 max-w-[560px] rounded-lg border border-line bg-surface p-6">
        <p className="text-[24px] font-semibold leading-tight tracking-[-0.01em] text-text">
          Aucun parcours type disponible.
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-text-muted">
          Un onboarding se lance depuis un parcours type actif comportant au
          moins une étape. Créez-en un d&apos;abord.
        </p>
        <Link
          href="/templates/new"
          className="motion-button primary-action mt-6"
        >
          Créer un parcours type
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="motion-rise mt-10">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        {/* Saisie */}
        <div className="motion-stagger rounded-lg border border-line bg-surface p-5">
          <div>
            <label
              htmlFor="templateId"
              className="field-label"
            >
              Parcours type
            </label>
            <select
              id="templateId"
              name="templateId"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="motion-input field-control mt-2"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.steps.length} étape{t.steps.length > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="subjectName"
              className="field-label"
            >
              Personne ou client
            </label>
            <input
              id="subjectName"
              name="subjectName"
              required
              maxLength={120}
              placeholder="Sofia Marchetti"
              className="motion-input field-control mt-2"
            />
          </div>

          <div>
            <label
              htmlFor="subjectEmail"
              className="field-label"
            >
              Email (facultatif)
            </label>
            <input
              id="subjectEmail"
              name="subjectEmail"
              type="email"
              maxLength={160}
              placeholder="sofia@exemple.fr"
              className="motion-input field-control mt-2"
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="field-label"
            >
              Date d&apos;arrivée
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="motion-input field-control mt-2 font-mono tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="ownerId"
              className="field-label"
            >
              Pilote
            </label>
            <select
              id="ownerId"
              name="ownerId"
              defaultValue={defaultOwnerId}
              className="motion-input field-control mt-2"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Submit disabled={preview.length === 0} />
            {state?.ok === false && (
              <p
                role="status"
                className="rounded-md bg-overdue-soft px-3 py-2 text-[12px] font-semibold text-overdue"
              >
                {state.error}
              </p>
            )}
          </div>
        </div>

        {/* Aperçu */}
        <div className="motion-rise-delay">
          <div className="rounded-lg border border-line bg-surface-raised p-5">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="text-[14px] font-semibold text-text">
              Échéances calculées
            </h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 font-mono text-[11px] tabular-nums text-primary-text">
              {String(preview.length).padStart(2, "0")}
            </span>
          </div>

          {preview.length === 0 ? (
            <p className="py-6 text-[13px] text-text-muted">
              Choisissez une date d&apos;arrivée pour voir les échéances.
            </p>
          ) : (
            <ul className="mt-2">
              {preview.map((step) => (
                <li
                  key={step.position}
                  className="motion-row grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 hover:bg-primary-soft/35"
                >
                  <span className="path-node">
                    {String(step.position).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-medium text-text">
                    {step.title}
                  </span>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 font-mono text-[12px] tabular-nums text-primary-text">
                    {formatShort(step.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 max-w-[52ch] text-[12px] leading-relaxed text-text-muted">
            Les échéances sont calculées en <strong className="font-semibold text-text">jours ouvrés</strong> à
            partir de la date d&apos;arrivée. Les étapes du parcours type sont
            copiées : le modifier plus tard ne changera pas cet onboarding.
          </p>
          </div>
        </div>
      </div>
    </form>
  );
}
