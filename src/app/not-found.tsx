import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui";

/** 404 hors du groupe applicatif : pas de sidebar, trajectoire interrompue. */
export default function NotFound() {
  return (
    <main className="motion-page min-h-dvh bg-canvas px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="motion-stagger w-full max-w-[480px]">
          <div className="rule-double pt-6">
            <Logo />
          </div>

          <p className="mt-10 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
            Erreur 404
          </p>

          <h1 className="mt-3 text-[42px] font-semibold leading-[1.04] tracking-[-0.01em] text-text">
            Cette page
            <br />
            n&apos;existe pas.
          </h1>

          <div className="mt-8 border-t border-line pt-5 text-[13px] leading-relaxed text-text-muted">
            Le lien est peut-être incomplet, ou la page a été déplacée.
          </div>

          <div className="mt-6">
            <Button href="/">Retour à l&apos;accueil</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
