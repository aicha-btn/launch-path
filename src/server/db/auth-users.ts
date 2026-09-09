import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Vue en LECTURE SEULE sur la table d'authentification de Supabase.
 *
 * POURQUOI CE FICHIER EST SÉPARÉ DE schema.ts
 *
 * drizzle.config.ts ne déclare qu'un seul fichier de schéma :
 * `./src/server/db/schema.ts`. drizzle-kit ne collecte donc que les tables
 * exportées par CE fichier. Déclarer `auth.users` ici — puis l'importer dans
 * schema.ts sans la ré-exporter — garantit qu'aucune migration ne tentera de
 * créer ou modifier la table d'authentification, ce qui casserait la
 * connexion. Vérifié : la première tentative générait bien un
 * `CREATE TABLE "auth"."users"`.
 *
 * `schemaFilter: ["public"]` ne suffit PAS : il ne filtre que
 * l'introspection, pas la génération.
 *
 * NE JAMAIS écrire dans cette table. Les comptes se créent uniquement par
 * l'API d'authentification.
 */
const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});
