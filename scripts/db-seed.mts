import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { today } from "../src/lib/dates";
import { addBusinessDays } from "../src/lib/scheduling";
import * as schema from "../src/server/db/schema";

/**
 * Jeu de démonstration.
 *
 * Les dates sont TOUJOURS relatives à aujourd'hui : la démonstration reste
 * intéressante quel que soit le jour où on l'ouvre. Un jeu figé finit
 * toujours par afficher un dashboard vide de sens.
 *
 * Les utilisateurs sont créés par l'inscription publique plutôt que par
 * l'API d'administration : ça évite d'avoir besoin de la clé service_role
 * dans un script, et ça fonctionne parce que `enable_confirmations = false`
 * en local. Le mot de passe servira aux tests Playwright de la semaine 6 —
 * le magic link n'est pas testable, il n'existe pas d'OTP de test pour
 * l'email dans Supabase.
 *
 * Les échéances passent par `addBusinessDays`, la MÊME fonction que l'action
 * de lancement. Le seed réimplémentait un décalage en jours calendaires : il
 * produisait donc des échéances le samedi, que l'application ne peut pas
 * générer. Un jeu de démonstration qui ne ressemble pas à la production ment
 * sur le produit.
 *
 * `today` vient de `src/lib/dates.ts` pour la même raison — c'est la source
 * unique du fuseau métier, et le seed en avait sa propre copie.
 *
 * Usage : pnpm db:seed  (ou `pnpm db:reset` pour tout reconstruire)
 */

const PASSWORD = "launchpath2026";

const T = today();

/* ------------------------------------------------------------------ */

/**
 * Une variable manquante doit se dire. Sans ce contrôle, `postgres(undefined)`
 * retombe sur ses valeurs par défaut et tente d'écrire dans une base
 * quelconque de la machine, ou renvoie une erreur de connexion qui n'oriente
 * vers rien.
 */
function requis(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    console.error(
      `\n  ${nom} absente. Ce script se lance via \`pnpm db:seed\`, ` +
        `qui charge .env.local.\n`,
    );
    process.exit(1);
  }
  return valeur;
}

