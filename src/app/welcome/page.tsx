import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { getCurrentMembership, getCurrentUser } from "@/server/auth/session";

/**
 * Première connexion sans invitation : création de l'organisation.
 *
 * La route s'appelle `/welcome` et non `/onboarding` : dans un produit dont
 * le métier EST l'onboarding, ce mot est réservé aux parcours des personnes
 * intégrées. Voir docs/design-system.md § 4.
 */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Déjà membre d'une organisation : cet écran n'a plus de raison d'être.
  const membership = await getCurrentMembership();
  if (membership) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-paper px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="w-full max-w-[460px]">
          <div className="rule-double pt-6">
            <Logo />
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
            Première connexion
          </p>

          <h1 className="mt-3 font-serif text-[44px] leading-[1.02] tracking-[-0.02em] text-ink">
            Créez votre
            <br />
            organisation.
          </h1>

          <p className="mt-6 max-w-[46ch] text-[13px] leading-relaxed text-ink-70">
            Elle regroupe vos parcours types, vos intégrations en cours et les
            membres de votre équipe. Vous en serez administrateur, et pourrez
            inviter vos collègues ensuite.
          </p>

          <WelcomeForm />

          <div className="mt-12 border-t border-ink-15 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
              Connecté en tant que {user.email}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
