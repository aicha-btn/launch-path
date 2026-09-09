import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { memberships, organizations } from "@/server/db/schema";

/**
 * Décision d'architecture n° 4 : toute requête part d'ici.
 *
 * Aucun composant, aucune action ne doit interroger la base sans avoir
 * d'abord obtenu l'`organizationId` par cette voie. C'est ce qui garantit
 * qu'un utilisateur ne voit jamais les données d'une autre organisation.
 */

export type CurrentMembership = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: "admin" | "member";
};

/** L'utilisateur connecté, ou `null`. Ne redirige pas. */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Le membership de l'utilisateur connecté, ou `null`. Ne redirige pas. */
export async function getCurrentMembership(): Promise<CurrentMembership | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [row] = await db
    .select({
      organizationId: memberships.organizationId,
      organizationName: organizations.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (!row) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    role: row.role,
  };
}

/**
 * Version pour les écrans et actions protégés : redirige au lieu de
 * renvoyer `null`.
 *
 * Deux cas distincts, et il faut les traiter différemment :
 *   - pas de session      → connexion
 *   - session sans organisation → création d'organisation
 */
export async function requireMembership(): Promise<CurrentMembership> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getCurrentMembership();
  if (!membership) redirect("/welcome");

  return membership;
}

/** Pour les actions réservées aux administrateurs. */
export async function requireAdmin(): Promise<CurrentMembership> {
  const membership = await requireMembership();
  if (membership.role !== "admin") {
    throw new Error("Cette action est réservée aux administrateurs.");
  }
  return membership;
}
