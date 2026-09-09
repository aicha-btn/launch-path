/**
 * LE module des dates — décision d'architecture n° 2 : une échéance est un
 * jour civil, pas un instant.
 *
 * Deux règles, et elles sont différentes :
 *
 *   1. `today()` et `toBusinessDate()` sont les SEULES façons d'obtenir un
 *      jour civil à partir d'une horloge. Interdiction d'appeler `new Date()`
 *      ailleurs pour comparer une échéance — le serveur raisonne en UTC, et
 *      une tâche due aujourd'hui apparaîtrait en retard entre minuit et deux
 *      heures du matin.
 *
 *   2. Tout le reste est PUR : parsing, décalage, écart, formatage. Aucune
 *      horloge, aucun fuseau. C'est ce qui rend ces fonctions testables.
 *
 * `new Date()` reste légitime pour HORODATER une écriture (`completedAt`,
 * `acceptedAt`) : on enregistre alors un instant, pas un jour.
 */

const BUSINESS_TZ = "Europe/Paris";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------------ */
/* Primitives — validées, pures, partagées avec scheduling.ts          */
/* ------------------------------------------------------------------ */

/**
 * Convertit `YYYY-MM-DD` en `Date` ancrée à minuit UTC.
 *
 * Lève une erreur explicite sur une entrée invalide. C'est délibéré : sans
 * validation, `daysBetween("bidon", …)` renvoyait `NaN`, et `lateDays`
 * interprétait `NaN > 0` comme `false` — donc « pas en retard ». Une réponse
 * fausse et silencieuse est bien pire qu'une exception.
 */
export function parseCivilDate(iso: string): Date {
  if (!ISO_DATE.test(iso)) {
    throw new Error(`Date attendue au format YYYY-MM-DD, reçu « ${iso} ».`);
  }

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Attrape les dates impossibles que l'expression régulière laisse passer,
  // comme 2026-02-31 : JavaScript les décale silencieusement au mois suivant.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Date inexistante : « ${iso} ».`);
  }

  return date;
}

/**
 * Vrai si `iso` est un jour civil qui EXISTE réellement.
 *
 * À utiliser à la place d'une simple expression régulière de format : celle-ci
 * accepte `2026-02-31` et `2026-13-01`. Les actions validaient ainsi la forme
 * puis levaient une exception au moment du calcul — écran d'erreur au lieu
 * d'un refus lisible.
 */
export function isValidCivilDate(iso: string): boolean {
  try {
    parseCivilDate(iso);
    return true;
  } catch {
    return false;
  }
}

/** `Date` ancrée en UTC → `YYYY-MM-DD`. Pur. */
export function formatCivilDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Horloge — les deux seuls points d'entrée                            */
/* ------------------------------------------------------------------ */

/** Date du jour au format `YYYY-MM-DD`, en fuseau métier. */
export function today(): string {
  return toBusinessDate(new Date());
}

/**
 * Convertit un instant (`timestamptz` de la base) en jour civil du fuseau
 * métier.
 *
 * À utiliser partout au lieu de `date.toISOString().slice(0, 10)`, qui donne
 * le jour en UTC : un enregistrement créé à 23h30 à Paris serait affiché avec
 * la date de la veille.
 */
export function toBusinessDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/* ------------------------------------------------------------------ */
/* Arithmétique — pure                                                 */
/* ------------------------------------------------------------------ */

/** Décale une date civile de `n` jours CALENDAIRES (week-ends compris). */
export function addDays(iso: string, n: number): string {
  if (!Number.isInteger(n)) {
    throw new Error(`Décalage entier attendu, reçu « ${n} ».`);
  }

  const date = parseCivilDate(iso);
  date.setUTCDate(date.getUTCDate() + n);
  return formatCivilDate(date);
}

/** Nombre de jours de `from` vers `to`. Négatif si `to` est antérieur. */
export function daysBetween(from: string, to: string): number {
  const start = parseCivilDate(from);
  const end = parseCivilDate(to);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Nombre de jours de retard, 0 si l'échéance n'est pas dépassée.
 *
 * LA frontière du produit : une tâche due aujourd'hui n'est PAS en retard.
 */
export function lateDays(dueDate: string, reference = today()): number {
  const diff = daysBetween(dueDate, reference);
  return diff > 0 ? diff : 0;
}

/* ------------------------------------------------------------------ */
/* Formatage — pur                                                     */
/* ------------------------------------------------------------------ */

/**
 * `12 MARS` — pour les colonnes d'échéance.
 *
 * Formaté en UTC, et c'est volontaire : l'entrée est DÉJÀ un jour civil,
 * ancré à minuit UTC par `parseCivilDate`. Le formater dans un autre fuseau
 * reviendrait à le convertir une seconde fois. Ne pas « corriger » en
 * `BUSINESS_TZ` — contrairement à `formatDateTime`, qui reçoit un instant.
 */
export function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
    .format(parseCivilDate(iso))
    .toUpperCase();
}

/** `JEUDI 12 MARS 2026` — pour les sur-titres. Même remarque sur l'UTC. */
export function formatLong(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(parseCivilDate(iso))
    .toUpperCase();
}

/**
 * `12 MARS · 14:32` — pour l'historique d'activité.
 *
 * Reçoit un INSTANT, donc converti en fuseau métier — à l'inverse de
 * `formatShort`, qui reçoit un jour civil.
 */
export function formatDateTime(date: Date): string {
  const day = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: BUSINESS_TZ,
  })
    .format(date)
    .toUpperCase();

  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TZ,
  }).format(date);

  return `${day} · ${time}`;
}
