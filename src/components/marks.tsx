import type { JourneyStatus } from "@/types";

/**
 * Les états combinent texte, forme et couleur : la couleur n'est jamais le
 * seul signal.
 */

/** Indicateur d'attention : plus de tampon, le risque s'intègre au parcours. */
export function Stamp({
  children,
  tilted = false,
}: {
  children: React.ReactNode;
  tilted?: boolean;
}) {
  return (
    <span
      className={`motion-stamp inline-flex items-center rounded-full bg-overdue-soft px-2.5 py-1 text-[12px] font-semibold leading-none text-overdue ring-1 ring-overdue/20 ${
        tilted ? "-rotate-2" : ""
      }`}
    >
      {children}
    </span>
  );
}

/** Micro-libellé : un node et un texte, pas seulement une couleur. */
export function StatusLabel({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "muted" | "offset";
}) {
  const text =
    tone === "offset"
      ? "text-primary-text"
      : tone === "muted"
        ? "text-text-soft"
        : "text-text-muted";
  const node =
    tone === "offset"
      ? "bg-primary"
      : tone === "muted"
        ? "bg-line-strong"
        : "bg-text-muted";

  return (
    <span
      className={`motion-status inline-flex items-center gap-2 rounded-full bg-surface px-2.5 py-1 text-[12px] font-medium ${text}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${node}`} />
      {children}
    </span>
  );
}

const JOURNEY_LABEL: Record<JourneyStatus, string> = {
  active: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export function JourneyStatusLabel({ status }: { status: JourneyStatus }) {
  return (
    <StatusLabel tone={status === "active" ? "offset" : "muted"}>
      {JOURNEY_LABEL[status]}
    </StatusLabel>
  );
}

/** En-tête de section : clair, respirant, aligné sur le langage de rail. */
export function SectionRule({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="motion-rule flex items-center justify-between border-b border-line pb-3">
      <h2 className="text-[14px] font-semibold text-text">
        {children}
      </h2>
      {count !== undefined && (
        <span className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-[11px] tabular-nums text-text-muted">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
