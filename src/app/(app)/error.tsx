"use client";

import { useEffect } from "react";
import { Masthead } from "@/components/masthead";
import { Button, EmptyState } from "@/components/ui";

/**
 * Frontière d'erreur du groupe applicatif.
 *
 * Le message reste en langage clair : un utilisateur RH n'a rien à faire
 * d'une stack trace. Le `digest` est affiché en petit parce que c'est lui
 * qui permettra de retrouver l'erreur dans les logs — et plus tard dans
 * Sentry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Masthead kicker="Erreur" title="Quelque chose a cassé." />
      <div className="px-6 py-10 sm:px-10">
        <EmptyState
          title="On n’a pas pu charger cet écran."
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="motion-button primary-action"
              >
                Réessayer
              </button>
              <Button href="/dashboard" variant="secondary">
                Retour à la synthèse
              </Button>
            </div>
          }
        >
          L&apos;erreur a été enregistrée. Si elle se reproduit, réessayez dans
          quelques instants.
          {error.digest && (
            <span className="mt-4 block text-action text-text-soft">
              Référence {error.digest}
            </span>
          )}
        </EmptyState>
      </div>
    </>
  );
}
