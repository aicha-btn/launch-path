"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toasts : surface légère, signal d'état par bord et texte.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-md border border-line bg-surface-raised px-4 py-3 text-text shadow-[var(--shadow-active)]",
          error: "border-overdue bg-overdue-soft text-overdue",
          title: "text-[13px] font-semibold",
          description: "mt-1 text-[13px] leading-snug text-text-muted",
          actionButton: "ml-auto text-[12px] font-semibold underline",
        },
      }}
    />
  );
}
