/** En-tête de contexte : où je suis, dans quel workspace, avec quelle action. */
export function Masthead({
  kicker,
  title,
  meta,
  actions,
  compactTitle = false,
}: {
  kicker: string;
  title: string;
  meta?: string[];
  actions?: React.ReactNode;
  /** Utile si le titre est trop long pour l'affichage large. */
  compactTitle?: boolean;
}) {
  return (
    <header className="motion-rise border-b border-line bg-surface px-6 py-6 sm:px-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="motion-stagger min-w-0">
          <p className="text-[13px] font-medium text-text-muted">
            {kicker}
          </p>

          {compactTitle ? (
            <h1 className="mt-2 text-2xl font-semibold text-text">{title}</h1>
          ) : (
            <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.01em] text-text sm:text-[42px]">
              {title}
            </h1>
          )}

          {meta && meta.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-[11px] tabular-nums text-text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="motion-rise-delay flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
