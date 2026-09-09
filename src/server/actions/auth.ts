"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrigin } from "@/server/origin";

/**
 * Actions d'authentification.
 *
 * Rappel du piège : une Server Action est un endpoint HTTP public. Celles-ci
 * n'ont pas besoin de session (c'est justement leur rôle), mais toutes les
 * autres actions du projet devront re-vérifier l'utilisateur, l'organisation
 * et le rôle.
 */

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestMagicLink(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("suivant") ?? "/dashboard");

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Cette adresse email n'est pas valide." };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?suivant=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { ok: false, error: `Envoi impossible : ${error.message}` };
  }

  return {
    ok: true,
    message: "Lien envoyé. En développement, il arrive dans Inbucket.",
  };
}

/**
 * Accès en un clic au jeu de démonstration.
 *
 * Exister pour une raison précise : la landing invite à « voir la
 * démonstration », mais tous les écrans applicatifs sont protégés. Sans ce
 * raccourci, un recruteur buterait sur un formulaire de connexion — et
 * n'irait pas plus loin.
 *
 * Les identifiants sont ceux du seed, donc publics et sans conséquence.
 */
export async function signInAsDemo(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: "manon@atelier-novembre.test",
    password: "launchpath2026",
  });

  // Redirection dans les deux cas : utilisable directement comme `action`
  // de formulaire, qui n'accepte pas de valeur de retour.
  if (error) redirect("/login?erreur=demo_absent");

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
