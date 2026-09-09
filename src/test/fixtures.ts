import { createClient } from "@supabase/supabase-js";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  memberships,
  organizations,
  templateSteps,
  templates,
} from "@/server/db/schema";
import type { CurrentMembership } from "@/server/auth/session";

/**
 * Jeux de données jetables pour les tests d'intégration.
 *
 * Chaque test crée SA propre organisation, avec ses propres utilisateurs.
 * Deux raisons :
 *   - le jeu de démonstration n'est jamais touché, donc `pnpm dev` reste
 *     utilisable pendant qu'on écrit des tests ;
 *   - deux organisations distinctes sont exactement ce qu'il faut pour
 *     vérifier l'isolation — le test de permission le plus important.
 *
 * Le nettoyage supprime l'organisation : la cascade emporte membres,
 * parcours types, parcours, tâches, commentaires et historique.
 */

const auth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/** Suffixe unique : les emails doivent rester distincts entre exécutions. */
function unique(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function createTestUser(label: string): Promise<{
  id: string;
  email: string;
}> {
  const email = `${label}-${unique()}@test.local`;
  const { data, error } = await auth.auth.signUp({
    email,
    password: "test-password-123",
  });

  if (error || !data.user) {
    throw new Error(`création de ${email} impossible : ${error?.message}`);
  }

  return { id: data.user.id, email };
}

export type TestOrg = {
  id: string;
  admin: CurrentMembership;
  member: CurrentMembership;
};

export async function createTestOrg(name: string): Promise<TestOrg> {
  const [adminUser, memberUser] = await Promise.all([
    createTestUser("admin"),
    createTestUser("membre"),
  ]);

  const [org] = await db
    .insert(organizations)
    .values({ name, slug: `${name.toLowerCase()}-${unique()}` })
    .returning();

  await db.insert(memberships).values([
    { organizationId: org.id, userId: adminUser.id, role: "admin" },
    { organizationId: org.id, userId: memberUser.id, role: "member" },
  ]);

  return {
    id: org.id,
    admin: {
      userId: adminUser.id,
      email: adminUser.email,
      organizationId: org.id,
      organizationName: name,
      role: "admin",
    },
    member: {
      userId: memberUser.id,
      email: memberUser.email,
      organizationId: org.id,
      organizationName: name,
      role: "member",
    },
  };
}

/** Parcours type minimal : trois étapes, dont une avant l'arrivée. */
export async function createTestTemplate(
  org: TestOrg,
  opts: { archived?: boolean; steps?: number } = {},
): Promise<{ id: string; name: string }> {
  const name = `Parcours test ${unique()}`;

  const [template] = await db
    .insert(templates)
    .values({
      organizationId: org.id,
      name,
      description: "",
      targetType: "employee",
      isArchived: opts.archived ?? false,
    })
    .returning();

  const count = opts.steps ?? 3;
  const offsets = [-2, 0, 5, 10, 30];

  if (count > 0) {
    await db.insert(templateSteps).values(
      Array.from({ length: count }, (_, i) => ({
        templateId: template.id,
        title: `Étape ${i + 1}`,
        position: i + 1,
        offsetDays: offsets[i % offsets.length],
        // Le membre est responsable de DEUX étapes : c'est ce qui permet de
        // vérifier qu'un seul email récapitulatif part, et non un par tâche.
        defaultAssigneeId: i < 2 ? org.member.userId : null,
      })),
    );
  }

  return { id: template.id, name };
}

export async function destroyTestOrg(org: TestOrg): Promise<void> {
  await db.delete(organizations).where(eq(organizations.id, org.id));
}

/**
 * Supprime les comptes de test devenus orphelins.
 *
 * POURQUOI C'EST NÉCESSAIRE
 *
 * `createTestUser` crée de vrais comptes par l'API d'inscription, et
 * `destroyTestOrg` ne supprimait que l'organisation : la cascade emporte les
 * memberships, jamais les comptes. Mesuré avant ce nettoyage : **104
 * utilisateurs** dans `auth.users` pour 3 comptes de démonstration, accumulés
 * en une dizaine d'exécutions. La liste des utilisateurs de Studio en devenait
 * inutilisable, et l'inscription est limitée en fréquence — c'est le genre de
 * dérive qui finit par faire échouer les tests pour une raison sans rapport.
 *
 * POURQUOI DU SQL BRUT SUR `auth.users`
 *
 * Le projet interdit d'écrire dans cette table (voir `auth-users.ts`), et cette
 * interdiction vaut pour l'application. Ici, c'est un nettoyage de test qui
 * supprime uniquement ce que les fixtures ont créé. L'autre voie serait l'API
 * d'administration de Supabase, qui exige la clé `service_role` — que ce projet
 * a délibérément choisi de ne pas avoir.
 *
 * DEUX GARDE-FOUS, parce qu'une suppression ne se rejoue pas :
 *   - le domaine `@test.local`, propre aux fixtures. Les comptes de
 *     démonstration sont en `@atelier-novembre.test` et ne peuvent pas
 *     correspondre ;
 *   - l'absence de membership : un compte encore rattaché à une organisation
 *     est épargné, même s'il porte le bon domaine.
 */
export async function cleanupTestUsers(): Promise<number> {
  const rows = await db.execute<{ id: string }>(sql`
    delete from auth.users u
     where u.email like '%@test.local'
       and not exists (select 1 from memberships m where m.user_id = u.id)
    returning u.id
  `);

  return rows.length;
}
