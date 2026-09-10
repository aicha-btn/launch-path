"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/server/actions/auth";
import type { CurrentMembership } from "@/server/auth/session";

/**
 * Navigation de workspace : surface calme, marqueur de path sur la vue active.
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
      <aside className="motion-rise hidden w-[280px] shrink-0 flex-col border-r border-line bg-sidebar text-text md:flex">
        <div className="px-6 pb-7 pt-6">
          <Link href="/dashboard" className="motion-link inline-block no-underline text-primary-text">
            <Logo />
          </Link>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-soft">
            Workspace
          </p>
          <p className="mt-1 truncate text-[14px] font-semibold text-text">
            {membership.organizationName}
          </p>
        </div>

        <nav className="flex-1">
          <ul>
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="px-3">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`motion-link flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium no-underline transition-colors duration-[120ms] ${
                      active
                        ? "bg-surface text-primary-text ring-1 ring-primary-soft"
                        : "text-text-muted hover:bg-surface/70 hover:text-text"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 rounded-full border-2 ${
                        active
                          ? "border-primary bg-primary"
                          : "border-line-strong bg-transparent"
                      }`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="motion-avatar grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-surface">
              {initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-text-muted">
              {membership.email}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] font-medium text-text-soft">
              {membership.role === "admin" ? "Administrateur" : "Membre"}
            </span>
            <form action={signOut} className="ml-auto">
              <button
                type="submit"
                className="motion-link text-[12px] font-semibold text-text-soft underline transition-colors duration-[120ms] hover:text-primary-text"
              >
                Quitter
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Barre horizontale — mobile */}
      <div className="motion-rise border-b border-line bg-sidebar text-text md:hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="motion-link no-underline text-primary-text">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="motion-avatar grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-surface">
              {initials}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="motion-link text-[12px] font-semibold text-text-soft underline"
              >
                Quitter
              </button>
            </form>
          </div>
        </div>
        <nav className="overflow-x-auto border-t border-line">
          <ul className="flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`motion-link block whitespace-nowrap px-4 py-3 text-[13px] font-semibold no-underline ${
                      active
                        ? "bg-surface text-primary-text"
                        : "text-text-muted"
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
