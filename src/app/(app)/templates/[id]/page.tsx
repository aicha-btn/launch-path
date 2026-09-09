import { notFound } from "next/navigation";
import { Masthead } from "@/components/masthead";
import { SectionRule } from "@/components/marks";
import { StepEditor } from "@/components/templates/step-editor";
import { TemplateHeaderForm } from "@/components/templates/template-header-form";
import { Button } from "@/components/ui";
import { toggleArchive } from "@/server/actions/templates";
import { requireMembership } from "@/server/auth/session";
import { getMembers } from "@/server/db/queries/members";
import { memberFrom } from "@/server/db/queries/members-lookup";
import { getTemplate } from "@/server/db/queries/templates";

const TARGET_LABEL = {
  employee: "Collaborateur",
  customer: "Client",
} as const;

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membership = await requireMembership();

  // Filtré par organisation : un identifiant appartenant à une autre
  // organisation renvoie un 404, pas les données.
  const [template, memberRows] = await Promise.all([
    getTemplate(membership.organizationId, id),
    getMembers(membership.organizationId),
  ]);

  if (!template) notFound();

  const members = memberRows
    .map((row) => memberFrom(row.userId, row.email))
    .filter((member): member is NonNullable<typeof member> => member !== null);

  return (
    <>
      <Masthead
        kicker={`Template · ${TARGET_LABEL[template.targetType]}`}
        title={template.name}
        meta={[
          `${template.steps.length} ÉTAPE${template.steps.length > 1 ? "S" : ""}`,
          template.isArchived ? "ARCHIVÉ" : "ACTIF",
        ]}
        actions={
          <>
            <Button href="/templates" variant="secondary">
              Retour
            </Button>
            <form action={toggleArchive}>
              <input type="hidden" name="templateId" value={template.id} />
              <input
                type="hidden"
                name="archive"
                value={template.isArchived ? "false" : "true"}
              />
              <button
                type="submit"
                className="motion-button inline-flex h-9 items-center border border-ink px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink transition-colors duration-[120ms] hover:bg-ink-08"
              >
                {template.isArchived ? "Réactiver" : "Archiver"}
              </button>
            </form>
          </>
        }
      />

      <div className="motion-page px-6 pb-16 pt-10 sm:px-10">
        {template.isArchived && (
          <div className="motion-rise mb-10 max-w-[640px] border border-ink bg-signal p-4">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
              Parcours type archivé
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink">
              Il n&apos;apparaît plus au moment de lancer un onboarding. Les
              onboardings déjà lancés depuis ce modèle ne sont pas affectés :
              leurs étapes ont été copiées au lancement.
            </p>
          </div>
        )}

        <section className="motion-rise">
          <SectionRule>Informations</SectionRule>
          <TemplateHeaderForm template={template} />
        </section>

        <section className="motion-rise mt-14">
          <SectionRule count={template.steps.length}>Étapes</SectionRule>
          <div className="mt-2">
            <StepEditor
              templateId={template.id}
              steps={template.steps}
              members={members}
            />
          </div>

          <p className="mt-8 max-w-[62ch] text-[12px] leading-relaxed text-ink-70">
            Le délai est relatif à la date d&apos;arrivée, en jours ouvrés.
            Modifier ce parcours type{" "}
            <strong className="font-semibold text-ink">
              ne change rien aux onboardings déjà lancés
            </strong>{" "}
            : leurs étapes ont été copiées au moment du lancement.
          </p>
        </section>
      </div>
    </>
  );
}
