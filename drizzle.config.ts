import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  /**
   * LE garde-fou de la décision n° 6.
   *
   * Sans ce filtre, drizzle-kit voit le schéma `auth` géré par Supabase,
   * le considère comme une dérive à corriger, et génère des migrations qui
   * suppriment les tables d'authentification. Drizzle ne touche QUE `public`.
   */
  schemaFilter: ["public"],

  verbose: true,
  strict: true,
});