const auth = createClient(
  requis("NEXT_PUBLIC_SUPABASE_URL"),
  requis("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  { auth: { persistSession: false } },
);

const client = postgres(requis("DATABASE_URL"), { prepare: false });
const db = drizzle(client, { schema });

async function createUser(email: string): Promise<string> {
  const { data, error } = await auth.auth.signUp({ email, password: PASSWORD });
  if (error) throw new Error(`${email} : ${error.message}`);
  if (!data.user) throw new Error(`${email} : aucun utilisateur retourné`);
  return data.user.id;
}

console.log("\n  Création des utilisateurs…");

const manon = await createUser("manon@atelier-novembre.test");
const karim = await createUser("karim@atelier-novembre.test");
const alice = await createUser("alice@atelier-novembre.test");

console.log("  Organisation et membres…");

const [org] = await db
  .insert(schema.organizations)
  .values({ name: "Atelier Novembre", slug: "atelier-novembre" })
  .returning();

await db.insert(schema.memberships).values([
  { organizationId: org.id, userId: manon, role: "admin" },
  { organizationId: org.id, userId: karim, role: "member" },
  { organizationId: org.id, userId: alice, role: "member" },
]);

/**
 * Une invitation en attente, pour que l'écran Équipe ne soit pas vide.
 *
 * Le jeton est tiré au hasard à chaque exécution. Il était en dur dans ce
 * fichier : n'importe qui lisant le dépôt pouvait ouvrir
 * `/invitations/<jeton>`, s'inscrire et devenir membre de l'organisation de
 * démonstration. Sans conséquence en local, mais c'est exactement le genre de
 * détail qui survit jusqu'à la mise en ligne.
 */
await db.insert(schema.invitations).values({
  organizationId: org.id,
  email: "nouvelle.recrue@atelier-novembre.test",
  role: "member",
  token: randomBytes(24).toString("base64url"),
  invitedBy: manon,
  expiresAt: new Date(Date.now() + 7 * 86_400_000),
});

console.log("  Templates…");

type StepSeed = [title: string, offsetDays: number, assignee: string | null];

const DEV_STEPS: StepSeed[] = [
  ["Créer les comptes (Google, Slack, GitHub)", -3, karim],
  ["Préparer le poste de travail", -2, karim],
  ["Envoyer l'email de bienvenue et le programme", -1, manon],
  ["Accueil et visite des locaux", 0, manon],
  ["Signature des documents administratifs", 0, manon],
  ["Installation de l'environnement de développement", 1, alice],
  ["Première mise en production accompagnée", 5, alice],
  ["Point de fin de première semaine", 5, alice],
  ["Formation sécurité et RGPD", 10, manon],
  ["Bilan de fin de période d'essai", 30, alice],
];

const CLIENT_STEPS: StepSeed[] = [
  ["Réunion de cadrage", -2, manon],
  ["Collecte des accès et des identifiants", 0, karim],
  ["Import des données existantes", 3, karim],
  ["Configuration du compte", 7, karim],
  ["Formation de l'administrateur", 10, alice],
  ["Formation des utilisateurs", 14, alice],
  ["Revue à trente jours", 30, manon],
  ["Passation au support", 45, manon],
];

const SALES_STEPS: StepSeed[] = [
  ["Accès au CRM", 0, karim],
  ["Formation produit", 1, alice],
  ["Écoute d'appels enregistrés", 3, alice],
  ["Premier appel accompagné", 7, alice],
  ["Objectifs du premier mois", 14, manon],
  ["Revue à trente jours", 30, manon],
  ["Certification produit", 30, alice],
];

async function createTemplate(
  name: string,
  description: string,
  targetType: "employee" | "customer",
  isArchived: boolean,
  steps: StepSeed[],
) {
  const [template] = await db
    .insert(schema.templates)
    .values({
      organizationId: org.id,
      name,
      description,
      targetType,
      isArchived,
    })
    .returning();

  await db.insert(schema.templateSteps).values(
    steps.map(([title, offsetDays, defaultAssigneeId], i) => ({
      templateId: template.id,
      title,
      position: i + 1,
      offsetDays,
      defaultAssigneeId,
    })),
  );

  return template;
}

const devTemplate = await createTemplate(
  "Onboarding développeur",
  "Parcours d'intégration complet pour un profil technique, du matériel à la fin de période d'essai.",
  "employee",
  false,
  DEV_STEPS,
);

const clientTemplate = await createTemplate(
  "Onboarding client SaaS",
  "Mise en service d'un nouveau compte client, du cadrage à la passation au support.",
  "customer",
  false,
  CLIENT_STEPS,
);

const salesTemplate = await createTemplate(
  "Onboarding commercial",
  "Montée en compétence d'un nouveau profil commercial.",
  "employee",
  true,
  SALES_STEPS,
);

console.log("  Parcours lancés…");

/**
 * Instant de traitement d'une tâche terminée.
 *
 * Le seed datait toutes les tâches terminées de `new Date()`, c'est-à-dire de
 * l'instant du seed. Sur le parcours de Tom, clôturé il y a trois jours, les
 * tâches étaient donc terminées APRÈS la clôture du parcours — visible tel
 * quel dans le journal d'activité. On les date du matin de leur échéance,
 * plafonné à la clôture du parcours (ou à maintenant).
 */
function completionInstant(dueDate: string, ceiling?: Date): Date {
  const morning = new Date(`${dueDate}T07:30:00.000Z`); // ≈ 9 h 30 à Paris
  const limit = ceiling ?? new Date();
  return morning > limit ? limit : morning;
}

/** Copie les étapes en tâches — c'est le snapshot de la décision n° 1. */
async function launchJourney(opts: {
  templateId: string;
  templateName: string;
  subjectName: string;
  ownerId: string;
  startDate: string;
  steps: StepSeed[];
  doneUpTo: number;
  status?: "active" | "completed";
  completedAt?: Date;
}) {
  const [journey] = await db
    .insert(schema.journeys)
    .values({
      organizationId: org.id,
      templateId: opts.templateId,
      templateName: opts.templateName,
      subjectName: opts.subjectName,
      ownerId: opts.ownerId,
      startDate: opts.startDate,
      status: opts.status ?? "active",
      completedAt: opts.completedAt,
    })
    .returning();

  await db.insert(schema.tasks).values(
    opts.steps.map(([title, offsetDays, assigneeId], i) => {
      const isDone = i + 1 <= opts.doneUpTo;
      const dueDate = addBusinessDays(opts.startDate, offsetDays);
      return {
        journeyId: journey.id,
        title,
        assigneeId,
        position: i + 1,
        dueDate,
        status: (isDone ? "done" : "todo") as "done" | "todo",
        completedAt: isDone ? completionInstant(dueDate, opts.completedAt) : null,
        completedBy: isDone ? assigneeId : null,
      };
    }),
  );

  await db.insert(schema.activityEvents).values({
    journeyId: journey.id,
    actorId: opts.ownerId,
    type: "journey_launched",
    payload: { templateName: opts.templateName },
  });

  return journey;
}

/**
 * Les quatre dates d'arrivée sont des JOURS OUVRÉS (`addBusinessDays`), pas
 * des jours calendaires. Un décalage nul ne déplace pas la date d'arrivée —
 * c'est voulu et documenté dans `scheduling.ts` — donc une arrivée un samedi
 * produisait des échéances le samedi. Le seed en affichait deux. Personne ne
 * fait arriver une recrue un week-end : la démonstration non plus.
 */

// Démarre le prochain jour ouvré : la préparation est faite, rien en retard.
await launchJourney({
  templateId: devTemplate.id,
  templateName: devTemplate.name,
  subjectName: "Sofia Marchetti",
  ownerId: manon,
  startDate: addBusinessDays(T, 1),
  steps: DEV_STEPS,
  doneUpTo: 3,
});

// Arrivé le jour ouvré précédent : à mi-parcours.
await launchJourney({
  templateId: devTemplate.id,
  templateName: devTemplate.name,
  subjectName: "Yanis Bouchard",
  ownerId: alice,
  startDate: addBusinessDays(T, -1),
  steps: DEV_STEPS,
  doneUpTo: 6,
});

// Le cas qui rend le dashboard utile : trois tâches en retard.
const clara = await launchJourney({
  templateId: clientTemplate.id,
  templateName: clientTemplate.name,
  subjectName: "Clara Nguyen",
  ownerId: karim,
  startDate: addBusinessDays(T, -20),
  steps: CLIENT_STEPS,
  doneUpTo: 3,
});

// Terminé récemment.
await launchJourney({
  templateId: salesTemplate.id,
  templateName: salesTemplate.name,
  subjectName: "Tom Lefèvre",
  ownerId: alice,
  startDate: addBusinessDays(T, -45),
  steps: SALES_STEPS,
  doneUpTo: 7,
  status: "completed",
  completedAt: new Date(Date.now() - 3 * 86_400_000),
});

// Un commentaire sur la première tâche en retard de Clara.
const claraTasks = await db.query.tasks.findMany({
  where: (t, { eq }) => eq(t.journeyId, clara.id),
});
const lateTask = claraTasks.find((t) => t.position === 4);

if (lateTask) {
  await db.insert(schema.comments).values({
    taskId: lateTask.id,
    authorId: karim,
    body: "Le client n'a pas encore transmis les accès à son ancien outil. Relance envoyée.",
  });
  await db.insert(schema.activityEvents).values({
    journeyId: clara.id,
    taskId: lateTask.id,
    actorId: karim,
    type: "comment_added",
    payload: {},
  });
}

/**
 * Le récapitulatif est MESURÉ, pas recopié.
 *
 * Il annonçait « 1 parcours avec 3 retards ». C'était vrai avec l'ancien
 * calcul en jours calendaires, qui rendait l'écart constant. Avec les jours
 * ouvrés, le nombre de retards dépend du jour de la semaine où l'on seede :
 * une phrase figée deviendrait fausse un jour sur deux. On compte.
 */
const [compte] = await client<
  {
    parcours: number;
    retards: number;
    week_ends: number;
  }[]
>`
  select
    (select count(*)::int from journeys where organization_id = ${org.id})
      as parcours,
    (select count(*)::int
       from tasks t
       join journeys j on j.id = t.journey_id
      where j.organization_id = ${org.id}
        and j.status = 'active'
        and t.status = 'todo'
        and t.due_date < (now() at time zone 'Europe/Paris')::date)
      as retards,
    -- Invariant du calcul en jours ouvrés : aucune échéance un samedi ou un
    -- dimanche, sauf décalage nul tombant sur un week-end.
    (select count(*)::int
       from tasks t
       join journeys j on j.id = t.journey_id
      where j.organization_id = ${org.id}
        and extract(isodow from t.due_date) > 5)
      as week_ends
`;

await client.end();

console.log(`
  Jeu de démonstration en place.

  Organisation   Atelier Novembre
  Membres        3 (manon = admin)
  Invitations    1 en attente, jeton aléatoire
  Templates      3 (dont 1 archivé)
  Parcours       ${compte.parcours}
  Tâches en retard ${compte.retards}
  Échéances un week-end  ${compte.week_ends}

  Connexion      manon@atelier-novembre.test
  Mot de passe   ${PASSWORD}
`);
