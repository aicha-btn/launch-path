import { expect, test, type Page } from "@playwright/test";

/**
 * Le design system exige : aucun débordement horizontal de la page, et le
 * contenu large (tableaux) doit défiler dans son propre conteneur.
 *
 * Cette exigence était cochée depuis des semaines sans avoir jamais été
 * mesurée. Elle l'est maintenant.
 *
 * ATTENTION au piège de ce test : un tableau en `min-w-[640px]` DÉPASSE
 * légitimement, parce qu'il vit dans un parent `overflow-x-auto`. Le premier
 * jet signalait ces éléments comme des défauts — il faut donc ignorer tout
 * élément ayant un ancêtre à défilement, et non seulement les éléments
 * défilants eux-mêmes.
 *
 * Les pages APPLICATIVES sont couvertes elles aussi. Elles ne l'étaient pas :
 * seules la page publique et la connexion l'étaient, alors que l'exigence porte
 * sur tout le produit — et que c'est dans l'application que vivent les listes,
 * les filtres et les lignes de tâches.
 */

const VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: VIEWPORT });

/** Renvoie les éléments qui dépassent illégitimement, au plus cinq. */
async function debordements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const limite = document.documentElement.clientWidth + 1;
    const fautifs: string[] = [];

    function aUnAncetreDefilant(el: Element): boolean {
      let courant: Element | null = el.parentElement;
      while (courant && courant !== document.body) {
        const overflow = getComputedStyle(courant).overflowX;
        if (overflow === "auto" || overflow === "scroll") return true;
        courant = courant.parentElement;
      }
      return false;
    }

    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (el.getBoundingClientRect().right <= limite) continue;
      if (aUnAncetreDefilant(el)) continue;
      fautifs.push(
        `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`,
      );
    }

    return fautifs.slice(0, 5);
  });
}

/** Vérifie les deux conditions sur la page courante. */
async function verifier(page: Page, nom: string) {
  const doc = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));

  expect(
    doc.scroll,
    `${nom} : la page défile latéralement (${doc.scroll} > ${doc.client})`,
  ).toBeLessThanOrEqual(doc.client);

  expect(await debordements(page), `${nom} : éléments qui dépassent`).toEqual([]);
}

const PUBLIQUES = [
  { path: "/", nom: "page publique" },
  { path: "/login", nom: "connexion" },
];

for (const { path, nom } of PUBLIQUES) {
  test(`${nom} : aucun débordement horizontal à ${VIEWPORT.width} px`, async ({
    page,
  }) => {
    await page.goto(path);
    await verifier(page, nom);
  });
}

test(`pages applicatives : aucun débordement horizontal à ${VIEWPORT.width} px`, async ({
  page,
}) => {
  // Une seule connexion pour les cinq écrans : le compte de démonstration a un
  // mot de passe précisément pour permettre ce genre de test.
  await page.goto("/login");
  await page.getByRole("button", { name: /compte de démonstration/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const APPLICATIVES = [
    { path: "/dashboard", nom: "tableau de bord" },
    { path: "/journeys", nom: "liste des onboardings" },
    { path: "/templates", nom: "liste des parcours types" },
    { path: "/settings/members", nom: "équipe" },
  ];

  for (const { path, nom } of APPLICATIVES) {
    await page.goto(path);
    // Les écrans applicatifs sont rendus côté serveur : on attend que le
    // squelette ait laissé la place au contenu, sinon on mesure un vide.
    await expect(page.locator("main")).toBeVisible();
    await verifier(page, nom);
  }

  // Le détail d'un onboarding, où vivent les lignes de tâches et le panneau.
  await page.goto("/journeys");
  await page.getByRole("link", { name: /Clara Nguyen/i }).first().click();
  await expect(page).toHaveURL(/\/journeys\/[0-9a-f-]{36}/);
  await verifier(page, "détail d'un onboarding");
});
