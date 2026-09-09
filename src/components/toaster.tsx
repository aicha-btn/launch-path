"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toasts — § 8. Aplat d'encre, texte papier, bordure gauche de 3 px :
 * papier en cas de succès, rouge en cas d'erreur.
 *
 * Monté dès maintenant même sans action à confirmer : le rajouter à la fin
 * obligerait à repasser sur toutes les mutations.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 border-l-[3px] border-paper bg-ink px-4 py-3 text-paper",
          error: "border-l-correction",
          title:
            "font-mono text-[11px] font-medium uppercase tracking-[0.08em]",
          description: "mt-1 text-[13px] leading-snug text-paper/70",
          actionButton:
            "ml-auto font-mono text-[11px] uppercase tracking-[0.08em] underline",
        },
      }}
    />
  );
}
