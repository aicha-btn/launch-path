import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#comparaison", label: "Comparaison" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#questions", label: "Questions" },
];

export function MarketingHeader() {
  return (
    <header className="motion-fade border-b border-ink bg-paper">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link href="/" className="motion-link no-underline">
          <Logo />
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="motion-link inline-block font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-70 no-underline transition-colors duration-[120ms] hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="motion-link hidden font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink no-underline hover:underline sm:block"
          >
            Se connecter
          </Link>
          <Link
            href="/dashboard"
            className="motion-button inline-flex h-9 items-center bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper no-underline transition-colors duration-[120ms] hover:bg-ink"
          >
            Voir la démo
          </Link>
        </div>
      </div>
    </header>
  );
}
