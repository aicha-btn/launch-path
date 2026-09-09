import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { safeInternalPath } from "@/lib/safe-redirect";

/**
 * Écran de connexion — docs/design-system.md § 13.
 *
 * Composition de couverture de revue : titre de publication en petit
 * (le lockup en Archivo), accroche en grand (Instrument Serif).
 * Bloc aligné à gauche avec de grandes marges — le brutalisme éditorial
 * ne centre pas.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string; erreur?: string }>;
}) {
  const { suivant, erreur } = await searchParams;

  // Validation centralisée — voir src/lib/safe-redirect.ts. Un simple
  // `startsWith("/")` laissait passer `//evil.example`.
  const next = safeInternalPath(suivant);

  return (
    <main className="min-h-dvh bg-paper px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="w-full max-w-[420px]">
          <div className="rule-double pt-6">
            <Link href="/" className="no-underline">
              <Logo />
            </Link>
          </div>

          <h1 className="mt-10 font-serif text-[44px] leading-[1.02] tracking-[-0.02em] text-ink">
            Chaque intégration,
            <br />
            étape par étape.
          </h1>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
            Suivi des parcours d&apos;intégration
          </p>

          {erreur && (
            <p className="mt-8 bg-correction px-3 py-2 font-mono text-[11px] uppercase leading-relaxed tracking-[0.08em] text-paper">
              {erreur === "demo_absent"
                ? "Compte de démonstration introuvable. Lancez pnpm db:reset."
                : "Lien expiré ou déjà utilisé. Demandez-en un nouveau."}
            </p>
          )}

          <LoginForm next={next} />

          <div className="mt-12 border-t border-ink-15 pt-5">
            <p className="text-[13px] leading-relaxed text-ink-70">
              Aucun mot de passe. Vous recevez un lien à usage unique, valable
              une heure.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
