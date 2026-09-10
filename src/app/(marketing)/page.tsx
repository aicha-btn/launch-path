import Link from "next/link";
import type { Metadata } from "next";
import {
  DueBadge,
  JourneyPathPreview,
  OwnerBadge,
  PathRail,
  currentTask,
  nextTask,
  overdueCount,
} from "@/components/path-rail";
import { JOURNEYS } from "@/mocks/landing-preview";

export const metadata: Metadata = {
  title: "LaunchPath — Des onboardings qui se suivent tout seuls",
  description:
    "Transformez vos checklists d'onboarding en parcours orchestrés : checkpoints, owners, échéances et prochaines actions au même endroit.",
};

/**
 * Régénération toutes les heures.
 *
 * Sans ça, cette page est prérendue une seule fois au build (`○ Static` dans
 * la sortie de `next build`). Or le visuel du hero appelle `today()` pour
 * calculer les retards : les dates seraient donc figées au jour du
 * déploiement, et le hero vieillirait semaine après semaine.
 *
 * Invisible en développement — le serveur re-rend à chaque requête. Ça ne se
 * verrait qu'en ligne, longtemps après la mise en production.
 *
 * Une heure est le bon compromis : on garde la vitesse du statique, et
 * l'écart maximal avec la réalité reste sans conséquence visible.
 */
export const revalidate = 3600;

/* Le parcours en retard du jeu de démonstration sert de visuel : le produit
   se montre lui-même, sans capture d'écran ni illustration. */
const DEMO = JOURNEYS[2];

/* ------------------------------------------------------------------ */
/* Éléments de composition                                             */
/* ------------------------------------------------------------------ */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 max-w-[24ch] text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-text sm:text-[44px]">
      {children}
    </h2>
  );
}

