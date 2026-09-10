import Link from "next/link";
import type { Member } from "@/types";

/**
 * Filtres pilotés par l'URL, sans une ligne de JavaScript.
 *
 * Un simple `<form method="get">` : l'état vit dans l'URL, donc la vue
 * filtrée est partageable, le bouton retour fonctionne, et un rechargement
 * conserve la sélection. C'est aussi ce qui permet aux liens de statut
 * ci-dessous d'être de vrais liens.
 */

export type ActiveFilters = {
  q: string;
  statut: string;
  pilote: string;
  retard: boolean;
  tri: string;
};

const STATUS_TABS = [
  { value: "", label: "Tous" },
  { value: "active", label: "En cours" },
  { value: "completed", label: "Terminés" },
  { value: "cancelled", label: "Annulés" },
];

function buildHref(filters: ActiveFilters, patch: Partial<ActiveFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.statut) params.set("statut", next.statut);
  if (next.pilote) params.set("pilote", next.pilote);
  if (next.retard) params.set("retard", "1");
  if (next.tri) params.set("tri", next.tri);

  const query = params.toString();
  return query ? `/journeys?${query}` : "/journeys";
}

export function JourneyFilters({
  filters,
  members,
  resultCount,
  isFiltered,
}: {
  filters: ActiveFilters;
  members: Member[];
  resultCount: number;
  /**
   * Calculé par la page, pas ici.
   *
   * Les deux endroits en avaient besoin — la page pour choisir l'état vide,
   * ce composant pour afficher « N résultats · Réinitialiser ». Deux calculs
   * parallèles auraient fini par diverger : ajouter un filtre à l'un et pas à
   * l'autre donnait un état vide qui ne correspond plus au bandeau.
   */
  isFiltered: boolean;
}) {
  return (
    <div className="motion-rise mb-8">
      {/* Onglets de statut : des liens, pas un select. Trois choix se
          montrent, ils ne se cachent pas dans un menu déroulant. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-surface-muted p-1">
          {STATUS_TABS.map((tab) => {
            const active = filters.statut === tab.value;
            return (
              <Link
                key={tab.value || "all"}
                href={buildHref(filters, { statut: tab.value })}
                aria-current={active ? "true" : undefined}
                className={`motion-link rounded-full px-3 py-1.5 text-[12px] font-semibold no-underline transition-colors duration-[120ms] ${
                  active
                    ? "bg-surface text-primary-text"
                    : "text-text-muted hover:text-primary-text"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <Link
          href={buildHref(filters, { retard: !filters.retard })}
          className={`motion-button ml-auto inline-flex h-9 items-center rounded-full px-3 text-[12px] font-semibold no-underline transition-colors duration-[120ms] ${
            filters.retard
              ? "bg-overdue-soft text-overdue"
              : "bg-surface text-text-muted ring-1 ring-line hover:text-primary-text"
          }`}
        >
          En retard uniquement
        </Link>
      </div>

      {/* Recherche, pilote et tri. Un bouton explicite : sans JavaScript,
          un select ne peut pas se soumettre tout seul. */}
      <form method="get" action="/journeys" className="mt-5">
        {filters.retard && <input type="hidden" name="retard" value="1" />}
        {filters.statut && (
          <input type="hidden" name="statut" value={filters.statut} />
        )}

        <div className="motion-stagger flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="q"
              className="field-label"
            >
              Recherche
            </label>
            <input
              id="q"
              name="q"
              defaultValue={filters.q}
              placeholder="Nom de la personne ou du client"
              className="motion-input field-control mt-2"
            />
          </div>

          <div>
            <label
              htmlFor="pilote"
              className="field-label"
            >
              Pilote
            </label>
            <select
              id="pilote"
              name="pilote"
              defaultValue={filters.pilote}
              className="motion-input field-control mt-2 sm:w-[190px]"
            >
              <option value="">Tous</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tri"
              className="field-label"
            >
              Tri
            </label>
            <select
              id="tri"
              name="tri"
              defaultValue={filters.tri}
              className="motion-input field-control mt-2 sm:w-[190px]"
            >
              <option value="">Plus récents</option>
              <option value="next">Prochaine échéance</option>
            </select>
          </div>

          <button
            type="submit"
            className="motion-button primary-action shrink-0"
          >
            Filtrer
          </button>
        </div>
      </form>

      {isFiltered && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="text-action text-text-muted">
            {resultCount} résultat{resultCount > 1 ? "s" : ""}
          </span>
          <Link
            href="/journeys"
            className="motion-link text-action underline"
          >
            Réinitialiser
          </Link>
        </div>
      )}
    </div>
  );
}
