import { Glyph } from "./glyph";

/**
 * Lockup calme : le glyphe porte la métaphore du parcours, le mot reste net.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Glyph className="h-5 w-5 shrink-0" />
      <span className="text-[15px] font-semibold tracking-[0.02em]">
        LaunchPath
      </span>
    </span>
  );
}
