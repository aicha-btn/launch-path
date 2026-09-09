import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Configuration des tests d'INTÉGRATION.
 *
 * Séparés des tests unitaires pour une raison précise : ceux-ci exigent une
 * base de données lancée (`supabase start`). Les mélanger rendrait
 * `pnpm verify` dépendant de Docker, alors que sa valeur est justement de
 * tourner partout et vite.
 *
 * Usage : pnpm test:db
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    setupFiles: ["./src/test/setup-env.ts"],
    // Les tests partagent une base : les faire tourner en parallèle
    // provoquerait des interférences entre jeux de données.
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
