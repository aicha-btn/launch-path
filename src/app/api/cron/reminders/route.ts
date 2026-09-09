import { timingSafeEqual } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { formatShort, lateDays, today } from "@/lib/dates";
import { db } from "@/server/db";
import { authUsers } from "@/server/db/auth-users";
import { journeys, notificationLogs, tasks } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { taskDueSoonEmail, taskOverdueEmail } from "@/server/email/templates";
import { getOrigin } from "@/server/origin";

/**
 * Rappels quotidiens — endpoint machine.
 *
 * DEUX PARTICULARITÉS À SAVOIR EXPLIQUER
 *
 * 1. C'est le SEUL endroit du projet qui n'est pas filtré par organisation.
 *    C'est volontaire et nécessaire : le cron travaille pour tous les
 *    clients à la fois, il n'a pas d'utilisateur connecté. En contrepartie,
 *    il n'expose aucune donnée — il ne renvoie que des compteurs.
 *
 * 2. Il doit pouvoir tourner deux fois sans conséquence. Un cron finit
 *    toujours par être rejoué : redéploiement, reprise après incident, clic
 *    manuel. L'idempotence vient de la contrainte d'unicité
 *    `(task_id, kind, sent_on)` sur `notification_logs`, arbitrée par la
 *    base et non par le code.
 *
 * Déclenchement local : `pnpm reminders`
 */

/** Fuseau métier, comme partout ailleurs — décision n° 2. */
const TODAY = sql`(now() at time zone 'Europe/Paris')::date`;

/**
 * Comparaison du secret à durée constante.
 *
 * Un `!==` sur des chaînes s'arrête au premier caractère différent, ce qui
 * laisse fuir la longueur du préfixe correct. Sur HTTP, la gigue réseau
 * couvre largement cet écart — ce n'est donc pas une faille pratique. Mais la
 * version constante coûte six lignes, et c'est le genre de détail qu'un
 * relecteur cherche.
 */
function secretValide(recu: string | null): boolean {
  const attendu = process.env.CRON_SECRET;
  if (!attendu || !recu) return false;

  const a = Buffer.from(recu);
  const b = Buffer.from(attendu);

  // `timingSafeEqual` exige des longueurs égales : on compare d'abord, ce qui
  // ne révèle que la longueur — information sans valeur pour un attaquant.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

type Candidate = {
  taskId: string;
  title: string;
  dueDate: string;
  email: string | null;
  journeyId: string;
  subjectName: string;
};

async function findCandidates(kind: "due_soon" | "overdue"): Promise<Candidate[]> {
  return db
    .select({
      taskId: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      email: authUsers.email,
      journeyId: journeys.id,
      subjectName: journeys.subjectName,
    })
    .from(tasks)
    .innerJoin(journeys, eq(journeys.id, tasks.journeyId))
    // `innerJoin` sur l'utilisateur : une tâche sans responsable ne peut
    // recevoir aucun rappel, elle est donc écartée par la jointure.
    .innerJoin(authUsers, eq(authUsers.id, tasks.assigneeId))
    .where(
      and(
        eq(journeys.status, "active"),
        eq(tasks.status, "todo"),
        kind === "due_soon"
          ? /**
             * Exactement demain : ni aujourd'hui, ni après-demain.
             *
             * `date + 1` et non `date + interval '1 day'` : l'intervalle
             * produit un `timestamp`, et l'égalité ne tient que parce qu'il
             * tombe à minuit. L'arithmétique entière reste une `date`, donc
             * la comparaison est exacte par construction.
             */
            eq(tasks.dueDate, sql`${TODAY} + 1`)
          : lt(tasks.dueDate, TODAY),
      ),
    );
}

export async function GET(request: NextRequest) {
  // Endpoint machine : un secret partagé, comparé en amont de tout accès
  // à la base.
  if (!secretValide(request.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }

  const origin = await getOrigin();
  const sentOn = today();

  const summary = { dueSoon: 0, overdue: 0, sent: 0, skipped: 0 };

  for (const kind of ["due_soon", "overdue"] as const) {
    const candidates = await findCandidates(kind);

    if (kind === "due_soon") summary.dueSoon = candidates.length;
    else summary.overdue = candidates.length;

    for (const candidate of candidates) {
      if (!candidate.email) {
        summary.skipped += 1;
        continue;
      }

      /**
       * L'écriture du journal précède l'envoi, et c'est l'insertion qui
       * décide : si la contrainte d'unicité rejette la ligne, aucune ligne
       * ne revient et on passe. Deux exécutions concurrentes ne peuvent donc
       * pas envoyer deux fois — la base tranche, pas le code.
       *
       * Conséquence assumée : si l'envoi échoue après la journalisation, le
       * rappel du jour est perdu. C'est le bon compromis — mieux vaut un
       * rappel manquant qu'une boîte inondée.
       */
      const logged = await db
        .insert(notificationLogs)
        .values({ taskId: candidate.taskId, kind, sentOn })
        .onConflictDoNothing()
        .returning({ id: notificationLogs.id });

      if (logged.length === 0) {
        summary.skipped += 1;
        continue;
      }

      const url = `${origin}/journeys/${candidate.journeyId}?task=${candidate.taskId}`;

      await sendEmail(
        kind === "due_soon"
          ? taskDueSoonEmail({
              to: candidate.email,
              subjectName: candidate.subjectName,
              taskTitle: candidate.title,
              dueDate: formatShort(candidate.dueDate),
              url,
            })
          : taskOverdueEmail({
              to: candidate.email,
              subjectName: candidate.subjectName,
              taskTitle: candidate.title,
              dueDate: formatShort(candidate.dueDate),
              lateDays: lateDays(candidate.dueDate),
              url,
            }),
      );

      summary.sent += 1;
    }
  }

  return NextResponse.json({ ranOn: sentOn, ...summary });
}
