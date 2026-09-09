import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Client Postgres unique.
 *
 * Le serveur se connecte avec le rôle `postgres`, propriétaire des tables,
 * qui contourne RLS (décision n° 5). C'est voulu : l'autorisation vit dans
 * la couche serveur, pas dans des policies. La clé anon publique, elle,
 * ne donne accès à rien.
 *
 * Le client est mis en cache sur `globalThis` pour survivre au
 * rechargement à chaud du serveur de développement — sinon chaque
 * modification de fichier ouvrirait une nouvelle connexion.
 */

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

/**
 * Refuser tout de suite plutôt que de se connecter n'importe où.
 *
 * `postgres(undefined)` ne lève pas : la bibliothèque retombe sur ses valeurs
 * par défaut (localhost:5432, utilisateur du système). On obtient alors une
 * erreur de connexion incompréhensible, voire — pire — une connexion réussie
 * à une AUTRE base de la machine. Une variable manquante doit se dire, pas se
 * deviner.
 */
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL absente. Elle est définie dans .env.local, chargée " +
      "automatiquement par `next dev` et `next build`, et explicitement par " +
      "les scripts (`tsx --env-file=.env.local`).",
  );
}

const client =
  globalForDb.client ??
  postgres(url, {
    // Obligatoire si l'on passe un jour par le pooler Supabase en
    // mode transaction : les requêtes préparées n'y survivent pas.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
