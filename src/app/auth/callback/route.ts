import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-redirect";

/**
 * Point d'arrivée du lien de connexion reçu par email.
 *
 * Supabase peut renvoyer deux formes selon le flux :
 *   - `?code=…`                    (PKCE)
 *   - `?token_hash=…&type=magiclink` (vérification directe)
 *
 * On traite les deux : le comportement dépend de la version du service et
 * du modèle d'email, et deviner lequel arrive coûte une soirée de débogage.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  /**
   * La cible de redirection DOIT être validée ici aussi, et pas seulement sur
   * la page de connexion : cette route est appelable directement avec
   * n'importe quel paramètre. Sans validation, `?suivant=@evil.example`
   * produisait `http://localhost:3200@evil.example`, dont l'hôte réel est
   * `evil.example`.
   */
  const next = safeInternalPath(searchParams.get("suivant"));

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?erreur=lien_invalide`);
}
