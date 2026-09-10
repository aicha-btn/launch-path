import Link from "next/link";
import { Glyph } from "@/components/brand/glyph";

export function MarketingFooter() {
  return (
    <footer className="motion-rise bg-blocked text-surface">
      <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-10">
        <div className="motion-stagger grid gap-10 sm:grid-cols-[1fr_auto_auto]">
          <div className="max-w-[320px]">
            <span className="flex items-center gap-2.5">
              <Glyph className="h-5 w-5" />
              <span className="text-[15px] font-semibold tracking-[0.02em]">
                LaunchPath
              </span>
            </span>
            <p className="mt-4 text-[13px] leading-relaxed text-surface/70">
              Un système d&apos;orchestration pour transformer les onboardings
              en parcours lisibles, assignés et suivis.
            </p>
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-surface/60">
              Produit
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              <li>
                <a href="#fonctionnement" className="motion-link inline-block text-surface/80 no-underline hover:text-surface hover:underline">
                  Fonctionnement
                </a>
              </li>
              <li>
                <a href="#tarifs" className="motion-link inline-block text-surface/80 no-underline hover:text-surface hover:underline">
                  Tarifs
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="motion-link inline-block text-surface/80 no-underline hover:text-surface hover:underline">
                  Démonstration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-surface/60">
              Accès
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              <li>
                <Link href="/login" className="motion-link inline-block text-surface/80 no-underline hover:text-surface hover:underline">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="motion-link inline-block text-surface/80 no-underline hover:text-surface hover:underline">
                  Ouvrir l&apos;application
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mention nécessaire : la page annonce des tarifs ET des limites de
            forfait, alors qu'aucun service commercial n'existe derrière et
            qu'aucune limite n'est appliquée. La première version ne couvrait
            que les tarifs. */}
        <div className="mt-12 border-t border-surface/20 pt-6">
          <p className="text-[11px] font-medium uppercase leading-relaxed tracking-[0.08em] text-surface/55">
            LaunchPath est un projet de démonstration construit pour un
            portfolio technique. Les tarifs et les limites de forfait affichés
            sont illustratifs : aucun paiement n&apos;est possible, et aucune
            limite n&apos;est appliquée.
          </p>
        </div>
      </div>
    </footer>
  );
}
