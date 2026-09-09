/**
 * États de chargement. Le squelette reprend la géométrie exacte du contenu
 * qu'il remplace — sinon la page saute quand les données arrivent.
 *
 * Aucune pulsation colorée : un aplat d'encre à 8 %, qui respire lentement.
 */

function Bar({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse bg-ink-08 ${className}`} />;
}

export function MastheadSkeleton() {
  return (
    <div className="rule-double border-b-[3px] border-ink px-6 pb-6 pt-6 sm:px-10">
      <Bar className="h-3 w-40" />
      <Bar className="mt-4 h-10 w-[280px]" />
      <Bar className="mt-5 h-3 w-56" />
    </div>
  );
}

export function LedgerSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul>
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="grid h-10 grid-cols-[16px_1fr_24px_88px] items-center gap-4 border-b border-ink-15 px-2"
        >
          <Bar className="h-4 w-4" />
          {/* Largeurs volontairement inégales : un squelette régulier ne
              ressemble à rien de réel. */}
          <Bar className={`h-3 ${["w-3/5", "w-4/5", "w-2/5", "w-3/4"][i % 4]}`} />
          <Bar className="h-6 w-6" />
          <Bar className="ml-auto h-3 w-16" />
        </li>
      ))}
    </ul>
  );
}

export function FiguresSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border border-ink-15 p-4">
          <Bar className="h-9 w-14" />
          <Bar className="mt-8 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
