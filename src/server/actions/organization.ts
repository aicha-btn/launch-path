"use server";

import { redirect } from "next/navigation";
import { getCurrentMembership, getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/db/errors";
import { memberships, organizations } from "@/server/db/schema";
import type { ActionResult } from "@/server/actions/auth";

/** `Atelier Novembre` → `atelier-novembre` */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function createOrganization(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Re-vérification obligatoire : cette action est un endpoint public.
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  // Un utilisateur appartient à une seule organisation (hors MVP : le
  // multi-organisation). Sans ce garde-fou, un rechargement du formulaire
  // en créerait une deuxième.
  const existing = await getCurrentMembership();
  if (existing) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { ok: false, error: "Le nom doit faire au moins deux caractères." };
  }
  if (name.length > 60) {
    return { ok: false, error: "Le nom ne peut pas dépasser soixante caractères." };
  }

  const base = slugify(name) || "organisation";
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ name, slug })
        .returning();

      // Le créateur est administrateur : c'est lui qui invitera les autres.
      await tx.insert(memberships).values({
        organizationId: org.id,
        userId: user.id,
        role: "admin",
      });
    });
  } catch (error) {
    /**
     * `23505` = violation de contrainte d'unicité, ici `memberships_user_key`.
     *
     * La vérification plus haut laisse une fenêtre de concurrence : deux
     * envois simultanés du formulaire passeraient tous les deux. C'est la
     * base qui tranche — et la transaction annule l'organisation créée, donc
     * aucune orpheline ne subsiste.
     */
    if (isUniqueViolation(error)) redirect("/dashboard");
    throw error;
  }

  redirect("/dashboard");
}
