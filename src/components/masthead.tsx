/**
 * L'en-tête d'article, présent sur chaque écran — § 9.1.
 * Filet double en haut, filet lourd en bas.
 *
 * Règle du § 15 : le sur-titre porte la rubrique, puis un chiffre ou une
 * date réels. Jamais un ornement.
 */
export function Masthead({
  kicker,
  title,
  meta,
  actions,
  serif = true,
}: {
  kicker: string;
  title: string;
  meta?: string[];
  actions?: React.ReactNode;
  /** Faux uniquement si le titre est trop long pour l'affichage serif. */
  serif?: boolean;
}) {
  return (
    <header className="rule-double border-b-[3px] border-ink px-6 pb-6 pt-6 sm:px-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-70">
            {kicker}
          </p>

          {serif ? (
            <h1 className="mt-3 font-serif text-[34px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[44px]">
              {title}
            </h1>
          ) : (
            <h1 className="mt-3 text-2xl font-semibold text-ink">{title}</h1>
          )}

          {meta && meta.length > 0 && (
            <p className="mt-4 font-mono text-[12px] tabular-nums text-ink-70">
              {meta.join("  ·  ")}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
