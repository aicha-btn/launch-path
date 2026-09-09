/**
 * Point d'entrée unique des lectures — décision d'architecture n° 4.
 *
 * Toute fonction exportée ici exige un `organizationId`. C'est la garantie
 * mécanique qu'aucun écran ne peut lire les données d'une autre organisation :
 * il n'existe simplement pas de fonction pour le faire.
 *
 * `./members-lookup` est volontairement ABSENT de cette liste. Il expose
 * `resolveMembers`, qui lit `auth.users` par identifiants sans notion
 * d'organisation — légitime en interne, où les identifiants proviennent
 * toujours de lignes déjà filtrées, mais l'ouvrir ici mettrait à disposition
 * une lecture d'emails non scopée. Ne pas ajouter la ligne.
 */
export * from "./members";
export * from "./journeys";
export * from "./tasks";
export * from "./templates";
