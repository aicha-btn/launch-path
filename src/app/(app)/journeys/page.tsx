import Link from "next/link";
import { Masthead } from "@/components/masthead";
import { FolioCompact } from "@/components/folio";
import { JourneyStatusLabel, Stamp } from "@/components/marks";
import { JourneyFilters } from "@/components/journeys/journey-filters";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { formatShort, lateDays } from "@/lib/dates";
import { requireMembership } from "@/server/auth/session";
import {
  countActiveJourneys,
  getFilteredJourneys,
  type JourneyFilters as Filters,
} from "@/server/db/queries/journeys";
import { getMembers } from "@/server/db/queries/members";
import { memberFrom } from "@/server/db/queries/members-lookup";

/** Ne garde que les valeurs attendues : le reste de l'URL est ignoré. */
function parseStatus(raw?: string): Filters["status"] {
  return raw === "active" || raw === "completed" || raw === "cancelled"
    ? raw
    : undefined;
}

export default async function JourneysPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    statut?: string;
    pilote?: string;
    retard?: string;
    tri?: string;
  }>;
}) {
  const params = await searchParams;
  const membership = await requireMembership();

  const memberRows = await getMembers(membership.organizationId);
  const members = memberRows
    .map((row) => memberFrom(row.userId, row.email))
    .filter((member): member is NonNullable<typeof member> => member !== null);

  // Le pilote reçu de l'URL n'est retenu que s'il est vraiment membre :
  // sinon la requête filtrerait sur un identifiant arbitraire.
  const ownerId =
    params.pilote && members.some((m) => m.id === params.pilote)
      ? params.pilote
      : undefined;

  const filters: Filters = {
    q: params.q?.trim() || undefined,
    status: parseStatus(params.statut),
    ownerId,
    lateOnly: params.retard === "1",
    sort: params.tri === "next" ? "next" : "recent",
  };

  const isFiltered = Boolean(
    filters.q || filters.status || filters.ownerId || filters.lateOnly,
  );

  // Le compteur du sur-titre est indépendant des filtres : il annonce un fait
  // sur l'organisation, pas sur la vue courante. Le déduire de la liste
  // filtrée affichait « 0 en cours » dès qu'on choisissait « Terminés ».
  const [journeys, activeCount] = await Promise.all([
    getFilteredJourneys(membership.organizationId, filters),
    countActiveJourneys(membership.organizationId),
  ]);

  return (
    <>
      <Masthead
        kicker={`Onboardings · ${activeCount} en cours`}
        title="Onboardings"
        actions={<Button href="/journeys/new">Lancer un onboarding</Button>}
      />

      <div className="px-6 py-10 sm:px-10">
        <JourneyFilters
          filters={{
            q: params.q ?? "",
            statut: parseStatus(params.statut) ?? "",
            pilote: ownerId ?? "",
            retard: filters.lateOnly ?? false,
            tri: params.tri === "next" ? "next" : "",
          }}
          members={members}
          resultCount={journeys.length}
          isFiltered={isFiltered}
        />

        {journeys.length === 0 ? (
          /**
           * Deux vides, deux messages. La première version servait le message
           * de recherche infructueuse même à une organisation qui n'a encore
           * rien lancé — avec un bouton « Réinitialiser les filtres » alors
           * qu'aucun filtre n'était actif. C'est la toute première visite qui
           * était la plus mal servie.
           */
          isFiltered ? (
            <EmptyState
              title="Aucun résultat."
              action={<Button href="/journeys">Réinitialiser les filtres</Button>}
            >
              Aucun onboarding ne correspond à cette recherche. Essayez un autre
              nom, ou retirez un filtre.
            </EmptyState>
          ) : (
            <EmptyState
              title="Aucun onboarding lancé."
              action={<Button href="/journeys/new">Lancer un onboarding</Button>}
            >
              Un onboarding se lance depuis un parcours type. Les tâches et
              leurs échéances sont générées automatiquement.
            </EmptyState>
          )
        ) : (
          <>
            {/* En-tête de tableau : mono capitales sur filet lourd. */}
            <div className="hidden grid-cols-[1fr_160px_150px_130px] gap-6 border-b-[3px] border-ink pb-2 lg:grid">
              {["Personne", "Progression", "Pilote", "Prochaine échéance"].map(
                (col) => (
                  <span
                    key={col}
                    className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-70 last:text-right"
                  >
                    {col}
                  </span>
                ),
              )}
            </div>

            <ul>
              {journeys.map((journey) => {
                const late = journey.tasks.filter(
                  (t) => t.status === "todo" && lateDays(t.dueDate) > 0,
                ).length;
                const next = journey.tasks.find((t) => t.status === "todo");

                return (
                  <li
                    key={journey.id}
                    className="border-b border-ink-15 transition-colors duration-[120ms] hover:bg-ink-08"
                  >
                    <Link
                      href={`/journeys/${journey.id}`}
                      className="grid gap-3 py-4 no-underline lg:grid-cols-[1fr_160px_150px_130px] lg:items-center lg:gap-6"
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[15px] font-semibold ${
                            journey.status === "active"
                              ? "text-ink"
                              : "text-ink-45 line-through"
                          }`}
                        >
                          {journey.subjectName}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-70">
                          {journey.templateName}
                        </p>
                      </div>

                      <FolioCompact tasks={journey.tasks} />

                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar member={journey.owner} />
                        <span className="truncate text-[12px] text-ink-70">
                          {journey.owner.name}
                        </span>
                      </div>

                      <div className="lg:text-right">
                        {late > 0 ? (
                          <Stamp>{`Retard ${late} tâche${late > 1 ? "s" : ""}`}</Stamp>
                        ) : next ? (
                          <span className="font-mono text-[12px] tabular-nums text-ink-70">
                            {formatShort(next.dueDate)}
                          </span>
                        ) : (
                          <JourneyStatusLabel status={journey.status} />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
