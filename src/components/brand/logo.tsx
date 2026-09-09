import { Glyph } from "./glyph";

/**
 * Le mot est en Archivo 600 capitales, interlettrage 0.12em.
 * Jamais en Instrument Serif : la serif est réservée aux titres de
 * contenu, un logo en serif d'affichage entrerait en concurrence avec eux.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Glyph className="h-5 w-5 shrink-0" />
      <span className="text-[15px] font-semibold uppercase tracking-[0.12em]">
        LaunchPath
      </span>
    </span>
  );
}
