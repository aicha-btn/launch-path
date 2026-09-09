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
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-ink-15 pb-3">
        {STATUS_TABS.map((tab) => {
          const active = filters.statut === tab.value;
          return (
            <Link
              key={tab.value || "all"}
              href={buildHref(filters, { statut: tab.value })}
              aria-current={active ? "true" : undefined}
              className={`motion-link inline-block font-mono text-[11px] font-medium uppercase tracking-[0.08em] no-underline transition-colors duration-[120ms] ${
                active
                  ? "text-ink underline decoration-[2px] underline-offset-[6px]"
                  : "text-ink-45 hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}

        <Link
          href={buildHref(filters, { retard: !filters.retard })}
          className={`motion-button ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.08em] no-underline transition-colors duration-[120ms] ${
            filters.retard
              ? "bg-correction px-2 py-[3px] text-paper"
              : "text-ink-45 hover:text-ink"
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
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Recherche
            </label>
            {/* Exception du système : champ souligné, sans cadre. */}
            <input
              id="q"
              name="q"
              defaultValue={filters.q}
              placeholder="Nom de la personne ou du client"
              className="motion-input mt-2 h-9 w-full border-b border-ink bg-transparent text-sm text-ink placeholder:text-ink-30 focus:outline-none focus-visible:border-b-2"
            />
          </div>

          <div>
            <label
              htmlFor="pilote"
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Pilote
            </label>
            <select
              id="pilote"
              name="pilote"
              defaultValue={filters.pilote}
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-2 text-[13px] text-ink focus:border-ink focus:outline-none sm:w-[190px]"
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
              className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70"
            >
              Tri
            </label>
            <select
              id="tri"
              name="tri"
              defaultValue={filters.tri}
              className="motion-input mt-2 h-9 w-full border border-ink-30 bg-paper px-2 text-[13px] text-ink focus:border-ink focus:outline-none sm:w-[190px]"
            >
              <option value="">Plus récents</option>
              <option value="next">Prochaine échéance</option>
            </select>
          </div>

          <button
            type="submit"
            className="motion-button h-9 shrink-0 bg-offset px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper transition-colors duration-[120ms] hover:bg-ink"
          >
            Filtrer
          </button>
        </div>
      </form>

      {isFiltered && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70">
            {resultCount} résultat{resultCount > 1 ? "s" : ""}
          </span>
          <Link
            href="/journeys"
            className="motion-link font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45 underline hover:text-ink"
          >
            Réinitialiser
          </Link>
        </div>
      )}
    </div>
  );
}
