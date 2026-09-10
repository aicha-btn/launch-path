import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { getCurrentMembership, getCurrentUser } from "@/server/auth/session";

/**
 * Première connexion sans invitation : création de l'organisation.
 *
 * La route s'appelle `/welcome` et non `/onboarding` : dans un produit dont
 * le métier EST l'onboarding, ce mot est réservé aux parcours des personnes
 * intégrées.
 */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Déjà membre d'une organisation : cet écran n'a plus de raison d'être.
  const membership = await getCurrentMembership();
  if (membership) redirect("/dashboard");

  return (
    <main className="motion-page min-h-dvh bg-canvas px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="motion-stagger w-full max-w-[460px]">
          <div className="rule-double pt-6">
            <Logo />
          </div>

          <p className="mt-10 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
            Première connexion
          </p>

          <h1 className="mt-3 text-[42px] font-semibold leading-[1.04] tracking-[-0.01em] text-text">
            Créez votre
            <br />
            organisation.
          </h1>

          <p className="mt-6 max-w-[46ch] text-[13px] leading-relaxed text-text-muted">
            Elle regroupe vos parcours types, vos intégrations en cours et les
            membres de votre équipe. Vous en serez administrateur, et pourrez
            inviter vos collègues ensuite.
          </p>

          <WelcomeForm />

          <div className="mt-12 border-t border-line pt-5">
            <p className="text-action">
              Connecté en tant que {user.email}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
