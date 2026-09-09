"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/server/actions/auth";
import type { CurrentMembership } from "@/server/auth/session";

/**
 * Bloc d'encre directe — § 8. La sidebar ne suit pas le thème : c'est une
 * surface imprimée en bleu offset dans les deux modes.
 *
 * Responsive (§ 6) : barre horizontale en dessous de `md`, colonne fixe
 * au-dessus.
 */

const NAV = [
  { href: "/dashboard", label: "Synthèse" },
  { href: "/journeys", label: "Onboardings" },
  { href: "/templates", label: "Templates" },
  { href: "/my-tasks", label: "Mes tâches" },
  { href: "/settings/members", label: "Équipe" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Deux lettres depuis l'email, faute de nom complet en base. */
function initialsFrom(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "??";
}

export function Sidebar({ membership }: { membership: CurrentMembership }) {
  const pathname = usePathname();
  const initials = initialsFrom(membership.email);

  return (
    <>
      {/* Colonne fixe — desktop */}
      <aside className="hidden w-[260px] shrink-0 flex-col bg-offset text-paper md:flex">
        <div className="px-6 pb-8 pt-6">
          <Link href="/dashboard" className="no-underline">
            <Logo />
          </Link>
          <p className="mt-3 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-paper/60">
            {membership.organizationName}
          </p>
        </div>

        <nav className="flex-1">
          <ul>
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="relative">
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px] bg-paper"
                    />
                  )}
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block px-6 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] no-underline transition-colors duration-[120ms] ${
                      active ? "text-paper" : "text-paper/60 hover:text-paper"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-paper/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center bg-paper font-mono text-[10px] text-offset">
              {initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px]">
              {membership.email}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-paper/50">
              {membership.role === "admin" ? "Administrateur" : "Membre"}
            </span>
            <form action={signOut} className="ml-auto">
              <button
                type="submit"
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-paper/60 underline transition-colors duration-[120ms] hover:text-paper"
              >
                Quitter
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Barre horizontale — mobile */}
      <div className="bg-offset text-paper md:hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="no-underline">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="grid h-6 w-6 place-items-center bg-paper font-mono text-[10px] text-offset">
              {initials}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-paper/60 underline"
              >
                Quitter
              </button>
            </form>
          </div>
        </div>
        <nav className="overflow-x-auto border-t border-paper/20">
          <ul className="flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] no-underline ${
                      active ? "bg-paper text-offset" : "text-paper/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
