# Reprise — audit de LaunchPath, partie par partie

Document de passation. Il contient tout ce qu'il faut pour reprendre l'audit
sans rien perdre, y compris ce qui ne se déduit pas du code.

---

## 1. Le projet en dix lignes

**LaunchPath** — outil interne de suivi des parcours d'intégration
(onboarding). Un parcours type porte des étapes avec un responsable et un délai
relatif ; le lancer pour une personne **copie** les étapes en tâches et calcule
les échéances en jours ouvrés.

- Projet de **portfolio**, pas de service commercial. Objectif : décrocher une
  alternance en développement fullstack.
- **Tout est local.** Ni Git distant, ni hébergement, ni compte externe. La
  mise en ligne est une phase séparée, à déclencher quand l'utilisateur le
  décidera.
- Stack : Next.js 16 (App Router, React 19), TypeScript strict, PostgreSQL via
  Supabase CLI locale, Drizzle ORM, Tailwind 4, Vitest, Playwright.
- Interface, commentaires de code et documentation **en français**. Le code
  (identifiants, noms de fonctions) en anglais.

---

## 2. Faire tourner le projet

```bash
colima start                 # si `docker ps` échoue
supabase start               # Postgres, Auth, Studio, boîte mail
pnpm db:reset                # reset → migrations → seed → audit RLS
pnpm dev                     # http://localhost:3200
```

| Service | Adresse |
|---|---|
| Application | **http://localhost:3200** (pas 3000, pas 127.0.0.1) |
| API Supabase | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | http://localhost:54323 |
| Boîte mail (Mailpit) | http://localhost:54324 |
| SMTP | 54325 |

Compte de démonstration : `manon@atelier-novembre.test` / `launchpath2026`
(ou le bouton « Entrer avec le compte de démonstration » sur `/login`).

### Commandes

| Commande | Dépendances |
|---|---|
| `pnpm verify` | aucune — lint + typecheck + tests unitaires + build |
| `pnpm test` | aucune — **82 tests** |
| `pnpm test:db` | base lancée — **86 tests** |
| `pnpm test:e2e` | base + serveur — **4 tests** |
| `pnpm db:audit` | refus total : RLS activée, zéro policy, aucune vue |
| `pnpm reminders` | déclenche le cron de rappels |

### Pièges d'environnement — à ne pas réapprendre

- **Ne jamais lancer `pnpm build` pendant que `pnpm dev` tourne.** Les deux
  partagent `.next` et corrompent le cache Turbopack. Symptôme : squelette de
  chargement infini, `[Server HMR] TurbopackInternalError: Cell … no longer
  exists`. Remède : arrêter le serveur, `mv .next /tmp/`, relancer.
- `.env.local` est **protégé en écriture** par une règle de permission. Ne pas
  tenter de l'éditer ; demander à l'utilisateur si une clé manque.
- `rm -rf` est souvent refusé. Utiliser `mv … /tmp/` à la place.
- Ne pas mettre à jour la CLI Supabase (2.98) en cours de projet.
- Le conteneur `supabase_inbucket_*` fait tourner **Mailpit** : API
  `GET /api/v1/messages` puis `/api/v1/message/<id>`.
- Les corrections de `supabase/config.toml` sont déjà appliquées et
  documentées dans `docs/setup.md` (SMTP, redirect URLs, analytique, port).

---

## 3. La tâche en cours

L'utilisateur a demandé une **cartographie complète du produit**, puis une
**relecture partie par partie du code réel** — pas seulement « est-ce qu'il y a
des tests », mais lire le code et chercher erreurs, incohérences et risques.

Le document de référence est **`docs/cartographie.md`** : 11 parties, chacune
avec ses fichiers, son cahier des charges et sa liste de points à vérifier. Il
contient aussi un **journal des relectures** où chaque constat est tracé avec
sa nature et son traitement.

### Rythme convenu

Une partie à la fois. À la fin de chaque partie : appliquer les corrections,
vérifier, mettre à jour le tableau de suivi **et** le journal des relectures de
`docs/cartographie.md`, puis rendre compte et attendre le feu vert.
L'utilisateur répond en général « go ».

### Avancement

