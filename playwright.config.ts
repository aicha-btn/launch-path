import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours end-to-end, sur le chemin critique du produit et le responsive.
 *
 * Il n'entre PAS dans `pnpm verify` : il exige un serveur lancé et une base
 * peuplée. Le mélanger aux tests unitaires rendrait la vérification lente et
 * dépendante de Docker.
 *
 * Usage : pnpm test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,

  use: {
    baseURL: "http://localhost:3200",
    trace: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  /**
   * Réutilise le serveur déjà lancé plutôt que d'en démarrer un autre : le
   * port est fixé à 3200 dans ce projet, deux instances entreraient en
   * conflit.
   */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3200",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
