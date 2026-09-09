/**
 * Reconnaissance des erreurs Postgres qu'on traite comme des cas métier.
 *
 * Le projet s'appuie plusieurs fois sur la base pour arbitrer une règle
 * plutôt que sur une vérification applicative — l'idempotence du cron, un
 * utilisateur dans une seule organisation. Quand la base refuse, ce n'est pas
 * un incident : c'est la réponse attendue. Il faut donc pouvoir la distinguer
 * d'une vraie panne.
 */

/** `23505 unique_violation` — une contrainte d'unicité a joué son rôle. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}
