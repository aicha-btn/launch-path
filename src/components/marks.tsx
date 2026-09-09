import type { JourneyStatus } from "@/types";

/**
 * Les états sont des marques typographiques, pas des couleurs
 * — docs/design-system.md § 7. Le rouge ne dit qu'une chose : le retard.
 */

/** Le seul élément coloré en rouge du produit. */
export function Stamp({
  children,
  tilted = false,
}: {
  children: React.ReactNode;
  tilted?: boolean;
}) {
  return (
    <span
      className={`motion-stamp inline-block bg-correction px-2 py-[3px] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper ${
        tilted ? "-rotate-2" : ""
      }`}
    >
      {children}
    </span>
  );
}

/** Micro-libellé : nœud carré + mono capitales. Pas de pilule arrondie. */
export function StatusLabel({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "muted" | "offset";
}) {
  const text =
    tone === "offset"
      ? "text-offset-text"
      : tone === "muted"
        ? "text-ink-30"
        : "text-ink-70";
  const node =
    tone === "offset"
      ? "bg-offset"
      : tone === "muted"
        ? "bg-ink-30"
        : "bg-ink-70";

  return (
    <span
      className={`motion-status inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] ${text}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 ${node}`} />
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

/** Sur-titre de section : mono capitales sur filet lourd. */
export function SectionRule({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="motion-rule flex items-baseline justify-between border-b-[3px] border-ink pb-2">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
        {children}
      </h2>
      {count !== undefined && (
        <span className="font-mono text-[11px] tabular-nums text-ink-70">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
