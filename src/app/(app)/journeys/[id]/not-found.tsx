import { Masthead } from "@/components/masthead";
import { Button, EmptyState } from "@/components/ui";

export default function JourneyNotFound() {
  return (
    <>
      <Masthead kicker="Onboardings · Introuvable" title="Onboarding inconnu" />
      <div className="px-6 py-10 sm:px-10">
        <EmptyState
          title="Cet onboarding n’existe pas."
          action={<Button href="/journeys">Voir tous les onboardings</Button>}
        >
          Il a peut-être été supprimé, ou le lien est incomplet.
        </EmptyState>
      </div>
    </>
  );
}
