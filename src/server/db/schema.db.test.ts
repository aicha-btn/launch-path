import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

/* ==========================================================================
   Le schéma réel, comparé à ce que le code déclare.

   POURQUOI CES TESTS EXISTENT

   `schema.ts` n'est pas la base : c'est une déclaration à partir de laquelle
   des migrations sont générées, puis appliquées à la main. Entre les deux, il
   y a de la place pour un écart — une migration oubliée, un index déclaré qui
   n'a jamais été créé, une table ajoutée sans son `enable row level
   security`. Rien dans la compilation ne le remarquerait.

   Ces tests interrogent les catalogues de Postgres. Ils ne relisent pas le
   code : ils regardent la base.

   Ils ne dupliquent pas `pnpm db:audit`, qui protège l'installation locale et
   la commande `db:reset` ; ils protègent la suite de tests, qui tourne
   ailleurs et plus souvent.
   ========================================================================== */

/**
 * Les tables applicatives, prises depuis le schéma plutôt que recopiées — une
 * liste écrite à la main ici passerait à côté d'une table ajoutée sans son
 * `enable row level security`, qui est précisément le risque surveillé.
 *
 * `getTableConfig` lève sur tout ce qui n'est pas une table : c'est ce qui
 * écarte les énumérations et les objets `relations()` qu'exporte aussi
 * schema.ts.
 */
const tables = Object.values(schema).flatMap((value) => {
  try {
    return [getTableConfig(value as PgTable)];
  } catch {
    return [];
  }
});

/**
 * Tous les index que le code déclare, sous les trois formes possibles :
 * `index()`/`uniqueIndex()` dans le second argument de `pgTable`, `unique()`
 * de table, et le `.unique()` posé directement sur une colonne — c'est cette
 * dernière forme qui crée `organizations_slug_unique` et
 * `invitations_token_unique`.
 */
function declaredIndexNames(): string[] {
  return tables
    .flatMap((table) => [
      ...table.indexes.map((i) => i.config.name),
      ...table.uniqueConstraints.map((u) => u.name),
      ...table.columns.filter((c) => c.isUnique).map((c) => c.uniqueName),
    ])
    .filter((name): name is string => Boolean(name));
}

describe("le schéma déclaré et la base réelle", () => {
  it("expose exactement les dix tables attendues", () => {
    expect(tables.map((t) => t.name).sort()).toEqual([
      "activity_events",
      "comments",
      "invitations",
      "journeys",
      "memberships",
      "notification_logs",
      "organizations",
      "tasks",
      "template_steps",
      "templates",
    ]);
  });

  it("a créé en base tous les index déclarés dans schema.ts", async () => {
    const declares = declaredIndexNames().sort();

    // Un index déclaré mais absent en base, c'est une requête qui parcourt la
    // table entière sans que rien ne le signale.
    expect(declares.length).toBeGreaterThan(0);

    const rows = await db.execute<{ indexname: string }>(sql`
      select indexname from pg_indexes where schemaname = 'public'
    `);
    const reels = new Set(rows.map((r) => r.indexname));

    expect(declares.filter((name) => !reels.has(name))).toEqual([]);
  });

  it("ne garde en base aucun index que schema.ts ne déclare plus", async () => {
    /**
     * Le sens inverse compte autant. `invitations_token_idx` était un doublon
     * exact de la contrainte d'unicité sur la même colonne : retiré de
     * `schema.ts`, il aurait pu survivre en base indéfiniment, payé à chaque
     * écriture, invisible.
     *
     * Les clés primaires (`*_pkey`) sont créées par Postgres et non déclarées
     * comme index : elles sont écartées.
     */
    const declares = new Set(declaredIndexNames());

    const rows = await db.execute<{ indexname: string }>(sql`
      select indexname from pg_indexes
       where schemaname = 'public' and indexname not like '%\\_pkey'
    `);

    expect(rows.map((r) => r.indexname).filter((n) => !declares.has(n))).toEqual(
      [],
    );
  });

  it("indexe les retards par un index PARTIEL sur les tâches à faire", async () => {
    /**
     * La définition est vérifiée, pas seulement l'existence. Un index complet
     * sur `due_date` porterait le même nom et passerait le test précédent,
     * tout en indexant les milliers de tâches déjà terminées.
     */
    const [row] = await db.execute<{ indexdef: string }>(sql`
      select indexdef from pg_indexes
       where schemaname = 'public' and indexname = 'tasks_due_date_todo_idx'
    `);

    expect(row?.indexdef).toContain("(due_date)");
    expect(row?.indexdef).toMatch(/WHERE \(status = 'todo'/);
  });

  it("laisse chaque table en refus total pour la clé anon", async () => {
    /**
     * Refus total = RLS activée ET aucune policy. Les deux moitiés comptent :
     * une seule policy permissive rouvre la table à travers l'API REST que
     * Supabase expose automatiquement, alors que « RLS activée » reste vrai.
     */
    const rows = await db.execute<{
      relname: string;
      relrowsecurity: boolean;
      policies: number;
    }>(sql`
      select c.relname, c.relrowsecurity,
             (select count(*)::int from pg_policy p where p.polrelid = c.oid)
               as policies
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p')
    `);

    expect(rows.length).toBe(tables.length);
    expect(
      rows
        .filter((r) => !r.relrowsecurity || r.policies > 0)
        .map((r) => `${r.relname} (rls=${r.relrowsecurity}, ${r.policies})`),
    ).toEqual([]);
  });

  it("n'expose aucune vue dans le schéma public", async () => {
    // PostgREST expose aussi les vues, et une vue s'exécute par défaut avec
    // les droits de son propriétaire : elle traverse donc le RLS.
    const rows = await db.execute<{ relname: string }>(sql`
      select c.relname from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('v', 'm', 'f')
    `);

    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("ne laisse aucune échéance en timestamp — décision n° 2", async () => {
    /**
     * `start_date`, `due_date` et `sent_on` sont des jours civils. Les passer
     * un jour en `timestamptz` réintroduirait le fuseau dans un calcul qui n'en
     * veut pas : une tâche due la veille cesserait d'être en retard avant 2 h
     * du matin.
     */
    const rows = await db.execute<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(sql`
      select table_name, column_name, data_type
        from information_schema.columns
       where table_schema = 'public'
         and column_name in ('start_date', 'due_date', 'sent_on')
    `);

    expect(rows.length).toBe(3);
    expect(rows.filter((r) => r.data_type !== "date")).toEqual([]);
  });
});
