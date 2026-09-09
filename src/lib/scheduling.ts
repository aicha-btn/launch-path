/**
 * Calcul des échéances — décision d'architecture n° 3.
 *
 * Fonction PURE : pas de base de données, pas de fuseau horaire, pas
 * d'horloge. C'est ce qui la rend testable en quelques lignes, et c'est
 * pourquoi elle vit ici plutôt que dans l'action de lancement.
 *
 * Elle manipule des jours civils au format `YYYY-MM-DD`, jamais des
 * instants — voir décision n° 2. L'arithmétique passe par `Date.UTC` pour
 * qu'aucun fuseau ne puisse décaler un résultat.
 *
 * Les jours fériés ne sont pas gérés : hors MVP, mentionné dans les limites
 * du README.
 */

/**
 * Le parsing et le formatage viennent de `dates.ts` : ce sont les mêmes
 * primitives, et les dupliquer ici garantissait qu'elles divergeraient un
 * jour. La dépendance va dans le bon sens — le calcul métier s'appuie sur
 * les primitives de date, jamais l'inverse.
 */
import { formatCivilDate as format, parseCivilDate as parse } from "./dates";

/** 0 = dimanche, 6 = samedi. */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Décale une date civile de `offsetDays` jours OUVRÉS.
 *
 * @param startDate jour d'arrivée, `YYYY-MM-DD`
 * @param offsetDays positif = après, négatif = avant, 0 = le jour même
 *
 * Un décalage nul renvoie la date de départ telle quelle, même si c'est un
 * week-end : le jour d'arrivée ne se déplace pas.
 */
export function addBusinessDays(startDate: string, offsetDays: number): string {
  if (!Number.isInteger(offsetDays)) {
    throw new Error(`Décalage entier attendu, reçu « ${offsetDays} ».`);
  }

  const date = parse(startDate);

  if (offsetDays === 0) return format(date);

  const step = offsetDays > 0 ? 1 : -1;
  let remaining = Math.abs(offsetDays);

  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + step);
    // On ne décompte que les jours ouvrés : un samedi traversé ne coûte rien.
    if (!isWeekend(date)) remaining -= 1;
  }

  return format(date);
}

/** Nombre de tâches traitées sur le total — pour la barre de progression. */
export function progress(
  tasks: { status: "todo" | "done" | "skipped" }[],
): { done: number; total: number; percent: number } {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status !== "todo").length;

  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/** Vrai si toutes les tâches sont traitées — sert au recalcul du statut. */
export function isFullyProcessed(
  tasks: { status: "todo" | "done" | "skipped" }[],
): boolean {
  return tasks.length > 0 && tasks.every((task) => task.status !== "todo");
}
