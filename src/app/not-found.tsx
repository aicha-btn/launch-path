import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui";

/** 404 hors du groupe applicatif : pas de sidebar, papier plein. */
export default function NotFound() {
  return (
    <main className="min-h-dvh bg-paper px-6 py-16 sm:px-16 lg:px-24">
      <div className="flex min-h-[calc(100dvh-8rem)] items-center">
        <div className="w-full max-w-[480px]">
          <div className="rule-double pt-6">
            <Logo />
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
            Erreur 404
          </p>

          <h1 className="mt-3 font-serif text-[44px] leading-[1.02] tracking-[-0.02em] text-ink">
            Cette page
            <br />
            n&apos;existe pas.
          </h1>

          <div className="mt-8 border-t border-ink pt-5 text-[13px] leading-relaxed text-ink-70">
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
