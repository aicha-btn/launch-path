import type { EmailMessage } from "./send";

/**
 * Modèles d'email.
 *
 * Écrits en HTML inline volontairement : les clients de messagerie ne
 * comprennent ni les variables CSS ni Tailwind. Les valeurs du design system
 * sont donc recopiées en dur ici — c'est le seul endroit du projet où c'est
 * autorisé.
 *
 * DEUX CONTEXTES, DEUX RÈGLES — et les confondre crée des bugs des deux côtés :
 *
 *   `html` → tout ce qui vient d'une saisie utilisateur passe par `esc()`.
 *   `text` → aucune échappement, sinon « Marie d'Anjou » devient
 *            « Marie d&#39;Anjou » dans le message en clair.
 *
 * D'où la convention : chaque modèle construit son titre en clair
 * (`titre`), et l'échappe uniquement au moment de l'injecter dans le HTML.
 */

/**
 * ÉCHAPPEMENT HTML — indispensable, et longtemps absent.
 *
 * Les titres d'étapes, les noms de personnes et les noms d'organisation sont
 * des saisies utilisateur, et ils étaient interpolés BRUTS dans le HTML.
 *
 * Le risque n'est pas tant l'exécution de script — les clients de messagerie
 * la bloquent — que l'HAMEÇONNAGE : un membre pouvait glisser
 * `<a href="https://evil.example">Réinitialisez votre mot de passe</a>` dans un
 * titre d'étape, et LaunchPath l'envoyait à ses collègues depuis son adresse
 * légitime. Plus la mise en page cassée au passage.
 *
 * React échappe automatiquement dans l'interface ; ces gabarits sont des
 * chaînes, donc rien ne le fait à notre place.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Nettoyage des valeurs qui partent dans un EN-TÊTE (l'objet du message).
 *
 * Un retour à la ligne dans un en-tête permet d'en injecter d'autres. La
 * bibliothèque d'envoi encode déjà les en-têtes, mais on ne s'appuie pas sur
 * une protection qu'on ne contrôle pas.
 */
