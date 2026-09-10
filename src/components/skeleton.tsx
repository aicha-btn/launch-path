/**
 * États de chargement : quelques checkpoints posent la structure avant que les
 * données arrivent.
 */

function Bar({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded-full bg-surface-muted ${className}`} />;
}

export function MastheadSkeleton() {
  return (
    <div className="border-b border-line bg-surface px-6 py-6 sm:px-10">
      <Bar className="h-3 w-40" />
      <Bar className="mt-4 h-10 w-[280px]" />
      <Bar className="mt-5 h-3 w-56" />
    </div>
  );
}

export function LedgerSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="grid min-h-[58px] grid-cols-[20px_1fr_64px] items-center gap-4 rounded-md border border-line bg-surface px-3"
        >
          <Bar className="h-5 w-5" />
          <Bar className={`h-3 ${["w-3/5", "w-4/5", "w-2/5", "w-3/4"][i % 4]}`} />
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
        <div key={i} className="rounded-md border border-line bg-surface p-4">
          <Bar className="h-9 w-14" />
          <Bar className="mt-8 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
