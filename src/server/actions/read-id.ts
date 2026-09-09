import { isUuid } from "@/server/db/queries/ids";

/**
 * Lecture d'un identifiant depuis un `FormData`.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Les colonnes `id` sont de type `uuid`. Passer une valeur qui n'en est pas un
 * ne renvoie pas « aucun résultat » : Postgres lève `22P02 invalid input
 * syntax for type uuid`. Une action recevait donc une exception là où elle
 * devait renvoyer « introuvable ».
 *
 * C'est la même cause que le bug `/journeys/j-clara`, mais côté écriture — et
 * il était présent dans **22 endroits**. Le garde-fou des lectures
 * (`queries/ids.ts`) ne protégeait que les pages.
 *
 * Les identifiants arrivent de champs cachés : l'interface envoie toujours de
 * vraies valeurs. Le cas ne se produit donc que sur requête forgée. Ce n'est
 * pas une faille — c'est la différence entre « refusé proprement » et « 500 ».
 */

/** Identifiant obligatoire. `null` si absent ou mal formé. */
export function readId(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return isUuid(value) ? value : null;
}

/**
 * Identifiant optionnel, pour les champs où le vide est une valeur légitime
 * — « non assignée » par exemple.
 *
 * Renvoie `undefined` quand la valeur est mal formée, ce qui permet à
 * l'appelant de distinguer « effacer » (null) de « valeur invalide ».
 */
export function readOptionalId(
  formData: FormData,
  key: string,
): string | null | undefined {
  const value = String(formData.get(key) ?? "").trim();
  if (value === "") return null;
  return isUuid(value) ? value : undefined;
}