function Cta({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "primary-action h-11 px-6"
      : "secondary-action h-11 px-6";

  return (
    <Link
      href={href}
      className={`motion-button ${styles}`}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  /**
   * La landing affiche le même langage que le produit : rail, checkpoints,
   * owners et échéances, à partir des données d'exemple.
   */
  const current = currentTask(DEMO.tasks);
  const next = nextTask(DEMO.tasks);
  const late = overdueCount(DEMO.tasks);

  return (
    <main className="motion-page bg-canvas">
      {/* ============================ HERO ============================ */}
      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-24">
          <div className="motion-stagger max-w-[900px]">
            <Kicker>Système d&apos;orchestration de parcours</Kicker>

            <h1 className="mt-6 max-w-[13ch] text-[52px] font-semibold leading-[0.98] tracking-[-0.03em] text-text sm:text-[76px]">
              LaunchPath orchestre vos onboardings.
            </h1>

            <p className="mt-8 max-w-[58ch] text-[16px] leading-relaxed text-text-muted">
              Transformez une procédure dispersée entre Notion, Excel, Slack et
              emails en un chemin lisible : checkpoints, owners, échéances,
              handoffs et prochaine action au même endroit.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Cta href="/dashboard">Voir la démonstration</Cta>
              <Cta href="/login" variant="secondary">
                Créer un compte
              </Cta>
            </div>

            <p className="mt-6 text-[13px] font-medium text-text-soft">
              Démonstration ouverte · Aucune carte bancaire
            </p>
          </div>

          <div className="motion-card motion-rise-delay mt-12 rounded-lg border border-line bg-surface-raised p-5">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
                      {DEMO.templateName}
                    </p>
                    <p className="mt-2 truncate text-[26px] font-semibold leading-none tracking-[-0.01em] text-text">
                      {DEMO.subjectName}
                    </p>
                  </div>
                  <span className="rounded-full bg-overdue-soft px-3 py-1 text-[12px] font-semibold text-overdue">
                    {late} checkpoint{late > 1 ? "s" : ""} à rattraper
                  </span>
                </div>

                <div className="mt-6 min-w-0 overflow-hidden rounded-md bg-surface p-4 ring-1 ring-line">
                  <PathRail tasks={DEMO.tasks} compact />
                  <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-soft">
                        Actuel
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-text">
                        {current?.title ?? "Destination atteinte"}
                      </p>
                      {current && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <OwnerBadge member={current.assignee} />
                          <DueBadge task={current} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-soft">
                        Suivant
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-text">
                        {next?.title ?? "Aucun checkpoint suivant"}
                      </p>
                      {next && (
                        <div className="mt-3">
                          <DueBadge task={next} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-md bg-surface p-4 ring-1 ring-line">
                <JourneyPathPreview tasks={DEMO.tasks} limit={6} />
              </div>
            </div>

            <p className="mt-5 border-t border-line pt-4 text-[12px] font-medium text-text-soft">
              Composants produit réels · données d&apos;exemple
            </p>
          </div>
        </div>
      </section>

      {/* ========================== PROBLÈME ========================== */}
      <section className="border-b border-line">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Le problème</Kicker>
          <SectionTitle>
            Un onboarding raté ne se voit qu&apos;une fois qu&apos;il est trop
            tard.
          </SectionTitle>

          <div className="motion-stagger mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                figure: "01",
                title: "Le modèle se perd",
                body: "Chaque intégration est une copie manuelle d'un document. Les améliorations que vous trouvez en route ne remontent jamais dans le modèle de référence.",
                tone: "paper",
              },
              {
                figure: "02",
                title: "Les échéances glissent",
                body: "« La première semaine » n'est pas une date. Sans échéance réelle et sans responsable nommé, une étape attend indéfiniment.",
                tone: "signal",
              },
              {
                figure: "03",
                title: "Personne ne voit rien",
                body: "Répondre à « où en sont les quatre intégrations en cours ? » demande d'ouvrir quatre documents et de relancer trois personnes.",
                tone: "paper",
              },
            ].map((item) => (
              <div
                key={item.figure}
                className={`motion-card rounded-lg border border-line p-6 sm:p-7 ${
                  item.tone === "signal" ? "bg-warning-soft" : "bg-surface"
                }`}
              >
                <span className="font-mono text-[28px] leading-none tabular-nums text-primary-text">
                  {item.figure}
                </span>
                <h3 className="mt-6 text-[15px] font-semibold text-text">
                  {item.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== FONCTIONNEMENT ======================= */}
      <section id="fonctionnement" className="scroll-mt-4 border-b border-line">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Fonctionnement</Kicker>
          <SectionTitle>Trois gestes, et le suivi se fait tout seul.</SectionTitle>

          <ol className="motion-stagger mt-12">
            {[
              {
                n: "01",
                title: "Vous créez un parcours type",
                body: "Les étapes, leur ordre, le responsable de chacune, et un délai relatif — « trois jours avant l'arrivée », « à la fin de la première semaine ». Vous ne l'écrivez qu'une fois.",
              },
              {
                n: "02",
                title: "Vous le lancez pour une personne",
                body: "Vous indiquez qui arrive et quand. LaunchPath copie le parcours, calcule chaque échéance en jours ouvrés à partir de la date d'arrivée, et prévient chaque responsable par email.",
              },
              {
                n: "03",
                title: "Vous ne surveillez plus rien",
                body: "Le tableau de bord affiche l'avancement de chaque intégration et fait remonter les retards. Une relance quotidienne part automatiquement vers les responsables concernés.",
              },
            ].map((step) => (
              <li
                key={step.n}
                className="motion-row grid gap-4 border-t border-line py-8 sm:grid-cols-[80px_1fr] sm:gap-10"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft font-mono text-[15px] font-semibold tabular-nums text-primary-text">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-text">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================= FONCTIONNALITÉS ====================== */}
      <section className="border-b border-line">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Ce que ça fait</Kicker>
          <SectionTitle>Le nécessaire, et rien de plus.</SectionTitle>

          <div className="motion-stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Parcours réutilisables", "Un modèle par type d'arrivée : développeur, commercial, nouveau client. Modifiable sans toucher aux intégrations en cours."],
              ["Échéances en jours ouvrés", "Les délais relatifs deviennent des dates réelles. Les week-ends sont exclus, les préparatifs avant l'arrivée sont gérés."],
              ["Un responsable par étape", "Chacun voit ses propres tâches, triées par échéance. Plus de « je croyais que quelqu'un d'autre s'en occupait »."],
              ["Retards visibles", "Une seule couleur dans toute l'interface signale le retard. Impossible de ne pas la voir."],
              ["Relances automatiques", "Un rappel par email la veille de l'échéance, puis chaque jour de retard, sans que personne ne les déclenche."],
              ["Historique complet", "Qui a fait quoi, quand, et ce qui a été commenté. Utile pour améliorer le parcours type."],
            ].map(([title, body]) => (
              <div key={title} className="motion-card rounded-lg border border-line bg-surface p-6">
                <h3 className="text-[14px] font-semibold text-text">
                  {title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-text-muted">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= COMPARAISON ======================== */}
      <section id="comparaison" className="scroll-mt-4 border-b border-line">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Comparaison</Kicker>
          <SectionTitle>
            Ce qu&apos;un document partagé ne fera jamais.
          </SectionTitle>

          <div className="mt-12 max-w-full overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-3 pr-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-soft">
                    Besoin
                  </th>
                  <th className="pb-3 pr-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-soft">
                    Tableur ou Notion
                  </th>
                  <th className="rounded-t-md bg-primary-soft px-4 pb-3 pt-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-text">
                    LaunchPath
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Calculer les échéances depuis la date d'arrivée", "À la main, à chaque fois", "Automatique, en jours ouvrés"],
                  ["Prévenir le bon responsable", "Un message Slack, quand on y pense", "Email à l'assignation"],
                  ["Relancer une étape en retard", "Quand quelqu'un s'en aperçoit", "Chaque jour, automatiquement"],
                  ["Voir toutes les intégrations d'un coup", "Ouvrir chaque document", "Un tableau de bord"],
                  ["Améliorer la procédure pour la suite", "La copie a divergé de l'original", "Le modèle reste la référence"],
                ].map(([need, before, after]) => (
                  <tr key={need} className="motion-row border-b border-line">
                    <td className="py-4 pr-6 text-[14px] font-semibold text-text">
                      {need}
                    </td>
                    <td className="py-4 pr-6 text-[13px] text-text-soft">
                      {before}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-primary-text">
                      {after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================== TARIFS =========================== */}
      <section id="tarifs" className="scroll-mt-4 border-b border-line">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Tarifs</Kicker>
          <SectionTitle>Au nombre de personnes qui suivent, pas qui sont suivies.</SectionTitle>

          <div className="motion-stagger mt-12 grid gap-4 lg:grid-cols-3">
            {[
              {
                name: "Découverte",
                price: "0",
                unit: "€",
                detail: "Pour tester sur une première intégration",
                features: [
                  "1 parcours type",
                  "3 intégrations simultanées",
                  "2 membres",
                  "Rappels par email",
                ],
                cta: "Commencer",
                href: "/login",
                highlight: false,
              },
              {
                name: "Équipe",
                price: "12",
                unit: "€ / membre / mois",
                detail: "Pour une équipe RH ou Customer Success",
                features: [
                  "Parcours types illimités",
                  "Intégrations illimitées",
                  "Membres illimités",
                  "Historique et commentaires",
                  "Relances quotidiennes",
                ],
                cta: "Essayer",
                href: "/login",
                highlight: true,
              },
              {
                name: "Structure",
                price: "Sur devis",
                unit: "",
                detail: "Plusieurs équipes, besoins particuliers",
                features: [
                  "Tout le forfait Équipe",
                  "Plusieurs organisations",
                  "Accompagnement au démarrage",
                  "Export des données",
                ],
                // Le libellé décrit ce que le lien FAIT. « Nous écrire »
                // promettait un formulaire de contact qui n'existe pas.
                cta: "Voir la démonstration",
                href: "/dashboard",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`motion-card flex flex-col rounded-lg border border-line p-7 ${
                  plan.highlight
                    ? "bg-primary text-surface"
                    : "bg-surface text-text"
                }`}
              >
                <p
                  className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    plan.highlight ? "text-surface/80" : "text-text-muted"
                  }`}
                >
                  {plan.name}
                </p>

                <p className="mt-5 font-mono text-[40px] leading-none tabular-nums">
                  {plan.price}
                  {plan.unit && (
                    <span className="ml-1 text-[13px]">{plan.unit}</span>
                  )}
                </p>

                <p
                  className={`mt-4 text-[13px] leading-relaxed ${
                    plan.highlight ? "text-surface/80" : "text-text-muted"
                  }`}
                >
                  {plan.detail}
                </p>

                <ul
                  className={`motion-stagger mt-7 flex-1 space-y-2.5 border-t pt-6 text-[13px] ${
                    plan.highlight ? "border-surface/25" : "border-line"
                  }`}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <span aria-hidden className="font-mono">
                        —
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`motion-button mt-8 h-11 px-5 ${
                    plan.highlight
                      ? "secondary-action bg-surface text-primary-text hover:bg-primary-soft"
                      : "primary-action"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== QUESTIONS ========================= */}
      <section id="questions" className="scroll-mt-4 border-b border-line">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Questions</Kicker>
          <SectionTitle>Ce qu&apos;on nous demande le plus.</SectionTitle>

          <dl className="motion-stagger mt-12 max-w-[76ch]">
            {[
              [
                "Que se passe-t-il si je modifie un parcours type déjà lancé ?",
                "Rien pour les intégrations en cours : elles conservent les étapes telles qu'elles étaient au lancement. C'est volontaire — on ne réécrit pas l'historique d'une intégration commencée. Vos modifications s'appliquent aux lancements suivants.",
              ],
              [
                "Comment sont calculées les échéances ?",
                "Chaque étape porte un délai relatif à la date d'arrivée, positif ou négatif. Au lancement, ces délais deviennent des dates réelles en excluant les samedis et dimanches. Une étape « trois jours avant » tombe donc trois jours ouvrés avant l'arrivée.",
              ],
              [
                "Est-ce que les personnes intégrées ont un accès ?",
                "Non. LaunchPath est un outil interne : seuls les membres de votre organisation y accèdent. La personne qui arrive n'a pas de compte à créer.",
              ],
              [
                "Combien de temps pour démarrer ?",
                "Le temps d'écrire votre premier parcours type, soit une dizaine de minutes. Le lancement d'une intégration prend ensuite une trentaine de secondes.",
              ],
              [
                "Mes données sont-elles isolées des autres clients ?",
                "Oui. Chaque requête est filtrée par organisation côté serveur, et la base refuse tout accès direct depuis l'extérieur.",
              ],
            ].map(([question, answer]) => (
              <div key={question} className="motion-row border-t border-line py-7">
                <dt className="text-[15px] font-semibold text-text">
                  {question}
                </dt>
                <dd className="mt-3 text-[13px] leading-relaxed text-text-muted">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ========================= CTA FINAL ========================== */}
      <section className="bg-primary text-surface">
        <div className="motion-rise mx-auto max-w-[1280px] px-6 py-20 sm:px-10 sm:py-24">
          <div className="max-w-[26ch]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-surface/75">
              Prêt à essayer
            </p>
            <p className="mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[56px]">
              La prochaine arrivée est déjà dans deux semaines.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="motion-button inline-flex h-11 items-center rounded-full bg-surface px-6 text-[13px] font-semibold text-primary-text no-underline transition-colors duration-[120ms] hover:bg-primary-soft"
            >
              Voir la démonstration
            </Link>
            <Link
              href="/login"
              className="motion-button inline-flex h-11 items-center rounded-full border border-surface/60 px-6 text-[13px] font-semibold text-surface no-underline transition-colors duration-[120ms] hover:bg-surface hover:text-primary-text"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
