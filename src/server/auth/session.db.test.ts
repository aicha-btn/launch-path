import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createTestOrg,
  createTestUser,
  cleanupTestUsers,
  destroyTestOrg,
  type TestOrg,
} from "@/test/fixtures";

/* ==========================================================================
   Le module de session, testé pour de vrai.

   POURQUOI CE FICHIER MANQUAIT — ET C'ÉTAIT LE PLUS GROS TROU DE LA SUITE

   `src/server/auth/session.ts` porte la décision d'architecture n° 4 : toute
   lecture part de lui, et c'est lui qui répond « à quelle organisation
   appartient cette personne, et avec quel rôle ». Tout le travail d'isolation
   en dépend.

   Or il était **entièrement simulé** dans `integration.db.test.ts` — et la
   simulation RECOPIAIT sa logique, y compris la vérification du rôle :

       requireAdmin: async () => {
         if (currentMembership.role !== "admin") throw new Error(...)
       }

   Conséquence : si le vrai `requireAdmin` cessait de vérifier le rôle, la suite
   restait verte. Le test « un membre simple ne peut pas inviter » ne prouvait
   qu'une chose — que l'action appelle `requireAdmin` — jamais que
   `requireAdmin` refuse.

   Ici, une seule chose est simulée : `createSupabaseServerClient`, parce qu'il
   lit des cookies HTTP qui n'existent pas hors du serveur. Le reste est réel —
   la résolution du membership, la base, les deux redirections, la
   vérification du rôle.
   ========================================================================== */

/** L'utilisateur que la session est censée révéler. Réécrit par chaque test. */
let sessionUser: { id: string; email: string | null } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: sessionUser }, error: null }),
    },
  }),
}));

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
}));

async function captureRedirect(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.target;
    throw error;
  }
  throw new Error("aucune redirection alors qu'une était attendue");
}

const { getCurrentMembership, requireMembership, requireAdmin } = await import(
  "@/server/auth/session"
);

let org: TestOrg;

beforeAll(async () => {
  org = await createTestOrg("OrgSession");
});

afterAll(async () => {
  await destroyTestOrg(org);
  await cleanupTestUsers();
});

describe("getCurrentMembership", () => {
  it("renvoie null sans session", async () => {
    sessionUser = null;
    expect(await getCurrentMembership()).toBeNull();
  });

  it("renvoie null pour une personne connectée sans organisation", async () => {
    // L'état réel d'une personne qui arrive par un lien d'invitation.
    const orphelin = await createTestUser("sans-org");
    sessionUser = orphelin;

    expect(await getCurrentMembership()).toBeNull();
  });

  it("résout l'organisation, son nom et le rôle", async () => {
    sessionUser = { id: org.admin.userId, email: org.admin.email };

    expect(await getCurrentMembership()).toEqual({
      userId: org.admin.userId,
      email: org.admin.email,
      organizationId: org.id,
      organizationName: "OrgSession",
      role: "admin",
    });
  });

  it("distingue le rôle membre du rôle administrateur", async () => {
    // Le même code, deux réponses : c'est ce que `requireAdmin` exploite.
    sessionUser = { id: org.member.userId, email: org.member.email };

    const membership = await getCurrentMembership();
    expect(membership?.role).toBe("member");
    expect(membership?.organizationId).toBe(org.id);
  });

  it("tolère un compte sans email plutôt que de renvoyer null", async () => {
    // `auth.users.email` est nullable. Un `email` absent ne doit pas priver la
    // personne de son organisation.
    sessionUser = { id: org.admin.userId, email: null };

    const membership = await getCurrentMembership();
    expect(membership?.email).toBe("");
    expect(membership?.organizationId).toBe(org.id);
  });
});

describe("requireMembership — deux refus, deux destinations", () => {
  it("sans session, envoie vers la connexion", async () => {
    sessionUser = null;
    expect(await captureRedirect(requireMembership)).toBe("/login");
  });

  it("connecté sans organisation, envoie vers la création d'organisation", async () => {
    // Confondre les deux cas enfermerait la personne invitée dans une boucle :
    // renvoyée vers /login alors qu'elle est déjà connectée.
    const orphelin = await createTestUser("sans-org-2");
    sessionUser = orphelin;

    expect(await captureRedirect(requireMembership)).toBe("/welcome");
  });

  it("laisse passer un membre", async () => {
    sessionUser = { id: org.member.userId, email: org.member.email };

    const membership = await requireMembership();
    expect(membership.organizationId).toBe(org.id);
  });
});

describe("requireAdmin — la vérification qui n'était jamais testée", () => {
  it("laisse passer un administrateur", async () => {
    sessionUser = { id: org.admin.userId, email: org.admin.email };

    const membership = await requireAdmin();
    expect(membership.role).toBe("admin");
  });

  it("REFUSE un membre simple", async () => {
    sessionUser = { id: org.member.userId, email: org.member.email };

    await expect(requireAdmin()).rejects.toThrow(/administrateurs/);
  });

  it("REFUSE avant même de regarder le rôle s'il n'y a pas de session", async () => {
    // L'ordre compte : sans session, on redirige, on ne lève pas une erreur de
    // rôle sur `undefined`.
    sessionUser = null;
    expect(await captureRedirect(requireAdmin)).toBe("/login");
  });
});
