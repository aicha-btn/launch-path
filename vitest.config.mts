import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    // Uniquement les tests unitaires. Le parcours Playwright a besoin d'un
    // serveur lancé et d'une base réinitialisée : il vivra dans `test:e2e`,
    // jamais dans `pnpm verify`.
    include: ["src/**/*.test.ts"],
    // Les tests d'intégration exigent une base lancée : ils ont leur propre
    // configuration (`pnpm test:db`) pour que `pnpm verify` reste exécutable
    // sans Docker.
    exclude: ["**/node_modules/**", "src/**/*.db.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
