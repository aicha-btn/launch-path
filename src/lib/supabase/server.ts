import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase côté serveur — UNIQUEMENT pour l'authentification.
 *
 * Les données applicatives ne passent jamais par ici : elles passent par
 * Drizzle avec le rôle `postgres` (voir src/server/db). Ce client ne sert
 * qu'à savoir QUI est connecté, ce qui est exactement le périmètre que la
 * clé anon publique doit avoir — le reste est fermé par RLS.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Server Component : les cookies y sont en
            // lecture seule. Le rafraîchissement de session est déjà fait
            // par le middleware, donc on peut ignorer sans risque.
          }
        },
      },
    },
  );
}
