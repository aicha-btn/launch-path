/**
 * Le glyphe est une réduction du composant `Folio` : des étapes sur un
 * parcours, ramenées à trois carrés posés sur un filet — deux franchis,
 * un à venir. Aucun dessin décoratif n'est inventé : le logo est un
 * composant du produit, réduit.
 *
 * Hérite de `currentColor` : encre sur papier dans le contenu,
 * papier sur encre dans la sidebar.
 */
export function Glyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* le filet : le parcours */}
      <path d="M1 12h22" stroke="currentColor" strokeWidth="2" />
      {/* deux stations franchies */}
      <rect x="1" y="9" width="6" height="6" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
      {/* une station à venir */}
      <rect
        x="17.75"
        y="9.75"
        width="4.5"
        height="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
