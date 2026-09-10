/**
 * Le glyphe est un path rail compact : trois checkpoints, deux segments.
 * Il hérite de currentColor pour rester lié au contexte.
 */
export function Glyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="5" cy="12" r="3.25" fill="currentColor" />
      <circle cx="12" cy="12" r="3.25" fill="currentColor" />
      <circle cx="19" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
