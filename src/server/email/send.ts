import nodemailer from "nodemailer";

/**
 * LA couche d'envoi. Aucun autre fichier du projet ne connaît le transport.
 *
 * En local, sans `RESEND_API_KEY`, tout part vers le serveur SMTP de la boîte
 * mail de développement (Mailpit, exposé sur 54325 — voir la correction 1 de
 * config.toml). En production, `RESEND_API_KEY` active l'envoi Resend.
 */

const SMTP_HOST = "127.0.0.1";
const SMTP_PORT = 54325;
const RESEND_API_URL = "https://api.resend.com/emails";

const LOCAL_FROM = "LaunchPath <notifications@launchpath.test>";
const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || "LaunchPath <onboarding@resend.dev>";

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

async function sendWithResend(message: EmailMessage, apiKey: string) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend a refusé l'email (${response.status})`);
  }
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();

    if (resendApiKey) {
      await sendWithResend(message, resendApiKey);
    } else {
      await getTransporter().sendMail({
        from: LOCAL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    }
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
