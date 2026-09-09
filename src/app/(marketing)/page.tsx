import Link from "next/link";
import type { Metadata } from "next";
import { Folio } from "@/components/folio";
import { lateDays } from "@/lib/dates";
import { TaskRow } from "@/components/journeys/task-row";
import { Stamp } from "@/components/marks";
import { JOURNEYS } from "@/mocks/landing-preview";

export const metadata: Metadata = {
  title: "LaunchPath — Des onboardings qui se suivent tout seuls",
  description:
    "Créez des parcours d'intégration réutilisables, lancez-les en trente secondes, et voyez immédiatement qui est en retard. Pour les équipes RH et Customer Success.",
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
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-70">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 max-w-[22ch] font-serif text-[32px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">
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
      ? "bg-offset text-paper hover:bg-ink"
      : "border border-ink text-ink hover:bg-ink-08";

  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center px-6 font-mono text-[11px] font-medium uppercase tracking-[0.08em] no-underline transition-colors duration-[120ms] ${styles}`}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  /**
   * Les tâches réellement EN RETARD, pas « les trois premières à faire ».
   *
   * La version précédente prenait `.filter(status === "todo").slice(0, 3)` et
   * affichait un tampon « Retard 3 tâches » écrit en dur. Ça tombait juste
   * par coïncidence avec le jeu d'aperçu actuel — mais rien ne le garantissait,
   * et le tampon aurait menti dès que les données d'exemple auraient changé.
   * Tout est désormais dérivé.
   */
  const late = DEMO.tasks.filter(
    (task) => task.status === "todo" && lateDays(task.dueDate) > 0,
  );
  const heroTasks = late.slice(0, 3);

  return (
    <main>
      {/* ============================ HERO ============================ */}
      <section className="border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
            <div>
              <Kicker>Onboarding · RH &amp; Customer Success</Kicker>

              <h1 className="mt-6 font-serif text-[46px] leading-[0.98] tracking-[-0.025em] text-ink sm:text-[68px]">
                Vos intégrations
                <br />
                ne devraient pas vivre
                <br />
                dans un tableur.
              </h1>

              <p className="mt-8 max-w-[52ch] text-[15px] leading-relaxed text-ink-70">
                LaunchPath transforme vos procédures d&apos;onboarding en
                parcours réutilisables. Vous les lancez en trente secondes, les
                échéances se calculent seules à partir de la date d&apos;arrivée,
                chaque responsable reçoit sa tâche, et les retards remontent
                sans que personne n&apos;ait à les chercher.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Cta href="/dashboard">Voir la démonstration</Cta>
                <Cta href="/login" variant="secondary">
                  Créer un compte
                </Cta>
              </div>

              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
                Démonstration ouverte · Aucune carte bancaire
              </p>
            </div>

            {/* Le produit se montre lui-même. */}
            <div className="border border-ink bg-paper">
              <div className="border-b-[3px] border-ink px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-70">
                      Onboarding · {DEMO.templateName}
                    </p>
                    <p className="mt-1.5 truncate font-serif text-[26px] leading-none tracking-[-0.02em] text-ink">
                      {DEMO.subjectName}
                    </p>
                  </div>
                  <Stamp tilted>
                    {`Retard ${late.length} tâche${late.length > 1 ? "s" : ""}`}
                  </Stamp>
                </div>

                <div className="mt-5">
                  <Folio tasks={DEMO.tasks} />
                </div>
              </div>

              <div className="px-3 py-2">
                {heroTasks.map((task) => (
                  <TaskRow key={task.id} task={task} readOnly />
                ))}
              </div>

              {/* Formulation exacte : ce ne sont pas des captures, ce sont les
                  composants réels du produit — mais les données sont inventées.
                  « Capture réelle » laissait croire à de vraies données client. */}
              <p className="border-t border-ink-15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45">
                Composants réels · données d&apos;exemple
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== PROBLÈME ========================== */}
      <section className="border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Le problème</Kicker>
          <SectionTitle>
            Un onboarding raté ne se voit qu&apos;une fois qu&apos;il est trop
            tard.
          </SectionTitle>

          <div className="mt-12 grid gap-px border border-ink bg-ink sm:grid-cols-3">
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
                className={`p-6 sm:p-7 ${
                  item.tone === "signal" ? "bg-signal" : "bg-paper"
                }`}
              >
                <span className="font-mono text-[32px] leading-none tabular-nums text-ink">
                  {item.figure}
                </span>
                <h3 className="mt-6 text-[15px] font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-70">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== FONCTIONNEMENT ======================= */}
      <section id="fonctionnement" className="border-b-[3px] border-ink scroll-mt-4">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Fonctionnement</Kicker>
          <SectionTitle>Trois gestes, et le suivi se fait tout seul.</SectionTitle>

          <ol className="mt-12">
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
                className="grid gap-4 border-t border-ink py-8 sm:grid-cols-[80px_1fr] sm:gap-10"
              >
                <span className="grid h-12 w-12 place-items-center bg-offset font-mono text-[15px] tabular-nums text-paper">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-serif text-[24px] leading-tight tracking-[-0.01em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-ink-70">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================= FONCTIONNALITÉS ====================== */}
      <section className="border-b-[3px] border-ink">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Ce que ça fait</Kicker>
          <SectionTitle>Le nécessaire, et rien de plus.</SectionTitle>

          <div className="mt-12 grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Parcours réutilisables", "Un modèle par type d'arrivée : développeur, commercial, nouveau client. Modifiable sans toucher aux intégrations en cours."],
              ["Échéances en jours ouvrés", "Les délais relatifs deviennent des dates réelles. Les week-ends sont exclus, les préparatifs avant l'arrivée sont gérés."],
              ["Un responsable par étape", "Chacun voit ses propres tâches, triées par échéance. Plus de « je croyais que quelqu'un d'autre s'en occupait »."],
              ["Retards visibles", "Une seule couleur dans toute l'interface signale le retard. Impossible de ne pas la voir."],
              ["Relances automatiques", "Un rappel par email la veille de l'échéance, puis chaque jour de retard, sans que personne ne les déclenche."],
              ["Historique complet", "Qui a fait quoi, quand, et ce qui a été commenté. Utile pour améliorer le parcours type."],
            ].map(([title, body]) => (
              <div key={title} className="bg-paper p-6">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
                  {title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-70">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= COMPARAISON ======================== */}
      <section id="comparaison" className="border-b-[3px] border-ink scroll-mt-4">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Comparaison</Kicker>
          <SectionTitle>
            Ce qu&apos;un document partagé ne fera jamais.
          </SectionTitle>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b-[3px] border-ink">
                  <th className="pb-3 pr-6 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-70">
                    Besoin
                  </th>
                  <th className="pb-3 pr-6 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ink-70">
                    Tableur ou Notion
                  </th>
                  <th className="bg-offset px-4 pb-3 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-paper">
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
                  <tr key={need} className="border-b border-ink-15">
                    <td className="py-4 pr-6 text-[14px] font-semibold text-ink">
                      {need}
                    </td>
                    <td className="py-4 pr-6 text-[13px] text-ink-45">
                      {before}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-ink">
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
      <section id="tarifs" className="border-b-[3px] border-ink scroll-mt-4">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Tarifs</Kicker>
          <SectionTitle>Au nombre de personnes qui suivent, pas qui sont suivies.</SectionTitle>

          <div className="mt-12 grid gap-px border border-ink bg-ink lg:grid-cols-3">
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
                className={`flex flex-col p-7 ${
                  plan.highlight ? "bg-offset text-paper" : "bg-paper text-ink"
                }`}
              >
                <p
                  className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${
                    plan.highlight ? "text-paper/70" : "text-ink-70"
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
                    plan.highlight ? "text-paper/70" : "text-ink-70"
                  }`}
                >
                  {plan.detail}
                </p>

                <ul
                  className={`mt-7 flex-1 space-y-2.5 border-t pt-6 text-[13px] ${
                    plan.highlight ? "border-paper/25" : "border-ink-15"
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
                  className={`mt-8 inline-flex h-11 items-center justify-center px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] no-underline transition-colors duration-[120ms] ${
                    plan.highlight
                      ? "bg-paper text-offset hover:bg-signal hover:text-ink"
                      : "bg-ink text-paper hover:bg-offset"
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
      <section id="questions" className="border-b-[3px] border-ink scroll-mt-4">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 sm:py-20">
          <Kicker>Questions</Kicker>
          <SectionTitle>Ce qu&apos;on nous demande le plus.</SectionTitle>

          <dl className="mt-12 max-w-[76ch]">
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
              <div key={question} className="border-t border-ink py-7">
                <dt className="text-[15px] font-semibold text-ink">
                  {question}
                </dt>
                <dd className="mt-3 text-[13px] leading-relaxed text-ink-70">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ========================= CTA FINAL ========================== */}
      <section className="bg-offset text-paper">
        <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 sm:py-24">
          <div className="max-w-[26ch]">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper/70">
              Prêt à essayer
            </p>
            <p className="mt-5 font-serif text-[40px] leading-[1.02] tracking-[-0.02em] sm:text-[56px]">
              La prochaine arrivée est déjà dans deux semaines.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center bg-paper px-6 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-offset no-underline transition-colors duration-[120ms] hover:bg-signal hover:text-ink"
            >
              Voir la démonstration
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center border border-paper px-6 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-paper no-underline transition-colors duration-[120ms] hover:bg-paper hover:text-offset"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
