import { Masthead } from "@/components/masthead";
import { TemplateForm } from "@/components/templates/template-form";
import { requireMembership } from "@/server/auth/session";
import { getMembers } from "@/server/db/queries/members";
import { memberFrom } from "@/server/db/queries/members-lookup";

export default async function NewTemplatePage() {
  const membership = await requireMembership();
  const rows = await getMembers(membership.organizationId);

  // Les responsables proposés sont les membres de l'organisation, et
  // seulement eux.
  const members = rows
    .map((row) => memberFrom(row.userId, row.email))
    .filter((member): member is NonNullable<typeof member> => member !== null);

  return (
    <>
      <Masthead kicker="Templates · Nouveau modèle" title="Créer un template" />
      <div className="motion-page px-6 pb-16 pt-10 sm:px-10">
        <TemplateForm members={members} />
      </div>
    </>
  );
}
