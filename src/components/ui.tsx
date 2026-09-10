import Link from "next/link";
import type { Member } from "@/types";

/** Bouton : net, utilisable, avec un radius modéré propre au produit. */
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
    "motion-button inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-colors duration-[120ms]";
  const styles = {
    primary: "bg-primary text-surface hover:bg-primary-text",
    secondary:
      "border border-line-strong bg-surface text-text hover:border-primary hover:text-primary-text",
    quiet: "text-text-muted hover:text-primary-text",
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

/** Initiales humaines : ownership et handoff, pas décoration. */
export function Avatar({
  member,
  size = "sm",
}: {
  member: Member;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-9 w-9 text-[12px]" : "h-7 w-7 text-[11px]";
  return (
    <span
      title={member.name}
      className={`motion-avatar inline-grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary-text ${dim}`}
    >
      {member.initials}
    </span>
  );
}

/** Chiffre de synthèse, pensé comme instrument de cockpit. */
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
    paper: "border border-line bg-surface text-text",
    offset: "border border-primary-soft bg-primary-soft text-primary-text",
    signal: "border border-warning-soft bg-warning-soft text-warning",
    correction: "border border-overdue-soft bg-overdue-soft text-overdue",
  }[tone];

  return (
    <div className={`motion-card flex min-h-[120px] flex-col justify-between rounded-md p-4 ${styles}`}>
      <span className="motion-rise font-mono text-[34px] leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-6 text-[12px] font-semibold leading-tight text-current">
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
    <div className="motion-rise max-w-[520px] rounded-lg bg-surface p-6 ring-1 ring-line">
      <div aria-hidden className="mb-6 flex max-w-[180px] items-center">
        <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
        <span className="h-[2px] flex-1 bg-line" />
        <span className="h-3 w-3 rounded-full border-2 border-line-strong bg-surface" />
        <span className="h-[2px] flex-1 bg-line" />
        <span className="h-3 w-3 rounded-full border-2 border-line-strong bg-surface" />
      </div>
      <p className="text-[30px] font-semibold leading-tight tracking-[-0.01em] text-text sm:text-[36px]">
        {title}
      </p>
      <div className="mt-5 border-t border-line pt-5 text-[13px] leading-relaxed text-text-muted">
        {children}
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
