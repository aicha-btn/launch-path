/**
 * Déclenchement manuel des rappels quotidiens.
 *
 * En production, ce sera Vercel Cron qui appellera la route. En local, ce
 * script fait le même appel — avec le secret chargé par Node lui-même
 * (`--env-file`), et non par un `curl` dans un script npm : ni npm ni pnpm
 * ne lisent les fichiers `.env`, la variable serait vide et la route
 * répondrait 401.
 *
 * Usage : pnpm reminders
 */

const PORT = process.env.PORT ?? "3200";
const URL_CRON = `http://localhost:${PORT}/api/cron/reminders`;

if (!process.env.CRON_SECRET) {
  console.error("\n  CRON_SECRET absent de .env.local.\n");
  process.exit(1);
}

const response = await fetch(URL_CRON, {
  headers: { "x-cron-secret": process.env.CRON_SECRET },
});

const body = await response.text();

if (!response.ok) {
  console.error(`\n  ${response.status} — ${body}\n`);
  process.exit(1);
}

const summary = JSON.parse(body);

console.log(`
  Rappels du ${summary.ranOn}

  Dues demain      ${summary.dueSoon}
  En retard        ${summary.overdue}
  Emails envoyés   ${summary.sent}
  Déjà notifiés    ${summary.skipped}

  Boîte locale : http://localhost:54324
`);
