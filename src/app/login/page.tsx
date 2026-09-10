import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { safeInternalPath } from "@/lib/safe-redirect";

/** Écran de connexion : une entrée sobre vers le cockpit LaunchPath. */
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
    <main className="motion-page min-h-dvh bg-canvas px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="motion-stagger w-full max-w-[420px]">
          <div className="rule-double pt-6">
            <Link href="/" className="motion-link inline-block no-underline">
              <Logo />
            </Link>
          </div>

          <h1 className="mt-10 text-[42px] font-semibold leading-[1.04] tracking-[-0.01em] text-text">
            Chaque intégration,
            <br />
            étape par étape.
          </h1>

          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
            Suivi des parcours d&apos;intégration
          </p>

          {erreur && (
            <p className="motion-rise mt-8 rounded-md bg-overdue-soft px-3 py-2 text-[12px] font-semibold leading-relaxed text-overdue">
              {erreur === "demo_absent"
                ? "Compte de démonstration introuvable. Lancez pnpm db:reset."
                : "Lien expiré ou déjà utilisé. Demandez-en un nouveau."}
            </p>
          )}

          <LoginForm next={next} />

          <div className="mt-12 border-t border-line pt-5">
            <p className="text-[13px] leading-relaxed text-text-muted">
              Aucun mot de passe. Vous recevez un lien à usage unique, valable
              une heure.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
