import nodemailer from "nodemailer";

/**
 * LA couche d'envoi. Aucun autre fichier du projet ne connaît le transport.
 *
 * En local, tout part vers le serveur SMTP de la boîte mail de développement
 * (Mailpit, exposé sur 54325 — voir la correction 1 de config.toml). Aucun
 * email ne quitte la machine.
 *
 * À la phase 12, on remplace UNIQUEMENT le corps de cette fonction par
 * l'appel Resend. Aucun appelant ne change.
 */

const SMTP_HOST = "127.0.0.1";
const SMTP_PORT = 54325;

const FROM = "LaunchPath <notifications@launchpath.test>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    // Mailpit n'exige aucune authentification.
    tls: { rejectUnauthorized: false },
  });
  return transporter;
}

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  } catch (error) {
    /**
     * Un envoi qui échoue ne doit JAMAIS faire échouer l'action métier :
     * une invitation créée en base reste valide même si l'email n'est pas
     * parti, et le lien peut être copié à la main. On journalise et on
     * continue.
     */
    console.error("[email] envoi impossible", {
      to: message.to,
      subject: message.subject,
      error,
    });
  }
}
