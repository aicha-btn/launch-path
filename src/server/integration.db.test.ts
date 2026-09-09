import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import {
  activityEvents,
  comments,
  invitations,
  journeys,
  memberships,
  notificationLogs,
  tasks,
  templateSteps,
  templates,
} from "@/server/db/schema";
import {
  createTestOrg,
  createTestTemplate,
  createTestUser,
  cleanupTestUsers,
  destroyTestOrg,
  type TestOrg,
} from "@/test/fixtures";
import { LABEL } from "@/components/journeys/activity-timeline";
import type { CurrentMembership } from "@/server/auth/session";
import type { EmailMessage } from "@/server/email/send";

/* ==========================================================================
   Tests d'intégration — la vraie base, le vrai code des Server Actions.

   Ce qui est simulé, et pourquoi :
     - la SESSION, pour pouvoir jouer tour à tour deux organisations ;
     - `next/cache` et `next/navigation`, qui exigent un contexte de requête
       HTTP absent hors du serveur ;
     - l'ENVOI d'email, remplacé par une boîte en mémoire — ce qui permet
       en plus d'affirmer combien d'emails partent et à qui.

   Ce qui n'est PAS simulé : la base, les transactions, les contraintes, les
   cascades, le calcul des échéances. C'est tout l'intérêt.
   ========================================================================== */

/**
 * Session courante, réécrite par chaque test.
 *
 * L'utilisateur et le membership sont DEUX choses distinctes : on doit
 * pouvoir simuler « connecté mais sans organisation », qui est l'état d'une
 * personne arrivant par un lien d'invitation. Les confondre rendrait le test
 * d'invitation faux — il passerait sans rien vérifier.
 */
let currentUser: { id: string; email: string };
let currentMembership: CurrentMembership | null;

function as(membership: CurrentMembership) {
  currentUser = { id: membership.userId, email: membership.email };
  currentMembership = membership;
}

function asUserWithoutOrg(user: { id: string; email: string }) {
  currentUser = user;
  currentMembership = null;
}

