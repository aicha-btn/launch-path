/**
 * Garde-fou sur les identifiants venant de l'URL.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Les colonnes `id` sont de type `uuid`. Interroger la base avec une valeur
 * qui n'en est pas un ne renvoie PAS zéro ligne : Postgres lève une erreur
 * `22P02 invalid input syntax for type uuid`.
 *
 * Conséquence observée en vrai : `/journeys/j-clara` faisait remonter une
 * exception au lieu d'un `null`. La page n'appelait donc jamais `notFound()`,
 * et comme la réponse partait déjà en flux à cause de `loading.tsx`, la
 * frontière d'erreur ne pouvait plus s'afficher — l'utilisateur restait sur
 * un squelette infini.
 *
 * Toute fonction de lecture qui reçoit un identifiant d'URL doit donc passer
 * par ici et renvoyer `null` si le format est invalide. Un lien tronqué, un
 * vieux marque-page ou une URL bricolée doivent donner un 404, jamais une
 * erreur serveur.
 */

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
