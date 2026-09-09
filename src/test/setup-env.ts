import dotenv from "dotenv";

/**
 * Charge `.env.local` avant les tests d'intégration.
 *
 * Vitest ne lit aucun fichier `.env` de lui-même — même piège que les
 * scripts npm, où `$CRON_SECRET` arrivait vide.
 */
dotenv.config({ path: ".env.local" });

/**
 * Les trois variables, pas seulement la base. Les fixtures créent leurs comptes
 * par l'API d'inscription : sans les deux clés Supabase, `createClient` échouait
 * plus tard avec un message qui ne désignait pas la cause.
 */
for (const nom of [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]) {
  if (!process.env[nom]) {
    throw new Error(
      `${nom} absente. Lancez \`supabase start\` puis vérifiez .env.local.`,
    );
  }
}
