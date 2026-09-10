import { Masthead } from "@/components/masthead";
import { JourneyFilters } from "@/components/journeys/journey-filters";
import { JourneyCard } from "@/components/journeys/journey-card";
import { Button, EmptyState } from "@/components/ui";
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

      <div className="motion-page px-6 py-10 sm:px-10">
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
          <div className="motion-stagger grid gap-4 lg:grid-cols-2">
            {journeys.map((journey) => (
              <JourneyCard key={journey.id} journey={journey} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