function header(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

const PAPER = "#f8f7f4";
const INK = "#111110";
const INK_70 = "#4e4d4a";
const OFFSET = "#2242d8";

/**
 * @param titre en clair — échappé ici, une seule fois.
 * @param corps HTML déjà construit et déjà échappé par l'appelant.
 */
function layout(opts: {
  kicker: string;
  titre: string;
  corps: string;
  cta?: { label: string; url: string };
  footer: string;
}): string {
  const url = opts.cta ? esc(opts.cta.url) : "";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:32px 16px;background:${PAPER};font-family:Helvetica,Arial,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="border-top:3px solid ${INK};padding-top:4px;">
      <div style="border-top:1px solid ${INK};padding-top:20px;">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${INK_70};">
          ${esc(opts.kicker)}
        </p>
        <h1 style="margin:14px 0 0;font-size:28px;line-height:1.15;font-weight:normal;letter-spacing:-.02em;">
          ${esc(opts.titre)}
        </h1>
        <div style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${INK_70};">
          ${opts.corps}
        </div>
        ${
          opts.cta
            ? `<p style="margin:28px 0 0;">
                 <a href="${url}"
                    style="display:inline-block;background:${OFFSET};color:${PAPER};text-decoration:none;
                           padding:12px 22px;font-family:'Courier New',monospace;font-size:11px;
                           letter-spacing:.08em;text-transform:uppercase;">${esc(opts.cta.label)}</a>
               </p>
               <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${INK_70};word-break:break-all;">
                 Ou copiez ce lien : ${url}
               </p>`
            : ""
        }
        <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #d3d2ce;
                  font-family:'Courier New',monospace;font-size:10px;letter-spacing:.08em;
                  text-transform:uppercase;color:#8b8a86;">
          ${esc(opts.footer)}
        </p>
      </div>
    </td></tr>
  </table>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Notifications de tâches                                             */
/* ------------------------------------------------------------------ */

type TaskEmailOptions = {
  to: string;
  subjectName: string;
  taskTitle: string;
  dueDate: string;
  url: string;
};

export function taskAssignedEmail(opts: TaskEmailOptions): EmailMessage {
  const titre = `Une étape vous est assignée pour ${opts.subjectName}.`;

  return {
    to: opts.to,
    subject: header(`Onboarding ${opts.subjectName} — ${opts.taskTitle}`),
    html: layout({
      kicker: "Étape assignée · LaunchPath",
      titre,
      corps: `<p style="margin:0;"><strong>${esc(opts.taskTitle)}</strong></p>
             <p style="margin:12px 0 0;">À traiter avant le <strong>${esc(opts.dueDate)}</strong>.</p>`,
      cta: { label: "Voir l'onboarding", url: opts.url },
      footer: "Vous recevez cet email parce que cette étape vous est assignée.",
    }),
    text: `${titre}

${opts.taskTitle}
À traiter avant le ${opts.dueDate}.

${opts.url}`,
  };
}

export function taskDueSoonEmail(opts: TaskEmailOptions): EmailMessage {
  const titre = `Échéance demain : ${opts.taskTitle}`;

  return {
    to: opts.to,
    subject: header(`Demain — ${opts.taskTitle} (${opts.subjectName})`),
    html: layout({
      kicker: "Rappel · Échéance demain",
      titre,
      corps: `<p style="margin:0;">Cette étape de l'onboarding de <strong>${esc(opts.subjectName)}</strong>
             arrive à échéance le <strong>${esc(opts.dueDate)}</strong>.</p>`,
      cta: { label: "Voir l'étape", url: opts.url },
      footer: "Un seul rappel est envoyé la veille de l'échéance.",
    }),
    text: `${titre}

Onboarding de ${opts.subjectName}, échéance le ${opts.dueDate}.

${opts.url}`,
  };
}

export function taskOverdueEmail(
  opts: TaskEmailOptions & { lateDays: number },
): EmailMessage {
  const jours = `${opts.lateDays} jour${opts.lateDays > 1 ? "s" : ""}`;
  const titre = `En retard de ${jours} : ${opts.taskTitle}`;

  return {
    to: opts.to,
    subject: header(`Retard — ${opts.taskTitle} (${opts.subjectName})`),
    html: layout({
      kicker: "Retard · LaunchPath",
      titre,
      corps: `<p style="margin:0;">Cette étape de l'onboarding de <strong>${esc(opts.subjectName)}</strong>
             était attendue le <strong>${esc(opts.dueDate)}</strong>.</p>
             <p style="margin:12px 0 0;">Si elle n'est plus nécessaire, marquez-la comme ignorée
             pour arrêter les rappels.</p>`,
      cta: { label: "Traiter l'étape", url: opts.url },
      footer:
        "Ce rappel est renvoyé chaque jour tant que l'étape n'est pas traitée.",
    }),
    text: `${titre}

Onboarding de ${opts.subjectName}, échéance dépassée depuis le ${opts.dueDate}.
Si l'étape n'est plus nécessaire, marquez-la comme ignorée.

${opts.url}`,
  };
}

export function invitationEmail(opts: {
  to: string;
  organizationName: string;
  inviterEmail: string;
  url: string;
}): EmailMessage {
  const titre = `Vous êtes invité·e à rejoindre ${opts.organizationName}.`;

  return {
    to: opts.to,
    subject: header(
      `Invitation à rejoindre ${opts.organizationName} sur LaunchPath`,
    ),
    html: layout({
      kicker: "Invitation · LaunchPath",
      titre,
      corps: `<p style="margin:0;">${esc(opts.inviterEmail)} vous invite à rejoindre son organisation sur LaunchPath,
             l'outil de suivi des parcours d'intégration.</p>
             <p style="margin:12px 0 0;">Vous pourrez voir les intégrations en cours et traiter les étapes
             qui vous sont assignées.</p>`,
      cta: { label: "Accepter l'invitation", url: opts.url },
      footer: "Ce lien est valable sept jours et ne fonctionne qu'une fois.",
    }),
    text: `${titre}

${opts.inviterEmail} vous invite à rejoindre son organisation sur LaunchPath.

Accepter l'invitation : ${opts.url}

Ce lien est valable sept jours et ne fonctionne qu'une fois.`,
  };
}
