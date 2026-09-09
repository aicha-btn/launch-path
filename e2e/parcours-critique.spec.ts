import { expect, test } from "@playwright/test";

/**
 * LE parcours critique du produit, de bout en bout dans un vrai navigateur :
 *
 *   se connecter → créer un parcours type → le lancer →
 *   cocher une étape → voir la progression avancer
 *
 * CONNEXION PAR MOT DE PASSE, PAS PAR MAGIC LINK.
 * Il n'existe pas d'OTP de test pour l'email dans Supabase (seulement pour le
 * SMS) : passer par le lien de connexion obligerait ce test à interroger
 * l'API de la boîte mail locale. Le compte de démonstration créé au seed a un
 * mot de passe, précisément pour ça.
 *
 * Prérequis : `supabase start`, `pnpm db:reset`, puis `pnpm dev`.
 */

const NOM = `E2E ${Date.now().toString(36)}`;
const TEMPLATE = `Parcours E2E ${Date.now().toString(36)}`;

test("de la connexion à la première étape cochée", async ({ page }) => {
  /* --- 1. La page publique mène à l'application ------------------- */

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /ne devraient pas vivre/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /voir la démonstration/i }).first().click();

  // Les écrans applicatifs sont protégés : on doit atterrir sur la connexion.
  await expect(page).toHaveURL(/\/login/);

  /* --- 2. Connexion par le compte de démonstration ---------------- */

  await page
    .getByRole("button", { name: /compte de démonstration/i })
    .click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Atelier Novembre" })).toBeVisible();

  /* --- 3. Créer un parcours type avec ses étapes ------------------ */

  await page.getByRole("link", { name: "Templates", exact: true }).click();
  await page.getByRole("link", { name: /créer un template/i }).click();

  await page.getByLabel("Nom").fill(TEMPLATE);

  const titres = page.locator('input[name="stepTitle"]');
  const delais = page.locator('input[name="stepOffset"]');

  await titres.nth(0).fill("Préparer le poste");
  await delais.nth(0).fill("-2");
  await titres.nth(1).fill("Accueillir");
  await delais.nth(1).fill("0");
  await titres.nth(2).fill("Point de fin de semaine");
  await delais.nth(2).fill("5");

  await page.getByRole("button", { name: /créer le parcours type/i }).click();

  // On arrive sur la page d'édition du parcours type créé.
  await expect(page.getByRole("heading", { name: TEMPLATE })).toBeVisible();

  /* --- 4. Lancer un onboarding ------------------------------------ */

  await page.getByRole("link", { name: "Onboardings", exact: true }).click();
  await page.getByRole("link", { name: /lancer un onboarding/i }).first().click();

  await page.getByLabel(/parcours type/i).selectOption({ label: `${TEMPLATE} — 3 étapes` });
  await page.getByLabel(/personne ou client/i).fill(NOM);

  // L'aperçu des échéances doit apparaître AVANT la validation.
  await expect(page.getByRole("heading", { name: /échéances calculées/i })).toBeVisible();
  await expect(page.getByText("Préparer le poste")).toBeVisible();

  await page.getByRole("button", { name: /lancer l'onboarding/i }).click();

  /* --- 5. La page du parcours ------------------------------------- */

  await expect(page).toHaveURL(/\/journeys\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: NOM })).toBeVisible();

  // Progression initiale : aucune étape traitée sur trois.
  await expect(page.getByText("ÉTAPE 0/3")).toBeVisible();

  /* --- 6. Cocher une étape --------------------------------------- */

  await page.getByRole("button", { name: /terminer « Préparer le poste »/i }).click();

  // Le bouton devient « rouvrir » IMMÉDIATEMENT : c'est la mise à jour
  // optimiste, elle n'attend pas le serveur.
  await expect(
    page.getByRole("button", { name: /rouvrir « Préparer le poste »/i }),
  ).toBeVisible();

  /**
   * La progression, elle, est rendue côté serveur : elle ne bouge qu'une fois
   * l'action terminée et `revalidatePath` passé.
   *
   * Surtout : PAS de `page.reload()` ici. Recharger juste après le clic
   * annulerait l'action encore en vol — le premier jet de ce test échouait
   * exactement pour cette raison. On attend le vrai aller-retour.
   */
  await expect(page.getByText("ÉTAPE 1/3")).toBeVisible({ timeout: 15_000 });

  /* --- 7. L'historique a enregistré le geste --------------------- */

  await expect(page.getByRole("heading", { name: "Historique" })).toBeVisible();
  await expect(page.getByText(/a terminé « Préparer le poste »/i)).toBeVisible();
});
