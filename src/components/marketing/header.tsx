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
    <header className="motion-fade border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link href="/" className="motion-link no-underline text-primary-text">
          <Logo />
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="motion-link inline-block text-[13px] font-semibold text-text-muted no-underline transition-colors duration-[120ms] hover:text-primary-text"
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
            className="motion-link hidden text-[13px] font-semibold text-text-muted no-underline hover:text-primary-text hover:underline sm:block"
          >
            Se connecter
          </Link>
          <Link
            href="/dashboard"
            className="motion-button primary-action"
          >
            Voir la démo
          </Link>
        </div>
      </div>
    </header>
  );
}