| # | Partie | État |
|---|---|---|
| 1 | Fondations et design system | ✅ relue et corrigée |
| 2 | Page publique | ✅ |
| 3 | Authentification et session | ✅ |
| 4 | Équipe et invitations | ✅ |
| 5 | Parcours types | ✅ |
| 6 | Lancement et suivi | ✅ |
| 7 | Détail de tâche, commentaires, historique | ✅ |
| 8 | Tableau de bord, recherche, filtres | ✅ |
| 9 | Emails et rappels automatiques | ✅ |
| 10 | Base de données et sécurité | ✅ relue et corrigée — 7 points |
| 11 | Tests et outillage | ✅ relue et corrigée — 8 points |

---

## 4. Méthode de relecture — non négociable

1. **Lire chaque fichier en entier**, pas seulement les signatures.
2. Confronter au cahier des charges de la partie dans `docs/cartographie.md`.
3. Dérouler la liste de points à vérifier de la partie.
4. Chercher trois familles : **erreur** (le code ne fait pas ce qu'il
   prétend), **incohérence** (deux endroits se contredisent), **risque** (ça
   marche aujourd'hui, ça cassera demain).
5. **Vérifier, ne pas supposer.** Écrire un script jetable dans `scripts/` et
   le lancer, interroger la base, ou écrire un test Playwright temporaire.
   Déplacer le fichier dans `/tmp` après usage.
6. **Valider les tests importants par mutation** : casser volontairement le
   code et confirmer que le test échoue. Un test qui passe ne prouve rien tant
   qu'on n'a pas vu qu'il sait échouer. Restaurer ensuite.
7. Ne jamais compter « un test existe » comme une vérification. **Deux tests
   de ce projet passaient sans rien vérifier.**

### Après une correction mécanique de masse

Les commandes `perl`/`python` de remplacement ont déjà **cassé des apostrophes
françaises** (`l/organisation` au lieu de `l'organisation`). Toujours relire le
texte produit, pas seulement faire passer le compilateur.

---

## 5. Les familles de défauts qui reviennent

C'est la liste la plus utile de ce document : les mêmes causes reviennent.

1. **Valider la forme et croire qu'on a validé la valeur.**
   `isUuid` absent → `22P02` sur `/journeys/j-clara`, puis dans 22 actions.
   `/^\d{4}-\d{2}-\d{2}$/` accepte `2026-02-31` → exception au calcul.
2. **Réponse fausse et silencieuse au lieu d'un refus.**
   `lateDays("bidon")` renvoyait `0` donc « pas en retard ».
   `parseOffset("")` renvoyait `0` donc « le jour de l'arrivée ».
   `setTaskStatus` renvoyait `void`, donc la case se décochait sans explication.
3. **« Je charge tout puis je filtre en JavaScript »**, alors que le projet en
   fait un principe contraire. Trouvé trois fois : `getActiveJourneys`,
   `removeMember`, le tri des étapes.
4. **La documentation affirme ce que le code ne fait pas.**
   Le rouge « uniquement pour le retard » (il servait à trois choses), le jaune
   « un seul usage » (six), « dates relatives à aujourd'hui » sur une page
   prérendue au build.
5. **Fonctionnalité fantôme** : un type d'événement présent au schéma et dans
   l'interface, que rien n'écrit (`task_due_date_changed`).
6. **Un chiffre calculé sur un sous-ensemble et présenté comme un total.**
   « 0 en cours » dès qu'on filtrait par « Terminés ».
7. **Des tests qui dépendent de leur ordre.** Un test destructif mutait la
   fixture partagée. Vérifier avec
   `pnpm vitest run --config vitest.db.config.mts --sequence.shuffle`.
8. **Le garde-fou qui ne garde qu'une moitié de la règle — et annonce le
   contraire.** `db:audit` devait prouver « RLS activée **et** aucune policy » ;
   il lisait le nombre de policies, l'affichait, et concluait « toutes les
   tables sont protégées » sans s'en servir. Une policy permissive faisait
   fuiter de vraies données pendant que l'outil rassurait. **Corollaire de
   méthode : un outil de vérification doit lui-même être cassé pour prouver
   qu'il sait échouer.**
9. **Un jeu de démonstration qui ne ressemble pas à la production.** Le seed
   calculait ses échéances en jours calendaires là où le produit compte en jours
   ouvrés, et datait toutes les tâches terminées de l'instant du seed. Il
   affichait donc des samedis et des tâches closes après leur parcours.
10. **La simulation qui recopie la logique qu'elle remplace.** `requireAdmin`
    était simulé par un mock refaisant sa vérification de rôle : le vrai code
    pouvait cesser de vérifier sans qu'aucun test ne bronche. Ne simuler que la
    frontière technique — ici les cookies HTTP — jamais la règle métier.
11. **Le test qui ne peut pas échouer.** Comparer une colonne d'énumération à
    une liste recopiée à la main : Postgres garantit déjà le résultat. Avant de
    croire un test vert, se demander ce qui devrait le faire rougir — puis le
    casser pour voir.

---

## 6. Les sept décisions d'architecture — à ne pas violer

Détail complet dans `docs/plan_action_launchpath.md` et le README.

1. **Le lancement copie, il ne référence pas.** Les étapes ET le nom du
   parcours type sont snapshotés dans `journeys.template_name`.
2. **Une échéance est un jour civil.** Colonnes `date`. Fuseau métier unique
   `Europe/Paris`. **Un seul point de vérité** : `today()` dans
   `src/lib/dates.ts`, et `(now() at time zone 'Europe/Paris')::date` en SQL.
   Aucun `new Date()` ailleurs pour obtenir la date du jour — l'horodatage
   d'une écriture reste légitime.
3. **`addBusinessDays` est pure.** Servie aussi côté client pour l'aperçu, donc
   une seule implémentation des règles.
4. **Toute lecture exige un `organizationId`.** Tout passe par
   `src/server/db/queries/`. Il n'existe pas de fonction capable de lire sans
   organisation.
5. **RLS activée sans policy sur les 10 tables.** Sinon l'API REST de Supabase
   expose tout via la clé anon, qui est publique. `pnpm db:audit` le vérifie,
   et il est enchaîné dans `db:reset`.
6. **Drizzle possède le schéma applicatif, Supabase possède `auth`.**
   `auth.users` est déclaré dans `src/server/db/auth-users.ts` et **jamais
   ré-exporté** depuis `schema.ts` : l'exporter génère un
   `CREATE TABLE "auth"."users"` qui écraserait la table de connexion.
   `schemaFilter` ne protège pas.
7. **`tasks.assignee_id` référence `auth.users`, pas `memberships`.** Retirer
   un membre ne désassigne donc rien automatiquement : `removeMember()` doit le
   faire explicitement (tâches, parcours pilotés, responsables par défaut).

### Règles de sécurité qui en découlent

- Une Server Action est un **endpoint HTTP public**. `proxy.ts` protège les
  pages, pas les données. Chaque action re-vérifie session, organisation et
  rôle, et **valide tout identifiant reçu** contre les membres de
  l'organisation.
- Les cibles de redirection passent par `safeInternalPath()`.
- Les identifiants de formulaire passent par `readId()` / `readOptionalId()`.
- Les gabarits d'email échappent le HTML (`esc()`) et aplatissent les sauts de
  ligne des objets (`header()`). **Deux contextes, deux règles** : la version
  texte n'est PAS échappée.

---

## 7. Le design system — Journey Orchestration

Référence : `docs/design-system.md`. Direction actuelle :
**Journey Orchestration System**.

- Le rail de parcours devient la signature du produit : `PathRail`,
  `JourneyPathPreview`, checkpoints et prochaine action.
- La palette est fonctionnelle : indigo pour l'action et la position actuelle,
  vert pour le terminé, corail pour le retard, ambre pour l'attention proche.
- Les formes sont arrondies avec retenue : badges, avatars, formulaires et
  cartes doivent être compacts et lisibles sur mobile.
- Les animations restent sobres : entrée, hover, feedback de bouton, et respect
  de `prefers-reduced-motion`.
- Composants signature : `Masthead`, `PathRail`, `JourneyCard`, `DueBadge`,
  `OwnerBadge`, `TaskRow`.

---

## 8. La relecture est terminée

Les onze parties sont relues et corrigées. Le journal de `docs/cartographie.md`
trace chaque constat avec sa nature et son traitement.

Les deux dernières parties ont produit les constats les plus utiles, parce
qu'elles portaient sur les garde-fous eux-mêmes :

- `scripts/db-audit.mts` ne vérifiait que la moitié de la règle qu'il annonçait
  (RLS activée, mais l'absence de policy n'était pas contrôlée) ;
- `src/server/auth/session.ts` — le module dont dépend toute l'isolation —
  n'était jamais testé, seulement simulé, et la simulation recopiait sa logique ;
- un test d'intégration comparait une colonne d'énumération à une liste
  recopiée : il ne pouvait pas échouer.

**La leçon de méthode :** un outil de vérification doit lui-même être cassé pour
prouver qu'il sait échouer. Tous les tests importants du projet ont maintenant
été validés par mutation.

Ce qui reste à faire ne relève plus de la relecture : voir la section 11.

---

## 9. Réserves assumées — ne pas les « corriger » sans en parler

Ces points sont connus, documentés et volontairement laissés tels quels.

| Point | Raison |
|---|---|
| `requireAdmin()` lève une exception au lieu d'un résultat typé | Le cas ne survient que sur requête forgée ; l'interface n'expose l'action qu'aux administrateurs |
| `cancelJourney` reste un `void` silencieux | Utilisé comme `action` de formulaire, donc fonctionnel sans JavaScript |
| `loading.tsx` empêche un vrai code 404 | Un flux de réponse a déjà écrit son statut. L'application est derrière une authentification, aucun robot ne l'indexe. L'interface 404 s'affiche correctement |
| Le panneau de tâche ne se ferme pas avec Échap, pas de piège de focus | Ce n'est pas une modale ; le voile et la croix sont de vrais liens |
| `src/mocks/landing-preview.ts` subsiste | La page publique n'a ni session ni organisation, elle ne peut pas lire la base |
| Pagination absente | Explicitement hors MVP |
| Jours fériés non gérés dans le calcul des échéances | Hors MVP, mentionné dans les limites du README |

---

## 10. Style de travail attendu

- **Français**, phrases directes, pas de jargon inutile. L'utilisateur n'est
  pas encore développeur confirmé : expliquer le *pourquoi*, pas seulement le
  *quoi*.
- **Distinguer ce qui est vérifié de ce qui est supposé.** Dire « vérifié :
  voici la sortie » ou « je suppose, à confirmer ». Ne jamais présenter une
  intuition comme un fait.
- **Signaler ses propres erreurs sans détour.** Plusieurs corrections de cet
  audit portaient sur des défauts que j'avais moi-même introduits, dont une
  régression créée en corrigeant autre chose. C'est noté dans le journal, et
  c'est ce qui donne sa valeur au document.
- Rendre compte avec des chiffres réels (nombre de tests, sortie de commande),
  pas des affirmations.
- Ne pas lancer d'agents ni de workflows : l'utilisateur ne les a pas demandés.

---

## 11. Ce qui reste au-delà de l'audit

Trois choses, dont deux appartiennent à l'utilisateur.

1. **Rédiger quatre documents de cadrage avec ses mots** —
   `docs/product-brief.md`, `screens.md`, `data-model.md`, `decisions.md`. Le
   contenu existe dans le plan et le design system, mais c'est l'exercice qui
   le rendra capable de répondre aux 14 questions d'entretien de la section 8
   du plan. **Ne pas le faire à sa place.**
2. **Captures d'écran et GIF** pour le README. Une seule existe :
   `docs/screenshots/parcours-clara.png`.
3. **La mise en ligne** — 5 à 7 h, détaillée en section 12 de
   `docs/plan_action_launchpath.md` : Git et GitHub, Supabase cloud, Resend,
   Vercel, CI. Avec un test `curl` obligatoire sur la clé anon pour vérifier
   que le RLS tient en production. À déclencher seulement quand l'utilisateur
   le décide, avec une identité GitHub personnelle.

---

## 12. Documents du projet

| Fichier | Contenu |
|---|---|
| `docs/cartographie.md` | **La carte et le journal des relectures** |
| `docs/reprise-audit.md` | Ce document |
| `docs/plan_action_launchpath.md` | Plan de construction, 7 décisions, mise en ligne |
| `docs/design-system.md` | Direction artistique, tokens, composants |
| `docs/journal.md` | Journal de bord : appris, bloqué, décidé |
| `docs/backlog.md` | Suivi des tâches |
| `docs/setup.md` | Installation, commandes, problèmes connus |
| `README.md` | Présentation du produit et des décisions |
