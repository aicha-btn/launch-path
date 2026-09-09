import { addDays, today } from "@/lib/dates";
import type { Journey, Member, Task, Template, TemplateStep } from "@/types";

/**
 * Données d'aperçu pour la LANDING PUBLIQUE uniquement.
 *
 * Tous les écrans applicatifs lisent désormais la vraie base. Ce fichier
 * subsiste pour une seule raison : la page `/` est publique, donc sans
 * organisation ni session — elle ne peut pas interroger la base sans
 * exposer les données d'un client réel.
 *
 * Le visuel du hero utilise malgré tout les VRAIS composants du produit
 * (`Folio`, `TaskRow`, `Stamp`) : le jour où le design system change, la
 * landing suit automatiquement.
 *
 * Les dates sont relatives à aujourd'hui, jamais figées.
 */

export const ORGANIZATION = "Atelier Novembre";

export const MEMBERS: Record<string, Member> = {
  manon: { id: "u1", name: "Manon Bertrand", initials: "MB" },
  karim: { id: "u2", name: "Karim Diallo", initials: "KD" },
  alice: { id: "u3", name: "Alice Rey", initials: "AR" },
};

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

function step(
  position: number,
  title: string,
  offsetDays: number,
  defaultAssignee: Member | null,
): TemplateStep {
  return { id: `s${position}`, title, position, offsetDays, defaultAssignee };
}

const DEV_STEPS: TemplateStep[] = [
  step(1, "Créer les comptes (Google, Slack, GitHub)", -3, MEMBERS.karim),
  step(2, "Préparer le poste de travail", -2, MEMBERS.karim),
  step(3, "Envoyer l'email de bienvenue et le programme", -1, MEMBERS.manon),
  step(4, "Accueil et visite des locaux", 0, MEMBERS.manon),
  step(5, "Signature des documents administratifs", 0, MEMBERS.manon),
  step(6, "Installation de l'environnement de développement", 1, MEMBERS.alice),
  step(7, "Première mise en production accompagnée", 5, MEMBERS.alice),
  step(8, "Point de fin de première semaine", 5, MEMBERS.alice),
  step(9, "Formation sécurité et RGPD", 10, MEMBERS.manon),
  step(10, "Bilan de fin de période d'essai", 30, MEMBERS.alice),
];

const CLIENT_STEPS: TemplateStep[] = [
  step(1, "Réunion de cadrage", -2, MEMBERS.manon),
  step(2, "Collecte des accès et des identifiants", 0, MEMBERS.karim),
  step(3, "Import des données existantes", 3, MEMBERS.karim),
  step(4, "Configuration du compte", 7, MEMBERS.karim),
  step(5, "Formation de l'administrateur", 10, MEMBERS.alice),
  step(6, "Formation des utilisateurs", 14, MEMBERS.alice),
  step(7, "Revue à trente jours", 30, MEMBERS.manon),
  step(8, "Passation au support", 45, MEMBERS.manon),
];

const SALES_STEPS: TemplateStep[] = [
  step(1, "Accès au CRM", 0, MEMBERS.karim),
  step(2, "Formation produit", 1, MEMBERS.alice),
  step(3, "Écoute d'appels enregistrés", 3, MEMBERS.alice),
  step(4, "Premier appel accompagné", 7, MEMBERS.alice),
  step(5, "Objectifs du premier mois", 14, MEMBERS.manon),
  step(6, "Revue à trente jours", 30, MEMBERS.manon),
  step(7, "Certification produit", 30, MEMBERS.alice),
];

export const TEMPLATES: Template[] = [
  {
    id: "tpl-dev",
    name: "Onboarding développeur",
    description:
      "Parcours d'intégration complet pour un profil technique, du matériel à la fin de période d'essai.",
    targetType: "employee",
    isArchived: false,
    steps: DEV_STEPS,
  },
  {
    id: "tpl-client",
    name: "Onboarding client SaaS",
    description:
      "Mise en service d'un nouveau compte client, du cadrage à la passation au support.",
    targetType: "customer",
    isArchived: false,
    steps: CLIENT_STEPS,
  },
  {
    id: "tpl-sales",
    name: "Onboarding commercial",
    description: "Montée en compétence d'un nouveau profil commercial.",
    targetType: "employee",
    isArchived: true,
    steps: SALES_STEPS,
  },
];

/* ------------------------------------------------------------------ */
/* Parcours lancés                                                     */
/* ------------------------------------------------------------------ */

/** Copie les étapes en tâches — c'est le snapshot de la décision n° 1. */
function buildTasks(
  steps: TemplateStep[],
  startDate: string,
  doneUpTo: number,
  journeyId: string,
): Task[] {
  return steps.map((s) => ({
    id: `${journeyId}-t${s.position}`,
    title: s.title,
    assignee: s.defaultAssignee,
    dueDate: addDays(startDate, s.offsetDays),
    status: s.position <= doneUpTo ? "done" : "todo",
    position: s.position,
  }));
}

const T = today();

export const JOURNEYS: Journey[] = [
  {
    // Démarre demain : la préparation est faite, rien en retard.
    id: "j-sofia",
    subjectName: "Sofia Marchetti",
    templateName: "Onboarding développeur",
    owner: MEMBERS.manon,
    startDate: addDays(T, 1),
    status: "active",
    tasks: buildTasks(DEV_STEPS, addDays(T, 1), 3, "j-sofia"),
  },
  {
    // Arrivé hier : à mi-parcours, une tâche due aujourd'hui.
    id: "j-yanis",
    subjectName: "Yanis Bouchard",
    templateName: "Onboarding développeur",
    owner: MEMBERS.alice,
    startDate: addDays(T, -1),
    status: "active",
    tasks: buildTasks(DEV_STEPS, addDays(T, -1), 6, "j-yanis"),
  },
  {
    // Le cas qui rend le dashboard utile : trois tâches en retard.
    id: "j-clara",
    subjectName: "Clara Nguyen",
    templateName: "Onboarding client SaaS",
    owner: MEMBERS.karim,
    startDate: addDays(T, -20),
    status: "active",
    tasks: buildTasks(CLIENT_STEPS, addDays(T, -20), 3, "j-clara"),
  },
  {
    // Terminé récemment.
    id: "j-tom",
    subjectName: "Tom Lefèvre",
    templateName: "Onboarding commercial",
    owner: MEMBERS.alice,
    startDate: addDays(T, -45),
    status: "completed",
    completedAt: addDays(T, -3),
    tasks: buildTasks(SALES_STEPS, addDays(T, -45), 7, "j-tom"),
  },
];

export function findJourney(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}
