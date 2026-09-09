import postgres from "postgres";

/**
 * Vérifie que le schéma `public` est bien en refus total pour la clé anon.
 *
 * Ce script existe parce que la décision n° 5 repose sur une action manuelle
 * à répéter — ajouter un `alter table ... enable row level security` à chaque
 * nouvelle table. Une règle qui dépend de la mémoire finit toujours par être
 * oubliée. Celle-ci est vérifiée par une commande.
 *
 * TROIS CONTRÔLES, PAS UN SEUL
 *
 * 1. RLS activée sur chaque table. Sans elle, l'API REST auto-générée expose
 *    tout via la clé anon, qui est publique.
 *
 * 2. AUCUNE policy. C'est la moitié qui manquait : « RLS activée » ne veut
 *    pas dire « protégé ». Une seule policy permissive — un `using (true)`
 *    copié d'un tutoriel — rouvre la table en entier, et la version
 *    précédente de ce script affichait pourtant « toutes les tables sont
 *    protégées ». Le refus total, c'est RLS activée ET zéro policy.
 *
 * 3. Aucune vue dans `public`. PostgREST expose aussi les vues, et une vue
 *    s'exécute par défaut avec les droits de son propriétaire : elle traverse
 *    donc le RLS des tables qu'elle lit. Une vue ajoutée sans y penser
 *    contournerait tout le dispositif.
 *
 * Usage : pnpm db:audit
 */

if (!process.env.DATABASE_URL) {
  console.error(
    "\n  DATABASE_URL absente.\n" +
      "  Ce script se lance via `pnpm db:audit`, qui charge .env.local.\n",
  );
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

type TableRow = {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
};

/**
 * `relkind` : `r` = table ordinaire, `p` = table partitionnée. Les deux
 * portent RLS et sont exposées par PostgREST.
 *
 * Aucune exclusion à prévoir pour la table de suivi des migrations : Drizzle
 * la crée dans le schéma `drizzle`, pas dans `public` — vérifié en base.
 */
const tables = await sql<TableRow[]>`
  select
    c.relname                                  as table_name,
    c.relrowsecurity                           as rls_enabled,
    (select count(*)::int
       from pg_policy p
      where p.polrelid = c.oid)                as policy_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
  order by c.relname
`;

type ViewRow = { view_name: string; kind: string };

const views = await sql<ViewRow[]>`
  select c.relname as view_name, c.relkind as kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('v', 'm', 'f')
  order by c.relname
`;

await sql.end();

const sansRls = tables.filter((t) => !t.rls_enabled);
const avecPolicy = tables.filter((t) => t.policy_count > 0);

console.log(`\n  ${tables.length} tables dans le schéma public\n`);

for (const table of tables) {
  const conforme = table.rls_enabled && table.policy_count === 0;
  const detail = !table.rls_enabled
    ? "RLS DÉSACTIVÉE — table exposée via la clé anon"
    : table.policy_count > 0
      ? `RLS activée mais ${table.policy_count} ${table.policy_count === 1 ? "policy" : "policies"} — le refus total est rompu`
      : "refus total (RLS activée, aucune policy)";

  console.log(`  ${conforme ? "✓" : "✗"}  ${table.table_name.padEnd(20)} ${detail}`);
}

const problemes: string[] = [];

if (sansRls.length > 0) {
  problemes.push(
    `${sansRls.length} table(s) sans RLS. Ajoutez-les dans une migration :\n` +
      sansRls
        .map((t) => `    alter table "${t.table_name}" enable row level security;`)
        .join("\n"),
  );
}

if (avecPolicy.length > 0) {
  problemes.push(
    `${avecPolicy.length} table(s) portent une policy, alors que le modèle du\n` +
      `  projet est le refus total (décision n° 5) : l'autorisation vit dans la\n` +
      `  couche serveur, pas en base. Supprimez la policy, ou assumez le\n` +
      `  changement de modèle et mettez ce script à jour :\n` +
      avecPolicy.map((t) => `    ${t.table_name} (${t.policy_count})`).join("\n"),
  );
}

if (views.length > 0) {
  problemes.push(
    `${views.length} vue(s) dans le schéma public. PostgREST les expose, et une\n` +
      `  vue traverse le RLS des tables qu'elle lit. Sortez-la de \`public\`, ou\n` +
      `  déclarez-la \`with (security_invoker = true)\` :\n` +
      views.map((v) => `    ${v.view_name} (relkind ${v.kind})`).join("\n"),
  );
}

if (problemes.length > 0) {
  console.error(`\n  ÉCHEC.\n\n  ${problemes.join("\n\n  ")}\n`);
  process.exit(1);
}

console.log(
  `\n  Refus total confirmé : ${tables.length} tables, aucune policy, aucune vue.\n`,
);
