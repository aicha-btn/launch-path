import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Deux rôles, et il faut les distinguer :
 *
 * 1. Rafraîchir la session à chaque requête. Sans ça, le jeton expire et
 *    l'utilisateur est déconnecté au bout d'une heure sans comprendre pourquoi.
 *
 * 2. Interdire l'accès aux écrans applicatifs sans session.
 *
 * ATTENTION — ce n'est PAS la couche d'autorisation. Le middleware protège
 * les pages, pas les données : une Server Action reste un endpoint HTTP
 * public, appelable directement. Chaque action doit re-vérifier
 * l'authentification, l'organisation et le rôle. Voir
 * docs/plan_action_launchpath.md, semaine 2, « piège à connaître ».
 */

const PROTECTED = ["/dashboard", "/journeys", "/templates", "/my-tasks", "/settings"];

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` et non `getSession()` : getUser valide le jeton auprès du
  // serveur d'authentification, getSession fait confiance au cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // On mémorise la destination pour y revenir après connexion.
    url.searchParams.set("suivant", pathname);
    return NextResponse.redirect(url);
  }

  // Déjà connecté : la page de connexion n'a plus de sens.
  // `/welcome` n'est PAS traité ici : la page décide elle-même, parce que la
  // réponse dépend de la base (a-t-on déjà une organisation ?) et que le
  // proxy n'y a pas accès.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tout sauf les fichiers statiques et les images. Il FAUT que le
     * middleware tourne sur les pages publiques aussi : c'est lui qui
     * rafraîchit la session, donc l'en-tête de la landing sait si
     * l'utilisateur est connecté.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
