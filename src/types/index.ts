/**
 * Types de vue partagés entre serveur et composants client.
 *
 * Les trois statuts sont des unions ÉCRITES À LA MAIN, et c'est délibéré.
 * Les dériver des `pgEnum` de Drizzle — `(typeof taskStatus.enumValues)[number]`
 * — a été essayé puis abandonné : le type s'élargit alors tout seul, et la
 * frontière avec la base cesse de protester. Mesuré sur une valeur ajoutée à
 * l'énumération `task_status` : 4 erreurs de compilation avec les unions
 * manuelles, une seule avec la version dérivée.
 *
 * Ces trois lignes sont donc un contrat que la base doit satisfaire, pas une
 * copie à synchroniser. Toucher un `pgEnum` dans schema.ts casse la
 * compilation ici : c'est le comportement recherché.
 */
export type TaskStatus = "todo" | "done" | "skipped";
export type JourneyStatus = "active" | "completed" | "cancelled";
export type TargetType = "employee" | "customer";

export type Member = {
  id: string;
  name: string;
  /** Deux lettres, affichées dans le carré d'encre. */
  initials: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  assignee: Member | null;
  /** Jour civil `YYYY-MM-DD`. Jamais un timestamp. */
  dueDate: string;
  status: TaskStatus;
  position: number;
};

export type Journey = {
  id: string;
  /** La personne ou le client dont c'est l'onboarding. */
  subjectName: string;
  /** Snapshot du nom du template au lancement — voir décision n° 1. */
  templateName: string;
  owner: Member;
  startDate: string;
  status: JourneyStatus;
  completedAt?: string;
  tasks: Task[];
};

export type TemplateStep = {
  id: string;
  title: string;
  position: number;
  /** Relatif au démarrage. Peut être négatif. */
  offsetDays: number;
  defaultAssignee: Member | null;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  targetType: TargetType;
  isArchived: boolean;
  steps: TemplateStep[];
};
