import Link from "next/link";
import { Masthead } from "@/components/masthead";
import { SectionRule, StatusLabel } from "@/components/marks";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { requireMembership } from "@/server/auth/session";
import { getTemplates } from "@/server/db/queries/templates";

const TARGET_LABEL = {
  employee: "Collaborateur",
  customer: "Client",
} as const;

export default async function TemplatesPage() {
  const membership = await requireMembership();
  const templates = await getTemplates(membership.organizationId);

  const live = templates.filter((t) => !t.isArchived);
  const archived = templates.filter((t) => t.isArchived);

  return (
    <>
      <Masthead
        kicker={`Templates · ${live.length} modèle${live.length > 1 ? "s" : ""}`}
        title="Templates"
        actions={<Button href="/templates/new">Créer un template</Button>}
      />

      <div className="motion-page px-6 py-10 sm:px-10">
        {templates.length === 0 ? (
          <EmptyState
            title="Aucun parcours type."
            action={<Button href="/templates/new">Créer un template</Button>}
          >
            Un parcours type décrit les étapes d&apos;une intégration, leur
            responsable et leur délai. Vous ne l&apos;écrivez qu&apos;une fois.
          </EmptyState>
        ) : (
          <div className="motion-stagger space-y-12">
            <section>
              <SectionRule count={live.length}>Actifs</SectionRule>
              <ul>
                {live.map((template) => {
                  const assignees = [
                    ...new Map(
                      template.steps
                        .filter((s) => s.defaultAssignee)
                        .map((s) => [s.defaultAssignee!.id, s.defaultAssignee!]),
                    ).values(),
                  ];

                  return (
                    <li
                      key={template.id}
                      className="motion-row border-b border-ink-15 transition-colors duration-[120ms] hover:bg-ink-08"
                    >
                      <Link
                        href={`/templates/${template.id}`}
                        className="block px-2 py-5 no-underline"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <p className="text-[15px] font-semibold text-ink">
                            {template.name}
                          </p>
                          <StatusLabel>
                            {TARGET_LABEL[template.targetType]} ·{" "}
                            {template.steps.length} étape
                            {template.steps.length > 1 ? "s" : ""}
                          </StatusLabel>
                        </div>

                        {template.description && (
                          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-ink-70">
                            {template.description}
                          </p>
                        )}

                        {assignees.length > 0 && (
                          <div className="mt-4 flex items-center gap-[2px]">
                            {assignees.map((member) => (
                              <Avatar key={member.id} member={member} />
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {archived.length > 0 && (
              <section>
                <SectionRule count={archived.length}>Archivés</SectionRule>
                <ul>
                  {archived.map((template) => (
                    <li
                      key={template.id}
                      className="motion-row flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-15 py-4"
                    >
                      <Link
                        href={`/templates/${template.id}`}
                        className="motion-link text-[15px] font-semibold text-ink-45 line-through no-underline hover:text-ink-70"
                      >
                        {template.name}
                      </Link>
                      <StatusLabel tone="muted">Archivé</StatusLabel>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
