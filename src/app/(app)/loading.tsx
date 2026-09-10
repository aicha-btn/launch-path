import {
  FiguresSkeleton,
  LedgerSkeleton,
  MastheadSkeleton,
} from "@/components/skeleton";

/** S'applique à tous les écrans du groupe `(app)` et à leurs enfants. */
export default function AppLoading() {
  return (
    <>
      <MastheadSkeleton />
      <div className="px-6 py-10 sm:px-10">
        <FiguresSkeleton />
        <div className="mt-14 border-b border-line pb-3">
          <span className="block h-3 w-32 animate-pulse rounded-full bg-surface-muted" />
        </div>
        <LedgerSkeleton />
      </div>
    </>
  );
}
