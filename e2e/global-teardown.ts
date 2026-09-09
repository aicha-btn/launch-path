import dotenv from "dotenv";
import postgres from "postgres";

/**
 * Nettoyage après le parcours end-to-end.
 *
 * Le test travaille sur la vraie base locale, donc il y laisse un parcours
 * type et un onboarding. Sans ce nettoyage, le jeu de démonstration se
 * remplirait de « E2E … » à chaque exécution — et le dashboard qu'on montre
 * en démonstration deviendrait illisible.
 *
 * SQL brut plutôt que Drizzle : la configuration Playwright ne résout pas
 * l'alias `@/`, et une dépendance de moins ici vaut mieux qu'un contournement.
 */
export default async function teardown() {
  dotenv.config({ path: ".env.local" });

  /**
   * Un nettoyage silencieux est un nettoyage qui n'a pas eu lieu. Sans ce
   * message, la base se remplirait de « E2E … » sans que rien ne l'indique.
   */
  if (!process.env.DATABASE_URL) {
    console.warn(
      "\n  Nettoyage IMPOSSIBLE : DATABASE_URL absente. Les données de test " +
        "restent en base.\n",
    );
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  try {
    // Les tâches, commentaires et événements partent en cascade.
    const journeys = await sql`
      delete from journeys where subject_name like 'E2E %' returning id
    `;
    const templates = await sql`
      delete from templates where name like 'Parcours E2E %' returning id
    `;

    if (journeys.length + templates.length > 0) {
      console.log(
        `\n  Nettoyage : ${journeys.length} onboarding(s) et ${templates.length} parcours type(s) de test supprimés.\n`,
      );
    }
  } finally {
    await sql.end();
  }
}
