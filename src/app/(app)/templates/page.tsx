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
              <ul className="mt-4 grid gap-4 lg:grid-cols-2">
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
                      className="motion-card rounded-lg border border-line bg-surface p-5 transition-colors duration-[160ms] hover:border-primary-soft hover:bg-surface-raised"
                    >
                      <Link
                        href={`/templates/${template.id}`}
                        className="block no-underline"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <p className="text-[16px] font-semibold tracking-[-0.01em] text-text">
                            {template.name}
                          </p>
                          <StatusLabel>
                            {TARGET_LABEL[template.targetType]} ·{" "}
                            {template.steps.length} étape
                            {template.steps.length > 1 ? "s" : ""}
                          </StatusLabel>
                        </div>

                        {template.description && (
                          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-text-muted">
                            {template.description}
                          </p>
                        )}

                        <div
                          aria-hidden
                          className="mt-5 flex max-w-[240px] items-center"
                        >
                          {template.steps.slice(0, 6).map((step, index) => {
                            const isLast =
                              index === Math.min(template.steps.length, 6) - 1;
                            return (
                              <span
                                key={step.id}
                                className={`flex items-center ${isLast ? "shrink-0" : "flex-1"}`}
                              >
                                <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
                                {!isLast && (
                                  <span className="h-[2px] flex-1 bg-line" />
                                )}
                              </span>
                            );
                          })}
                        </div>

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
                      className="motion-row flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-4"
                    >
                      <Link
                        href={`/templates/${template.id}`}
                        className="motion-link text-[15px] font-semibold text-text-soft line-through no-underline hover:text-text-muted"
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
