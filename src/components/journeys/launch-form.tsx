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
      className="motion-button inline-flex h-9 items-center bg-offset px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink disabled:bg-ink-30"
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
      <div className="motion-rise mt-10 max-w-[560px] border border-ink p-6">
        <p className="font-serif text-[26px] leading-tight tracking-[-0.01em] text-ink">
          Aucun parcours type disponible.
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-70">
          Un onboarding se lance depuis un parcours type actif comportant au
          moins une étape. Créez-en un d&apos;abord.
        </p>
        <Link
          href="/templates/new"
          className="motion-button mt-6 inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper no-underline hover:bg-ink"
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
        <div className="motion-stagger space-y-5">
          <div>
            <label
              htmlFor="templateId"
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Parcours type
            </label>
            <select
              id="templateId"
              name="templateId"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
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
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Personne ou client
            </label>
            <input
              id="subjectName"
              name="subjectName"
              required
              maxLength={120}
              placeholder="Sofia Marchetti"
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="subjectEmail"
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Email (facultatif)
            </label>
            <input
              id="subjectEmail"
              name="subjectEmail"
              type="email"
              maxLength={160}
              placeholder="sofia@exemple.fr"
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink placeholder:text-ink-30 focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
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
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 font-mono text-[13px] tabular-nums text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ownerId"
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Pilote
            </label>
            <select
              id="ownerId"
              name="ownerId"
              defaultValue={defaultOwnerId}
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
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
                className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-correction-text"
              >
                {state.error}
              </p>
            )}
          </div>
        </div>

        {/* Aperçu */}
        <div className="motion-rise-delay">
          <div className="flex items-baseline justify-between border-b-[3px] border-ink pb-2">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
              Échéances calculées
            </h2>
            <span className="font-mono text-[11px] tabular-nums text-ink-70">
              {String(preview.length).padStart(2, "0")}
            </span>
          </div>

          {preview.length === 0 ? (
            <p className="py-6 text-[13px] text-ink-70">
              Choisissez une date d&apos;arrivée pour voir les échéances.
            </p>
          ) : (
            <ul>
              {preview.map((step) => (
                <li
                  key={step.position}
                  className="motion-row grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-ink-15 py-2.5"
                >
                  <span className="grid h-6 w-6 place-items-center border border-ink-30 font-mono text-[10px] tabular-nums text-ink-45">
                    {String(step.position).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate text-[13px] text-ink">
                    {step.title}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-ink-70">
                    {formatShort(step.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 max-w-[52ch] text-[12px] leading-relaxed text-ink-70">
            Les échéances sont calculées en <strong className="font-semibold text-ink">jours ouvrés</strong> à
            partir de la date d&apos;arrivée. Les étapes du parcours type sont
            copiées : le modifier plus tard ne changera pas cet onboarding.
          </p>
        </div>
      </div>
    </form>
  );
}
