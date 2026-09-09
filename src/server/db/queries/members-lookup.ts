import { inArray } from "drizzle-orm";
import { db } from "../index";
import { authUsers } from "../auth-users";
import type { Member } from "@/types";

/**
 * Résolution des utilisateurs cités par un lot de lignes.
 *
 * Mutualisé ici parce que les requêtes des parcours et celles des parcours
 * types en avaient toutes les deux besoin — la duplication était en train
 * de s'installer.
 */

/** `auth.users` n'a pas de colonne nom : on dérive l'affichage de l'email. */
export function memberFrom(
  id: string | null,
  email: string | null,
): Member | null {
  if (!id) return null;

  const address = email ?? "";
  const local = address.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : local.slice(0, 2).toUpperCase() || "??";

  return { id, name: address || "(inconnu)", initials };
}

/**
 * Une seule requête pour tous les utilisateurs cités, avec `inArray` — et
 * non un chargement complet de la table suivi d'un filtre en JavaScript.
 */
export async function resolveMembers(
  ids: (string | null)[],
): Promise<Map<string, Member>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const rows = await db
    .select({ id: authUsers.id, email: authUsers.email })
    .from(authUsers)
    .where(inArray(authUsers.id, unique));

  const map = new Map<string, Member>();
  for (const row of rows) {
    const member = memberFrom(row.id, row.email);
    if (member) map.set(row.id, member);
  }
  return map;
}
