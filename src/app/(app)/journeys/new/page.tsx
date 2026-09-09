import { Masthead } from "@/components/masthead";
import { LaunchForm } from "@/components/journeys/launch-form";
import { today } from "@/lib/dates";
import { requireMembership } from "@/server/auth/session";
import { getMembers } from "@/server/db/queries/members";
import { memberFrom } from "@/server/db/queries/members-lookup";
import { getTemplates } from "@/server/db/queries/templates";

export default async function NewJourneyPage() {
  const membership = await requireMembership();

  const [templates, memberRows] = await Promise.all([
    getTemplates(membership.organizationId),
    getMembers(membership.organizationId),
  ]);

  // Un parcours type archivé ou sans étape ne peut pas être lancé : autant
  // ne pas le proposer plutôt que de laisser l'action le refuser.
  const launchable = templates.filter(
    (template) => !template.isArchived && template.steps.length > 0,
  );

  const members = memberRows
    .map((row) => memberFrom(row.userId, row.email))
    .filter((member): member is NonNullable<typeof member> => member !== null);

  return (
    <>
      <Masthead
        kicker="Onboardings · Nouveau lancement"
        title="Lancer un onboarding"
      />
      <div className="motion-page px-6 pb-16 pt-10 sm:px-10">
        <LaunchForm
          templates={launchable}
          members={members}
          today={today()}
          defaultOwnerId={membership.userId}
        />
      </div>
    </>
  );
}
