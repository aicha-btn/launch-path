import { headers } from "next/headers";

/**
 * Origine réelle de la requête, reconstruite depuis les en-têtes.
 *
 * On ne code pas l'URL en dur et on ne la met pas en variable
 * d'environnement : le projet tourne sur `localhost:3200` en local, et
 * tournera sur un domaine Vercel plus tard, avec des URLs de
 * prévisualisation différentes à chaque déploiement. Lire les en-têtes
 * fonctionne dans les trois cas sans configuration.
 */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3200";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
