import Link from "next/link";
import { Glyph } from "@/components/brand/glyph";

export function MarketingFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-[1fr_auto_auto]">
          <div className="max-w-[320px]">
            <span className="flex items-center gap-2.5">
              <Glyph className="h-5 w-5" />
              <span className="text-[15px] font-semibold uppercase tracking-[0.12em]">
                LaunchPath
              </span>
            </span>
            <p className="mt-4 text-[13px] leading-relaxed text-paper/60">
              Des parcours d&apos;intégration qui se suivent tout seuls, pour
              les équipes RH et Customer Success.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-paper/50">
              Produit
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              <li>
                <a href="#fonctionnement" className="text-paper/80 no-underline hover:text-paper hover:underline">
                  Fonctionnement
                </a>
              </li>
              <li>
                <a href="#tarifs" className="text-paper/80 no-underline hover:text-paper hover:underline">
                  Tarifs
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="text-paper/80 no-underline hover:text-paper hover:underline">
                  Démonstration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-paper/50">
              Accès
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              <li>
                <Link href="/login" className="text-paper/80 no-underline hover:text-paper hover:underline">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-paper/80 no-underline hover:text-paper hover:underline">
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
        <div className="mt-12 border-t border-paper/20 pt-6">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-paper/50">
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
