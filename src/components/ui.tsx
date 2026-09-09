import Link from "next/link";
import type { Member } from "@/types";

/** Bouton — § 8. Hauteur 36 px, mono capitales, aucun arrondi. */
export function Button({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
}) {
  const base =
    "inline-flex h-9 items-center justify-center px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-[120ms]";
  const styles = {
    primary: "bg-offset text-paper hover:bg-ink",
    secondary: "border border-ink text-ink hover:bg-ink-08",
    quiet: "text-ink-70 hover:text-ink",
  }[variant];

  const classes = `${base} ${styles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${classes} no-underline`}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes}>
      {children}
    </button>
  );
}

/** Carré d'encre à initiales — jamais un cercle, jamais une photo. */
export function Avatar({
  member,
  size = "sm",
}: {
  member: Member;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-8 w-8 text-[11px]" : "h-6 w-6 text-[10px]";
  return (
    <span
      title={member.name}
      className={`inline-grid shrink-0 place-items-center bg-ink font-mono text-paper ${dim}`}
    >
      {member.initials}
    </span>
  );
}

/** Chiffre du dashboard, posé sur un aplat d'encre directe. */
export function Figure({
  value,
  label,
  tone = "paper",
}: {
  value: number;
  label: string;
  tone?: "paper" | "offset" | "signal" | "correction";
}) {
  const styles = {
    paper: "border border-ink bg-paper text-ink",
    offset: "border border-offset bg-offset text-paper",
    signal: "border border-ink bg-signal text-ink",
    correction: "border border-correction bg-correction text-paper",
  }[tone];

  return (
    <div className={`flex flex-col justify-between p-4 ${styles}`}>
      <span className="font-mono text-[36px] leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-6 font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.08em]">
        {label}
      </span>
    </div>
  );
}

/** État vide typographique — § 8. Pas d'icône, pas d'illustration. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="max-w-[480px] py-16">
      <p className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
        {title}
      </p>
      <div className="mt-5 border-t border-ink pt-5 text-[13px] leading-relaxed text-ink-70">
        {children}
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