vi.mock("@/server/auth/session", () => ({
  getCurrentUser: async () => currentUser,
  getCurrentMembership: async () => currentMembership,
  requireMembership: async () => {
    if (!currentMembership) throw new Error("aucune organisation");
    return currentMembership;
  },
  requireAdmin: async () => {
    if (!currentMembership) throw new Error("aucune organisation");
    if (currentMembership.role !== "admin") {
      throw new Error("Cette action est réservée aux administrateurs.");
    }
    return currentMembership;
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

/** `redirect()` interrompt l'exécution : on reproduit ce comportement. */
class RedirectSignal extends Error {
  constructor(public target: string) {
    super(`redirect:${target}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new RedirectSignal(target);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));

vi.mock("@/server/origin", () => ({
  getOrigin: async () => "http://localhost:3200",
}));

const outbox: EmailMessage[] = [];

vi.mock("@/server/email/send", () => ({
  sendEmail: async (message: EmailMessage) => {
    outbox.push(message);
  },
}));

/** Récupère la cible d'une redirection attendue. */
async function captureRedirect(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target;
    throw error;
  }
  throw new Error("aucune redirection alors qu'une était attendue");
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

/* ------------------------------------------------------------------ */

const { launchJourney, setTaskStatus, updateTask, cancelJourney } = await import(
  "@/server/actions/journeys"
);
const { addComment } = await import("@/server/actions/comments");
const { inviteMember, removeMember } = await import("@/server/actions/members");
const { acceptInvitation } = await import("@/server/actions/invitations");

let orgA: TestOrg;
let orgB: TestOrg;

beforeAll(async () => {
  orgA = await createTestOrg("OrgA");
  orgB = await createTestOrg("OrgB");
});

afterAll(async () => {
  await destroyTestOrg(orgA);
  await destroyTestOrg(orgB);
  // Sans ça, `auth.users` accumule les comptes de test à chaque exécution.
  await cleanupTestUsers();
});

/* ================================================================== */

describe("launchJourney", () => {
  it("copie les étapes en tâches avec les échéances calculées", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);

    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne A",
          startDate: "2026-03-16", // un lundi
          ownerId: orgA.admin.userId,
        }),
      ),
    );

    const journeyId = target.replace("/journeys/", "");
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .orderBy(tasks.position);

    expect(rows).toHaveLength(3);
    // Offsets -2, 0, 5 depuis lundi 16 mars, en jours OUVRÉS.
    expect(rows.map((r) => r.dueDate)).toEqual([
      "2026-03-12", // -2 ouvrés → jeudi 12
      "2026-03-16", // 0 → le jour même
      "2026-03-23", // +5 ouvrés → lundi 23
    ]);
  });

  it("snapshote le nom du parcours type", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);

    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne B",
          startDate: "2026-03-16",
          ownerId: orgA.admin.userId,
        }),
      ),
    );

    const journeyId = target.replace("/journeys/", "");
    const [journey] = await db
      .select({ templateName: journeys.templateName })
      .from(journeys)
      .where(eq(journeys.id, journeyId));

    expect(journey.templateName).toBe(template.name);
  });

  it("écrit un événement journey_launched", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);

    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne C",
          startDate: "2026-03-16",
          ownerId: orgA.admin.userId,
        }),
      ),
    );

    const journeyId = target.replace("/journeys/", "");
    const events = await db
      .select({ type: activityEvents.type })
      .from(activityEvents)
      .where(eq(activityEvents.journeyId, journeyId));

    expect(events).toEqual([{ type: "journey_launched" }]);
  });

  it("refuse un parcours type archivé", async () => {
    as(orgA.admin);
    const archived = await createTestTemplate(orgA, { archived: true });

    const result = await launchJourney(
      null,
      form({
        templateId: archived.id,
        subjectName: "Refusée",
        startDate: "2026-03-16",
        ownerId: orgA.admin.userId,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("refuse un parcours type sans étape", async () => {
    as(orgA.admin);
    const empty = await createTestTemplate(orgA, { steps: 0 });

    const result = await launchJourney(
      null,
      form({
        templateId: empty.id,
        subjectName: "Refusée",
        startDate: "2026-03-16",
        ownerId: orgA.admin.userId,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("REFUSE le parcours type d'une autre organisation", async () => {
    // LE test de permission le plus important du projet.
    const foreign = await createTestTemplate(orgB);
    as(orgA.admin);

    const result = await launchJourney(
      null,
      form({
        templateId: foreign.id,
        subjectName: "Tentative",
        startDate: "2026-03-16",
        ownerId: orgA.admin.userId,
      }),
    );

    expect(result.ok).toBe(false);

    // Et rien n'a été créé côté A.
    const created = await db
      .select({ id: journeys.id })
      .from(journeys)
      .where(
        and(
          eq(journeys.organizationId, orgA.id),
          eq(journeys.subjectName, "Tentative"),
        ),
      );
    expect(created).toHaveLength(0);
  });

  it("n'envoie qu'un seul email par personne, pas un par tâche", async () => {
    outbox.length = 0;
    as(orgA.admin);

    // Le gabarit assigne DEUX étapes au même membre.
    const template = await createTestTemplate(orgA);

    await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne D",
          startDate: "2026-03-16",
          ownerId: orgA.admin.userId,
        }),
      ),
    );

    const toMember = outbox.filter((m) => m.to === orgA.member.email);

    // Deux tâches assignées, un seul email : recevoir huit emails d'un coup
    // ferait désinstaller le produit.
    expect(toMember).toHaveLength(1);
    // Et il annonce bien qu'il y a plus d'une étape.
    expect(toMember[0].subject).toContain("Personne D");
    expect(toMember[0].html).toContain("+1 autre");
  });
});

/* ================================================================== */

describe("isolation entre organisations", () => {
  it("setTaskStatus ne touche pas la tâche d'une autre organisation", async () => {
    as(orgB.admin);
    const template = await createTestTemplate(orgB);
    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Chez B",
          startDate: "2026-03-16",
          ownerId: orgB.admin.userId,
        }),
      ),
    );
    const journeyId = target.replace("/journeys/", "");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    // A tente de cocher une tâche de B.
    as(orgA.admin);
    await setTaskStatus(form({ taskId: task.id, status: "done" }));

    const [after] = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.id, task.id));

    expect(after.status).toBe("todo");
  });

  it("addComment refuse la tâche d'une autre organisation", async () => {
    as(orgB.admin);
    const template = await createTestTemplate(orgB);
    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Chez B bis",
          startDate: "2026-03-16",
          ownerId: orgB.admin.userId,
        }),
      ),
    );
    const journeyId = target.replace("/journeys/", "");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    as(orgA.admin);
    const result = await addComment(
      null,
      form({ taskId: task.id, body: "Intrusion" }),
    );

    expect(result.ok).toBe(false);

    const written = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.taskId, task.id));
    expect(written).toHaveLength(0);
  });

  it("updateTask refuse un responsable extérieur à l'organisation", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);
    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne E",
          startDate: "2026-03-16",
          ownerId: orgA.admin.userId,
        }),
      ),
    );
    const journeyId = target.replace("/journeys/", "");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    // Un utilisateur bien réel, mais membre de l'autre organisation.
    const result = await updateTask(
      null,
      form({
        taskId: task.id,
        assigneeId: orgB.member.userId,
        dueDate: "2026-03-20",
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("cancelJourney ne touche pas le parcours d'une autre organisation", async () => {
    as(orgB.admin);
    const template = await createTestTemplate(orgB);
    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Chez B ter",
          startDate: "2026-03-16",
          ownerId: orgB.admin.userId,
        }),
      ),
    );
    const journeyId = target.replace("/journeys/", "");

    as(orgA.admin);
    await cancelJourney(form({ journeyId }));

    const [after] = await db
      .select({ status: journeys.status })
      .from(journeys)
      .where(eq(journeys.id, journeyId));

    expect(after.status).toBe("active");
  });
});

/* ================================================================== */

describe("statut du parcours, dans les deux sens", () => {
  it("passe en completed puis revient en active", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);
    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne F",
          startDate: "2026-03-16",
          ownerId: orgA.admin.userId,
        }),
      ),
    );
    const journeyId = target.replace("/journeys/", "");
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId));

    for (const task of rows) {
      await setTaskStatus(form({ taskId: task.id, status: "done" }));
    }

    let [journey] = await db
      .select({ status: journeys.status, completedAt: journeys.completedAt })
      .from(journeys)
      .where(eq(journeys.id, journeyId));

    expect(journey.status).toBe("completed");
    expect(journey.completedAt).not.toBeNull();

    // La partie que la plupart des implémentations oublient.
    await setTaskStatus(form({ taskId: rows[0].id, status: "todo" }));

    [journey] = await db
      .select({ status: journeys.status, completedAt: journeys.completedAt })
      .from(journeys)
      .where(eq(journeys.id, journeyId));

    expect(journey.status).toBe("active");
    expect(journey.completedAt).toBeNull();
  });
});

/* ================================================================== */

describe("membres et invitations", () => {
  it("un membre simple ne peut pas inviter", async () => {
    as(orgA.member);
    await expect(
      inviteMember(null, form({ email: "quelquun@test.local", role: "member" })),
    ).rejects.toThrow(/administrateurs/);
  });

  it("accepte une invitation valide", async () => {
    const token = `token-valide-${Date.now().toString(36)}`;

    as(orgA.admin);
    await db.insert(invitations).values({
      organizationId: orgA.id,
      email: "nouvelle@test.local",
      role: "member",
      token,
      invitedBy: orgA.admin.userId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    // Connecté, mais sans organisation : l'état réel d'une personne invitée.
    const newcomer = await createTestUser("invite");
    asUserWithoutOrg(newcomer);

    const target = await captureRedirect(() =>
      acceptInvitation(form({ token })),
    );

    expect(target).toBe("/dashboard");

    const created = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, orgA.id),
          eq(memberships.userId, newcomer.id),
        ),
      );

    expect(created).toEqual([{ role: "member" }]);

    // L'invitation est marquée acceptée : elle ne peut plus resservir.
    const [used] = await db
      .select({ acceptedAt: invitations.acceptedAt })
      .from(invitations)
      .where(eq(invitations.token, token));
    expect(used.acceptedAt).not.toBeNull();
  });

  it("REFUSE une invitation expirée", async () => {
    const token = `token-expire-${Date.now().toString(36)}`;

    as(orgA.admin);
    await db.insert(invitations).values({
      organizationId: orgA.id,
      email: "expiree@test.local",
      role: "member",
      token,
      invitedBy: orgA.admin.userId,
      expiresAt: new Date(Date.now() - 86_400_000), // hier
    });

    const newcomer = await createTestUser("expire");
    asUserWithoutOrg(newcomer);

    const target = await captureRedirect(() =>
      acceptInvitation(form({ token })),
    );

    // Renvoyé vers la page d'invitation, qui expliquera l'expiration —
    // et surtout PAS vers le dashboard.
    expect(target).toBe(`/invitations/${token}`);

    const created = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.userId, newcomer.id));

    expect(created).toHaveLength(0);
  });

  it("retirer un membre désassigne ses tâches", async () => {
    /**
     * Organisation JETABLE, et c'est indispensable.
     *
     * Ce test est DESTRUCTIF : il retire un membre. Le faire sur `orgA`,
     * partagée par tout le fichier, cassait deux tests plus loin — les tâches
     * n'étaient plus assignées à personne, et une réassignation vers cet
     * ancien membre était refusée à juste titre. Les tests dépendaient donc de
     * leur ordre d'exécution, ce que la grille de relecture interdit.
     */
    const jetable = await createTestOrg("OrgJetable");

    try {
      as(jetable.admin);
      const template = await createTestTemplate(jetable);
      const target = await captureRedirect(() =>
        launchJourney(
          null,
          form({
            templateId: template.id,
            subjectName: "Personne G",
            startDate: "2026-03-16",
            ownerId: jetable.admin.userId,
          }),
        ),
      );
      const journeyId = target.replace("/journeys/", "");

      const assigned = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.journeyId, journeyId),
            eq(tasks.assigneeId, jetable.member.userId),
          ),
        );
      expect(assigned.length).toBeGreaterThan(0);

      const result = await removeMember(
        null,
        form({ userId: jetable.member.userId }),
      );
      expect(result.ok).toBe(true);

      const stillAssigned = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.assigneeId, jetable.member.userId));

      expect(stillAssigned).toHaveLength(0);
    } finally {
      await destroyTestOrg(jetable);
    }
  });

  it("refuse de retirer le dernier administrateur", async () => {
    as(orgB.admin);
    const result = await removeMember(
      null,
      form({ userId: orgB.admin.userId }),
    );
    expect(result.ok).toBe(false);
  });
});

/* ================================================================== */

describe("idempotence des notifications", () => {
  it("la contrainte d'unicité empêche un second envoi le même jour", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);
    const target = await captureRedirect(() =>
      launchJourney(
        null,
        form({
          templateId: template.id,
          subjectName: "Personne H",
          startDate: "2026-03-16",
          ownerId: orgA.admin.userId,
        }),
      ),
    );
    const journeyId = target.replace("/journeys/", "");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    const sentOn = "2026-03-16";

    const first = await db
      .insert(notificationLogs)
      .values({ taskId: task.id, kind: "overdue", sentOn })
      .onConflictDoNothing()
      .returning({ id: notificationLogs.id });

    const second = await db
      .insert(notificationLogs)
      .values({ taskId: task.id, kind: "overdue", sentOn })
      .onConflictDoNothing()
      .returning({ id: notificationLogs.id });

    expect(first).toHaveLength(1);
    // C'est la BASE qui arbitre, pas le code : deux appels concurrents ne
    // peuvent donc pas envoyer deux fois.
    expect(second).toHaveLength(0);
  });
});

/* ================================================================== */

const { addStep, deleteStep, moveStep, toggleArchive } =
  await import("@/server/actions/templates");

/** Positions actuelles, dans l'ordre, pour vérifier la contiguïté. */
async function positions(templateId: string): Promise<number[]> {
  const rows = await db
    .select({ position: templateSteps.position })
    .from(templateSteps)
    .where(eq(templateSteps.templateId, templateId))
    .orderBy(templateSteps.position);
  return rows.map((r) => r.position);
}

async function titlesInOrder(templateId: string): Promise<string[]> {
  const rows = await db
    .select({ title: templateSteps.title, position: templateSteps.position })
    .from(templateSteps)
    .where(eq(templateSteps.templateId, templateId))
    .orderBy(templateSteps.position);
  return rows.map((r) => r.title);
}

describe("éditeur d'étapes — les positions restent 1..N", () => {
  it("addStep ajoute à la fin", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 3 });

    const result = await addStep(
      null,
      form({ templateId: template.id, title: "Quatrième", offsetDays: "7" }),
    );

    expect(result.ok).toBe(true);
    expect(await positions(template.id)).toEqual([1, 2, 3, 4]);
    expect((await titlesInOrder(template.id)).at(-1)).toBe("Quatrième");
  });

  it("moveStep échange deux voisines sans casser la suite", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 3 });
    const avant = await titlesInOrder(template.id);

    const [premiere] = await db
      .select({ id: templateSteps.id })
      .from(templateSteps)
      .where(eq(templateSteps.templateId, template.id))
      .orderBy(templateSteps.position);

    await moveStep(
      form({ templateId: template.id, stepId: premiere.id, direction: "down" }),
    );

    expect(await positions(template.id)).toEqual([1, 2, 3]);
    expect(await titlesInOrder(template.id)).toEqual([
      avant[1],
      avant[0],
      avant[2],
    ]);
  });

  it("monter la première étape ne fait rien, sans erreur", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 3 });
    const avant = await titlesInOrder(template.id);

    const [premiere] = await db
      .select({ id: templateSteps.id })
      .from(templateSteps)
      .where(eq(templateSteps.templateId, template.id))
      .orderBy(templateSteps.position);

    await moveStep(
      form({ templateId: template.id, stepId: premiere.id, direction: "up" }),
    );

    expect(await titlesInOrder(template.id)).toEqual(avant);
    expect(await positions(template.id)).toEqual([1, 2, 3]);
  });

  it("deleteStep renumérote — pas de trou dans la suite", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 4 });

    const rows = await db
      .select({ id: templateSteps.id, title: templateSteps.title })
      .from(templateSteps)
      .where(eq(templateSteps.templateId, template.id))
      .orderBy(templateSteps.position);

    // On supprime celle du MILIEU : c'est là que le trou apparaîtrait.
    await deleteStep(form({ templateId: template.id, stepId: rows[1].id }));

    expect(await positions(template.id)).toEqual([1, 2, 3]);
    expect(await titlesInOrder(template.id)).toEqual([
      rows[0].title,
      rows[2].title,
      rows[3].title,
    ]);
  });

  it("ajouter après une suppression ne réutilise pas une position", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 3 });

    const rows = await db
      .select({ id: templateSteps.id })
      .from(templateSteps)
      .where(eq(templateSteps.templateId, template.id))
      .orderBy(templateSteps.position);

    await deleteStep(form({ templateId: template.id, stepId: rows[0].id }));
    await addStep(
      null,
      form({ templateId: template.id, title: "Ajoutée après", offsetDays: "0" }),
    );

    expect(await positions(template.id)).toEqual([1, 2, 3]);
  });
});

describe("éditeur d'étapes — refus", () => {
  it("REFUSE d'ajouter une étape au parcours type d'une autre organisation", async () => {
    const foreign = await createTestTemplate(orgB, { steps: 2 });
    as(orgA.admin);

    const result = await addStep(
      null,
      form({ templateId: foreign.id, title: "Intrusion", offsetDays: "0" }),
    );

    expect(result.ok).toBe(false);
    expect(await positions(foreign.id)).toEqual([1, 2]);
  });

  it("REFUSE de supprimer une étape d'une autre organisation", async () => {
    const foreign = await createTestTemplate(orgB, { steps: 2 });
    const [step] = await db
      .select({ id: templateSteps.id })
      .from(templateSteps)
      .where(eq(templateSteps.templateId, foreign.id));

    as(orgA.admin);
    await deleteStep(form({ templateId: foreign.id, stepId: step.id }));

    expect(await positions(foreign.id)).toEqual([1, 2]);
  });

  it("REFUSE d'archiver le parcours type d'une autre organisation", async () => {
    const foreign = await createTestTemplate(orgB, { steps: 2 });
    as(orgA.admin);

    await toggleArchive(form({ templateId: foreign.id, archive: "true" }));

    const [row] = await db
      .select({ isArchived: templates.isArchived })
      .from(templates)
      .where(eq(templates.id, foreign.id));
    expect(row.isArchived).toBe(false);
  });

  it("refuse un délai hors bornes", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 1 });

    expect(
      (await addStep(null, form({ templateId: template.id, title: "Trop loin", offsetDays: "9999" })))
        .ok,
    ).toBe(false);
    expect(
      (await addStep(null, form({ templateId: template.id, title: "Trop tôt", offsetDays: "-9999" })))
        .ok,
    ).toBe(false);
    expect(
      (await addStep(null, form({ templateId: template.id, title: "Pas entier", offsetDays: "2.5" })))
        .ok,
    ).toBe(false);
  });

  it("refuse un responsable extérieur à l'organisation", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA, { steps: 1 });

    const result = await addStep(
      null,
      form({
        templateId: template.id,
        title: "Assignée ailleurs",
        offsetDays: "0",
        assigneeId: orgB.member.userId,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("refuse un identifiant mal formé sans lever d'erreur Postgres", async () => {
    as(orgA.admin);

    const result = await addStep(
      null,
      form({ templateId: "j-clara", title: "Bidon", offsetDays: "0" }),
    );

    expect(result.ok).toBe(false);
  });
});

/* ================================================================== */

const { reopenJourney } = await import("@/server/actions/journeys");

/** Lance un parcours et renvoie son identifiant. */
async function lancer(org: TestOrg, nom: string, steps = 3): Promise<string> {
  as(org.admin);
  const template = await createTestTemplate(org, { steps });
  const target = await captureRedirect(() =>
    launchJourney(
      null,
      form({
        templateId: template.id,
        subjectName: nom,
        startDate: "2026-03-16",
        ownerId: org.admin.userId,
      }),
    ),
  );
  return target.replace("/journeys/", "");
}

describe("dates : le format ne suffit pas", () => {
  it("REFUSE le 31 février au lieu de lever une exception", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);

    // `/^\d{4}-\d{2}-\d{2}$/` acceptait cette date, puis `addBusinessDays`
    // levait « Date inexistante » — donc un écran d'erreur, pas un refus.
    const result = await launchJourney(
      null,
      form({
        templateId: template.id,
        subjectName: "Date impossible",
        startDate: "2026-02-31",
        ownerId: orgA.admin.userId,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("REFUSE un mois 13", async () => {
    as(orgA.admin);
    const template = await createTestTemplate(orgA);

    const result = await launchJourney(
      null,
      form({
        templateId: template.id,
        subjectName: "Mois impossible",
        startDate: "2026-13-01",
        ownerId: orgA.admin.userId,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("REFUSE une échéance inexistante sur updateTask", async () => {
    const journeyId = await lancer(orgA, "Échéance impossible");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    const result = await updateTask(
      null,
      form({ taskId: task.id, assigneeId: "", dueDate: "2026-02-30" }),
    );

    expect(result.ok).toBe(false);
  });
});

describe("setTaskStatus renvoie un résultat, pas un silence", () => {
  it("réussit et le dit", async () => {
    const journeyId = await lancer(orgA, "Retour explicite");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    const result = await setTaskStatus(form({ taskId: task.id, status: "done" }));
    expect(result.ok).toBe(true);
  });

  it("REFUSE la tâche d'une autre organisation, et le dit", async () => {
    const chezB = await lancer(orgB, "Chez B refus");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, chezB))
      .limit(1);

    as(orgA.admin);
    const result = await setTaskStatus(form({ taskId: task.id, status: "done" }));

    // Avant : `void`, donc l'interface décochait la case sans rien expliquer.
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/introuvable/i);
  });

  it("REFUSE un statut inconnu", async () => {
    const journeyId = await lancer(orgA, "Statut inconnu");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    const result = await setTaskStatus(
      form({ taskId: task.id, status: "termine-peut-etre" }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("réactivation d'un parcours annulé", () => {
  it("recalcule le statut au lieu de forcer « en cours »", async () => {
    const journeyId = await lancer(orgA, "Réactivation complète");

    // Tout traiter, puis annuler.
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId));
    for (const task of rows) {
      await setTaskStatus(form({ taskId: task.id, status: "done" }));
    }
    await cancelJourney(form({ journeyId }));

    let [journey] = await db
      .select({ status: journeys.status })
      .from(journeys)
      .where(eq(journeys.id, journeyId));
    expect(journey.status).toBe("cancelled");

    await reopenJourney(form({ journeyId }));

    [journey] = await db
      .select({ status: journeys.status })
      .from(journeys)
      .where(eq(journeys.id, journeyId));

    // Avant : « active » avec 3/3 traitées, et compté parmi les actifs.
    expect(journey.status).toBe("completed");
  });

  it("réactive en « en cours » s'il reste des tâches à faire", async () => {
    const journeyId = await lancer(orgA, "Réactivation partielle");
    await cancelJourney(form({ journeyId }));
    await reopenJourney(form({ journeyId }));

    const [journey] = await db
      .select({ status: journeys.status })
      .from(journeys)
      .where(eq(journeys.id, journeyId));

    expect(journey.status).toBe("active");
  });
});

/* ================================================================== */

describe("historique : chaque geste laisse une trace", () => {
  it("déplacer une échéance écrit task_due_date_changed", async () => {
    const journeyId = await lancer(orgA, "Trace échéance");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    const result = await updateTask(
      null,
      form({ taskId: task.id, assigneeId: "", dueDate: "2026-04-20" }),
    );
    expect(result.ok).toBe(true);

    const events = await db
      .select({ type: activityEvents.type })
      .from(activityEvents)
      .where(eq(activityEvents.journeyId, journeyId));

    // Le type existait au schéma et dans la timeline, mais rien ne l'écrivait.
    expect(events.map((e) => e.type)).toContain("task_due_date_changed");
  });

  it("n'écrit rien si l'échéance ne change pas", async () => {
    const journeyId = await lancer(orgA, "Sans changement");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    await updateTask(
      null,
      form({ taskId: task.id, assigneeId: "", dueDate: task.dueDate }),
    );

    const events = await db
      .select({ type: activityEvents.type })
      .from(activityEvents)
      .where(eq(activityEvents.journeyId, journeyId));

    expect(events.map((e) => e.type)).not.toContain("task_due_date_changed");
  });

  it("tous les types écrits en base ont un libellé dans la timeline", async () => {
    /**
     * Ce test lisait les types présents en base et vérifiait qu'ils
     * appartenaient à une liste recopiée à la main. Il ne pouvait pas échouer :
     * `type` est une colonne d'énumération, Postgres refuse déjà toute autre
     * valeur. Il passait sans rien vérifier.
     *
     * Il compare maintenant les types RÉELLEMENT écrits par le code à la carte
     * des libellés de l'interface. L'exhaustivité de la carte face à
     * l'énumération est garantie par le compilateur et vérifiée sans base dans
     * `src/components/journeys/activity-timeline.test.ts` ; ici on vérifie le
     * troisième côté du triangle — ce que les actions écrivent vraiment.
     */
    const rows = await db.selectDistinct({ type: activityEvents.type }).from(
      activityEvents,
    );

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(Object.keys(LABEL)).toContain(row.type);
    }
  });
});

/* ================================================================== */

describe("réassignation : le nouveau responsable est prévenu", () => {
  it("envoie un email au nouveau responsable", async () => {
    const journeyId = await lancer(orgA, "Réassignation");

    // Une tâche NON assignée : le gabarit attribue déjà les étapes 1 et 2 au
    // membre, et réassigner à la même personne ne doit rien envoyer. Prendre
    // la première tâche venue testait donc l'inverse de l'intention.
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.journeyId, journeyId), isNull(tasks.assigneeId)))
      .limit(1);

    expect(task).toBeDefined();
    outbox.length = 0;

    const result = await updateTask(
      null,
      form({
        taskId: task.id,
        assigneeId: orgA.member.userId,
        dueDate: task.dueDate,
      }),
    );

    expect(result.ok).toBe(true);

    // La page publique promet « chaque responsable reçoit sa tâche ». L'email
    // partait au lancement, mais réassigner ensuite ne prévenait personne.
    const pour = outbox.filter((m) => m.to === orgA.member.email);
    expect(pour).toHaveLength(1);
    expect(pour[0].html).toContain("Réassignation");
  });

  it("n'envoie rien si le responsable ne change pas", async () => {
    const journeyId = await lancer(orgA, "Sans réassignation");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.journeyId, journeyId))
      .limit(1);

    outbox.length = 0;

    await updateTask(
      null,
      form({
        taskId: task.id,
        assigneeId: task.assigneeId ?? "",
        dueDate: task.dueDate,
      }),
    );

    expect(outbox).toHaveLength(0);
  });

  it("n'envoie rien quand on désassigne", async () => {
    const journeyId = await lancer(orgA, "Désassignation");
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.journeyId, journeyId), isNotNull(tasks.assigneeId)))
      .limit(1);

    outbox.length = 0;

    await updateTask(
      null,
      form({ taskId: task.id, assigneeId: "", dueDate: task.dueDate }),
    );

    expect(outbox).toHaveLength(0);
  });
});

/* ================================================================== */

const { deleteComment } = await import("@/server/actions/comments");
const { updateStep, updateTemplate } = await import(
  "@/server/actions/templates"
);
const { cancelInvitation } = await import("@/server/actions/members");

/**
 * LES TROIS FAMILLES D'ENTRÉE, sur toute la surface d'écriture.
 *
 * La grille de relecture exige trois cas pour chaque identifiant reçu :
 *
 *   1. VALIDE       — couvert par les tests métier plus haut ;
 *   2. INEXISTANT   — un uuid bien formé qui ne désigne rien ;
 *   3. INVALIDE     — une chaîne qui n'est pas un uuid du tout.
 *
 * Le troisième cas est celui qui a réellement cassé le produit :
 * `/journeys/j-clara` levait `22P02 invalid input syntax for type uuid` au lieu
 * de renvoyer zéro ligne, et l'utilisateur restait sur un squelette infini. Le
 * correctif a été appliqué en 22 endroits ; jusqu'ici un seul était testé
 * (`addStep`). Une action qui oublierait `readId` repasserait donc inaperçue.
 *
 * Aucune de ces entrées ne doit produire d'exception : une action est un
 * endpoint HTTP public, elle reçoit ce qu'on veut bien lui envoyer.
 */
const INEXISTANT = "00000000-0000-4000-8000-000000000000";
const INVALIDE = "j-clara";

describe("identifiants inexistants et mal formés", () => {
  /** Actions à deux arguments qui renvoient un `ActionResult`. */
  const avecResultat = [
    {
      nom: "launchJourney",
      champ: "templateId",
      appel: (id: string) =>
        launchJourney(
          null,
          form({
            templateId: id,
            subjectName: "Tentative",
            startDate: "2026-03-16",
            ownerId: orgA.admin.userId,
          }),
        ),
    },
    {
      nom: "updateTask",
      champ: "taskId",
      appel: (id: string) =>
        updateTask(null, form({ taskId: id, assigneeId: "", dueDate: "2026-03-20" })),
    },
    {
      nom: "addComment",
      champ: "taskId",
      appel: (id: string) => addComment(null, form({ taskId: id, body: "Bonjour" })),
    },
    {
      nom: "addStep",
      champ: "templateId",
      appel: (id: string) =>
        addStep(null, form({ templateId: id, title: "Étape", offsetDays: "0" })),
    },
    {
      nom: "updateStep",
      champ: "stepId",
      appel: (id: string) =>
        updateStep(
          null,
          form({ templateId: id, stepId: id, title: "Étape", offsetDays: "0" }),
        ),
    },
    {
      nom: "updateTemplate",
      champ: "templateId",
      appel: (id: string) =>
        updateTemplate(null, form({ templateId: id, name: "Renommé" })),
    },
    {
      nom: "removeMember",
      champ: "userId",
      appel: (id: string) => removeMember(null, form({ userId: id })),
    },
    {
      nom: "setTaskStatus",
      champ: "taskId",
      appel: (id: string) => setTaskStatus(form({ taskId: id, status: "done" })),
    },
  ] as const;

  /**
   * Actions de formulaire sans retour. On affirme `toBeUndefined()` et non un
   * vague « ne lève pas » : c'est vérifiable, et une exception fait échouer le
   * test de toute façon puisque `.resolves` refuse une promesse rejetée.
   */
  const sansResultat = [
    {
      nom: "cancelJourney",
      appel: (id: string) => cancelJourney(form({ journeyId: id })),
    },
    {
      nom: "reopenJourney",
      appel: (id: string) => reopenJourney(form({ journeyId: id })),
    },
    {
      nom: "deleteStep",
      appel: (id: string) => deleteStep(form({ templateId: id, stepId: id })),
    },
    {
      nom: "moveStep",
      appel: (id: string) =>
        moveStep(form({ templateId: id, stepId: id, direction: "down" })),
    },
    {
      nom: "toggleArchive",
      appel: (id: string) => toggleArchive(form({ templateId: id, archive: "true" })),
    },
    {
      nom: "deleteComment",
      appel: (id: string) => deleteComment(form({ commentId: id })),
    },
    {
      nom: "cancelInvitation",
      appel: (id: string) => cancelInvitation(form({ invitationId: id })),
    },
  ] as const;

  for (const { nom, champ, appel } of avecResultat) {
    it(`${nom} refuse un ${champ} inexistant`, async () => {
      as(orgA.admin);
      const result = await appel(INEXISTANT);
      expect(result.ok).toBe(false);
    });

    it(`${nom} refuse un ${champ} mal formé`, async () => {
      as(orgA.admin);
      const result = await appel(INVALIDE);
      expect(result.ok).toBe(false);
    });
  }

  for (const { nom, appel } of sansResultat) {
    it(`${nom} reste silencieux sur un identifiant inexistant ou mal formé`, async () => {
      as(orgA.admin);
      await expect(appel(INEXISTANT)).resolves.toBeUndefined();
      await expect(appel(INVALIDE)).resolves.toBeUndefined();
    });
  }

  it("acceptInvitation refuse un jeton inconnu sans mener au dashboard", async () => {
    const inconnu = await createTestUser("jeton-inconnu");
    asUserWithoutOrg(inconnu);

    const target = await captureRedirect(() =>
      acceptInvitation(form({ token: "jeton-qui-n-existe-pas" })),
    );

    expect(target).not.toBe("/dashboard");
  });
});

/* ================================================================== */

describe("le nettoyage des comptes de test ne peut pas déborder", () => {
  it("supprime un compte orphelin et épargne un compte rattaché", async () => {
    /**
     * `cleanupTestUsers` supprime dans `auth.users`. Une suppression ne se
     * rejoue pas : ses deux garde-fous méritent d'être vérifiés, pas supposés.
     *
     * Organisation jetable : ce test ne doit rien retirer aux autres.
     */
    const jetable = await createTestOrg("OrgNettoyage");

    try {
      const orphelin = await createTestUser("orphelin");

      const supprimes = await cleanupTestUsers();
      expect(supprimes).toBeGreaterThan(0);

      const restants = await db.execute<{ id: string }>(sql`
        select id from auth.users
         where id in (${orphelin.id}::uuid, ${jetable.admin.userId}::uuid)
      `);

      // L'orphelin est parti, le compte rattaché à une organisation est resté.
      expect(restants.map((r) => r.id)).toEqual([jetable.admin.userId]);

      // Et les comptes de démonstration n'ont pas été effleurés : ils sont sur
      // un autre domaine, et rattachés à leur organisation.
      const demo = await db.execute<{ n: number }>(sql`
        select count(*)::int as n from auth.users
         where email like '%@atelier-novembre.test'
      `);
      expect(demo[0].n).toBe(3);
    } finally {
      await destroyTestOrg(jetable);
    }
  });
});
