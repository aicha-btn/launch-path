# Plan d’action — LaunchPath

> Document de travail spécifique au **projet 2** du portfolio.
> Le plan global (positionnement, standards README, méthode d’apprentissage) reste dans `plan_action_portfolio_fullstack_alternance.md`. Ici, on ne parle que de LaunchPath.

---

# Mode de travail : 100 % local

**Décision** : tout est développé en local. Pas de Git, pas de GitHub, pas d’hébergement, aucun compte à créer sur un service externe. La mise en ligne se fera **en une seule phase finale**, le jour où je le déciderai (section 12).

## Ce que ça change concrètement

| Élément | En production (plus tard) | En local (maintenant) |
|---|---|---|
| PostgreSQL | Supabase cloud | `supabase start` → Postgres sur `localhost:54322` |
| Authentification | Supabase Auth cloud | Supabase Auth local (même API, même code) |
| Emails | Resend | **Inbucket**, boîte mail locale sur `localhost:54324` — tous les emails y sont interceptés |
| Interface base de données | Supabase Studio cloud | Supabase Studio local sur `localhost:54323` |
| Tâches planifiées | Vercel Cron | script `pnpm reminders` lancé à la main |
| Versionnement | Git + GitHub + PR | `docs/journal.md` (voir plus bas) |
| CI | GitHub Actions | script `pnpm verify` lancé à la main |

Tout est déjà installé sur la machine : Node 22, pnpm 11, Docker, Supabase CLI 2.98.

```bash
supabase start   # Postgres + Auth + Studio + Inbucket, en local, dans Docker
pnpm dev
```

**Point important** : ce choix ne dégrade pas le projet. La stack locale Supabase est *la même* que la stack cloud. Passer en ligne à la fin consistera essentiellement à changer les variables d’environnement — pas à réécrire du code.

**Ne pas mettre à jour la CLI Supabase en cours de projet.** La version installée est 2.98 ; la 2.112 existe déjà. Les clés de `config.toml` changent entre versions majeures. Rester sur 2.98 jusqu’à la fin, et n’envisager la mise à jour qu’à la phase 12.

**Précision vérifiée sur la boîte mail locale** : la section de configuration s’appelle `[inbucket]` et le conteneur `supabase_inbucket_*`, mais l’image réellement utilisée est **Mailpit v1.22.3**. Conséquences pratiques :

- l’interface sur `localhost:54324` est celle de Mailpit ;
- son API est celle de Mailpit — `GET /api/v1/messages`, puis `GET /api/v1/message/<id>` — et non celle d’Inbucket (`/api/v1/mailbox/<nom>`, qui renvoie « File not found ») ;
- le SMTP est sur `54325`, une fois `smtp_port` décommenté.

C’est cette API qu’il faudrait interroger si l’on voulait un jour tester le magic link dans Playwright — raison de plus de passer par le mot de passe pour les tests.

## Configuration locale à ajuster une fois pour toutes

Trois défauts de `supabase/config.toml` cassent le projet tel qu’il est prévu. À corriger **dès la création du fichier**, avant d’écrire la moindre ligne de code métier — sinon on cherche la cause pendant une soirée.

### 1. Le port SMTP est désactivé par défaut

```toml
[inbucket]
port = 54324
smtp_port = 54325     # ← décommenter : sans ça, l'envoi d'email depuis l'app échoue
```

### 2. Les URLs de redirection ne correspondent pas au serveur de développement

Les valeurs par défaut sont en `127.0.0.1` **et en https**, alors que Next.js sert `http://localhost:3000`. Supabase Auth ne considère pas `localhost` et `127.0.0.1` comme équivalents : le magic link est refusé.

```toml
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]
```

### 3. Vérifier ce qui est déjà bon (et en tirer parti)

```toml
[auth.email]
enable_signup = true
enable_confirmations = false    # pratique : un utilisateur créé au seed peut se connecter tout de suite
otp_length = 6
```

`enable_confirmations = false` et `minimum_password_length = 6` permettent l’authentification par mot de passe en local. **C’est ce qui rendra les tests Playwright possibles** (voir semaine 6) : il n’existe pas d’OTP de test pour l’email, seulement pour le SMS — un test end-to-end ne peut donc pas passer par le magic link sans aller lire la boîte Inbucket par son API.

## Le seul vrai coût de « pas de Git »

Sans historique Git, il sera impossible de reconstituer plus tard des commits lisibles et des Pull Requests — or le plan global en fait un signal de sérieux pour le recruteur. Le repo final n’aura qu’un seul gros commit initial.

**Compensation à appliquer dès le début** — tenir un journal local :

```text
docs/journal.md
```

Une entrée par session de travail :

```markdown
## 2026-08-12 — 2 h
- Écran liste des onboardings avec filtres statut et responsable
- Appris : searchParams dans un Server Component, pourquoi les filtres doivent vivre dans l'URL
- Bloqué 30 min sur : revalidatePath qui ne rafraîchissait pas → il fallait revalider le layout
- Prochaine fois : le Sheet de détail de tâche
```

Ce fichier a trois usages : il devient la section « difficultés rencontrées » du README, il sert de base aux réponses d’entretien, et il permettra à la fin de créer de vraies branches/PR **pour les dernières fonctionnalités** afin d’avoir malgré tout un historique crédible.

## Sauvegarde

Sans Git, une erreur de manipulation peut coûter plusieurs heures. À faire une fois par semaine :

```bash
# copie horodatée du projet, hors du dossier de travail
cp -R ~/Documents/Coding/chai/launch-path ~/Documents/Coding/_backups/launch-path-2026-08-12
```

Et un dump de la base avant toute migration risquée. **Le flag `--local` est obligatoire** : sans lui, la commande cible le projet distant (`--linked` vaut `true` par défaut) et échoue. Et un dump sans option ne contient que le schéma, pas les données — il en faut donc deux :

```bash
supabase db dump --local -f docs/backups/2026-08-12-schema.sql
supabase db dump --local --data-only -f docs/backups/2026-08-12-data.sql
```

---

# 0. Ce que LaunchPath doit prouver (et que SignalDesk ne prouve pas)

SignalDesk prouve : « je sais construire un SaaS B2B complet avec front séparé + API Rails ».

LaunchPath doit prouver **trois choses différentes**, sinon le projet ne sert à rien dans le portfolio :

| Ce que ça prouve | Pourquoi c’est rare chez un junior |
|---|---|
| **Workflow métier** : un objet (template) génère d’autres objets (tâches) selon des règles | Ce n’est plus du CRUD : il y a une transformation de données |
| **Logique de dates et d’échéances** | Calcul de `due_date`, détection des retards, jours ouvrés, fuseau horaire métier |
| **Automatisation** : le produit agit tout seul (emails, rappels planifiés) | Montre qu’on sait faire tourner du code sans utilisateur devant l’écran |

Et sur le plan technique, il prouve la **deuxième approche d’architecture** : Next.js fullstack (Server Components + Server Actions + base directement accessible), là où SignalDesk montrait front/back séparés.

**Conséquence directe** : le produit doit être **collaboratif**. Une organisation à un seul membre ne démontre ni l’assignation, ni les emails à des tiers, ni l’écran « mes tâches ». C’est pourquoi le flux d’invitation fait partie du MVP (semaine 2) et non des bonus.

**Règle de rédaction du README final** : ces trois messages doivent être lisibles en 20 secondes.

---

# 1. Cadrage produit

## Pitch (une phrase)

> LaunchPath permet à un responsable RH ou Customer Success de créer des parcours d’onboarding réutilisables, de les lancer pour une nouvelle recrue ou un nouveau client, et de suivre automatiquement l’avancement, les responsables et les retards.

## Persona principale

**Manon, Office & People Manager dans une startup SaaS de 40 personnes.**
Elle intègre 2 à 5 personnes par mois. Chaque onboarding implique 4 à 6 personnes différentes (IT, manager, RH, finance).

Aujourd’hui elle utilise : un template Notion dupliqué à la main, des relances Slack, un tableau Excel de suivi.

## Les trois problèmes réels

1. **Le template se perd** : chaque onboarding est une copie manuelle, les améliorations ne remontent jamais dans le modèle de référence.
2. **Personne ne sait qui fait quoi et pour quand** : les échéances sont implicites (« la première semaine »), donc elles glissent.
3. **Aucune visibilité globale** : impossible de répondre à « où en sont les 4 onboardings en cours ? » sans ouvrir 4 documents.

## Résultat attendu

Manon crée un template une fois. Elle le lance en 30 secondes pour une nouvelle recrue. Les tâches sont générées avec des dates réelles et des responsables. Chaque responsable reçoit un email. Manon voit sur un seul écran les retards.

## Les 6 actions essentielles

1. Inviter mes collègues dans l’organisation, pour pouvoir leur assigner des étapes.
2. Créer un template d’onboarding avec des étapes ordonnées, un responsable et un délai relatif.
3. Lancer un onboarding depuis un template pour une personne donnée à une date donnée.
4. Cocher une tâche et voir la progression avancer.
5. Voir sur un dashboard les onboardings en cours et les tâches en retard.
6. Recevoir un email quand une tâche m’est assignée et quand elle est en retard.

## Hors MVP (décision explicite)

- étapes conditionnelles / dépendances entre tâches ;
- intégration Google Calendar ;
- intégration Slack ;
- pièces jointes / stockage de fichiers ;
- templates publics partagés entre organisations ;
- éditeur de template en drag & drop ;
- rôles fins et permissions granulaires (on s’arrête à `admin` / `member`) ;
- **suppression** d’un template (archivage uniquement) ;
- **pagination** des listes (voir « Si le temps manque », section 5) ;
- multi-langue ;
- plusieurs organisations par utilisateur (un utilisateur appartient à une seule organisation).

Chacun de ces points va dans la section « Améliorations futures » du README. Le fait de les **nommer et de les exclure volontairement** est un signal de maturité produit.

---

# 2. Décisions techniques (prises maintenant, une fois pour toutes)

| Sujet | Choix | Pourquoi ce choix (à savoir expliquer en entretien) |
|---|---|---|
| Framework | **Next.js 16, App Router, TypeScript strict** | Server Components pour lire la base sans écrire d’API, Server Actions pour les mutations |
| Base de données | **PostgreSQL via Supabase CLI en local** (`supabase start`) | Vrai Postgres dans Docker, identique à la version cloud → bascule finale sans réécriture |
| Accès aux données | **Drizzle ORM** (schéma en TypeScript, migrations SQL générées et lisibles) | Je vois le SQL généré, donc j’apprends le SQL au lieu de le cacher |
| Auth | **Supabase Auth** (magic link en usage réel, mot de passe pour les tests), instance locale | Cohérent avec la base, et différent de Clerk utilisé sur SignalDesk → montre deux approches |
| Sécurité base | **RLS activée en deny-all sur toutes les tables** | Sans ça, l’API REST auto-générée de Supabase expose tout via la clé anon (voir décision 5) |
| UI | **Tailwind CSS + shadcn/ui** | Composants accessibles, je garde le contrôle du code |
| Retours utilisateur | **sonner** (toasts) dès la semaine 1 | Toute Server Action doit confirmer ou expliquer son échec |
| Formulaires | **React Hook Form + Zod** | Un seul schéma Zod validé côté client **et** côté serveur |
| Emails | **React Email** + **Inbucket** en local (Resend branché à la fin) | Je vois le rendu réel des emails sans compte ni domaine à vérifier |
| Tâches planifiées | Route protégée + script `pnpm reminders` (Vercel Cron à la fin) | La logique est écrite maintenant, le déclencheur planifié vient plus tard |
| Fuseau horaire | **`Europe/Paris` comme fuseau métier unique** | Une échéance est un jour civil, pas un instant (voir décision 2) |
| Tests | **Vitest** (logique métier) + **Playwright** (1 parcours critique) | On teste ce qui a de la valeur, pas 100 % de couverture |
| Vérification | script **`pnpm verify`** = lint + typecheck + test + build (GitHub Actions à la fin) | Le jour où la CI arrive, elle n’exécutera qu’une seule commande déjà éprouvée |
| Hébergement | **Aucun pour l’instant** — tout sur `localhost:3000` | Décision assumée : voir section 12 |

## Décisions d’architecture à savoir défendre

### 1. Snapshot du template au lancement

Quand on lance un onboarding, on **copie** les étapes du template en tâches. On ne les référence pas.

Conséquence : modifier un template plus tard **ne modifie pas** les onboardings déjà lancés.

C’est le bon comportement métier (on ne réécrit pas l’historique d’un onboarding en cours) et c’est un excellent sujet de discussion en entretien : « pourquoi as-tu dupliqué la donnée au lieu de faire une jointure ? »

**Le snapshot s’applique aussi au nom du template.** `journeys.template_name` est une colonne à part entière, remplie au lancement. Sinon la page détail d’un onboarding affiche un nom vide dès que le template est archivé ou supprimé — la jointure ne suffit pas, c’est tout l’intérêt du snapshot.

### 2. Les échéances sont des jours civils, pas des instants

Une échéance d’onboarding est « le 12 mars », pas « le 12 mars à 00:00 UTC ». D’où le type `date` pour `due_date` et `start_date`.

**Mais le type `date` ne règle que la moitié du problème.** Il reste à définir ce qu’est « aujourd’hui ». `CURRENT_DATE` dépend du fuseau de la session Postgres, en pratique UTC. Le 13 juillet à 00h30 à Paris, il est encore le 12 en UTC : une tâche due le 12 n’apparaîtrait pas en retard avant 02h00 du matin. Deux heures de faux résultats chaque jour.

→ **Un fuseau métier unique, `Europe/Paris`, et un seul point de vérité pour « aujourd’hui » :**

```sql
-- côté SQL
(now() AT TIME ZONE 'Europe/Paris')::date
```

```ts
// côté TypeScript : src/lib/dates.ts — la SEULE façon d'obtenir la date du jour dans le projet
export function today(): string   // "2026-08-12", en Europe/Paris
```

Interdiction d’appeler `new Date()` pour comparer une échéance ailleurs que dans ce fichier. C’est une règle simple qui élimine toute une famille de bugs, et une bonne réponse d’entretien — plus fine que le simple « `date` plutôt que `timestamp` ».

### 3. Le calcul de la date d’échéance vit dans une fonction pure

```
due_date = addBusinessDays(journey.start_date, step.offset_days)
```

Fonction pure, sans base de données, dans `src/lib/scheduling.ts` → **testable en 5 lignes de Vitest**. C’est le test le plus rentable du projet.

**Règles arrêtées** (à ne pas laisser implicites, elles sont la source des tests) :

- `offset_days = 0` → la date de départ **telle quelle**, même si c’est un samedi (le jour d’arrivée est le jour d’arrivée) ;
- `offset_days > 0` → on avance de N jours ouvrés, samedis et dimanches exclus ;
- `offset_days < 0` → on recule de N jours ouvrés ;
- pas de gestion des jours fériés (hors MVP, à mentionner dans les limites du README).

### 4. Isolation des données par organisation

Toutes les requêtes passent par un helper qui exige l’`organization_id` de l’utilisateur courant. Aucune requête « libre » dans les composants.

```
src/server/db/queries.ts  →  toutes les lectures, toutes scopées par org
```

C’est la même compétence que le multi-tenant de SignalDesk, exprimée autrement.

### 5. RLS activée en deny-all sur toutes les tables

**C’est la décision la plus importante du projet en matière de sécurité, et la moins intuitive.**

Supabase expose automatiquement une API REST sur toutes les tables du schéma `public` :

```toml
[api]
schemas = ["public", "graphql_public"]
```

Or la clé anon est **publique par nature** : elle part dans le bundle navigateur via `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Si RLS n’est pas activée, n’importe qui peut lire et écrire `journeys`, `tasks` ou `memberships` en appelant `https://<projet>.supabase.co/rest/v1/tasks` — en contournant totalement `getCurrentMembership()`.

Tout le travail d’isolation de la décision 4 deviendrait décoratif. Et le piège est parfait : **en local ça ne se voit pas**, le problème n’apparaît qu’au déploiement, quand on ne le cherche plus.

→ Chaque table applicative active RLS, **sans aucune policy**, ce qui équivaut à un refus total pour les rôles `anon` et `authenticated` :

```sql
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
```

L’application continue de fonctionner : le serveur se connecte via `DATABASE_URL` avec le rôle `postgres`, propriétaire des tables, qui contourne RLS.

À faire **pour chaque nouvelle table**, sans exception. Soit via `.enableRLS()` sur la table Drizzle si la version installée le propose, soit dans une migration SQL personnalisée (`drizzle-kit generate --custom`).

Formulation d’entretien : *« RLS en deny-all, l’autorisation vit dans la couche serveur, la clé anon ne donne accès à rien. »*

### 6. Une seule source de vérité pour les migrations

Le projet contient **deux** systèmes de migration : `supabase/migrations/` (créé par la CLI) et `drizzle/` (créé par drizzle-kit). Les laisser cohabiter sans règle produit une base à moitié construite, **sans message d’erreur** — `supabase db reset` rejoue ses migrations et ignore celles de Drizzle.

Règle : **Drizzle est propriétaire du schéma applicatif, Supabase est propriétaire du schéma `auth`.**

```json
"db:reset": "supabase db reset && drizzle-kit migrate && tsx src/server/db/seed.ts"
```

`supabase db reset` remet la base à zéro (dont le schéma `auth`), `drizzle-kit migrate` reconstruit les tables applicatives, le seed les remplit. Une commande, un état reproductible.

Corollaire : le schéma `auth` est déclaré en **lecture seule** côté Drizzle (`pgSchema('auth')`) pour pouvoir y référencer `auth.users`, et il est exclu du périmètre des migrations Drizzle. Une migration qui tenterait de créer ou modifier `auth` casserait l’authentification.

### 7. Les responsables référencent des utilisateurs, pas des memberships

`tasks.assignee_id` et `template_steps.default_assignee_id` référencent `auth.users(id)`.

Conséquence à assumer : retirer un membre de l’organisation **ne désassigne pas automatiquement** ses tâches, puisque l’utilisateur existe toujours en base. C’est un traitement explicite à écrire dans l’action de retrait :

```
removeMember() → 1. désassigner les tâches de ce membre dans cette org
                 2. supprimer le membership
```

Ne pas l’écrire donnerait des tâches assignées à quelqu’un qui n’a plus accès à l’organisation — le genre de détail qu’un relecteur attentif repère tout de suite.

---

# 3. Modèle de données

```text
organizations
  ├── memberships ──── auth.users (géré par Supabase)
  ├── invitations
  ├── templates
  │     └── template_steps
  └── journeys (un onboarding lancé)
        └── tasks
              ├── comments
              └── activity_events
```

## Tables

Toutes les tables ci-dessous ont **RLS activée sans policy** (décision 5).

### `organizations`
`id`, `name`, `slug`, `created_at`

### `memberships`
`id`, `organization_id` (FK cascade), `user_id` (FK `auth.users`), `role` (`admin` | `member`), `created_at`
→ contrainte d’unicité sur `(organization_id, user_id)`

### `invitations`
`id`, `organization_id` (FK cascade), `email`, `role`, `token` (unique), `invited_by` (FK users), `expires_at`, `accepted_at` (nullable), `created_at`
→ unicité sur `(organization_id, email)` tant que `accepted_at is null`
→ le token est un identifiant aléatoire long, jamais l’email ni l’id

### `templates`
`id`, `organization_id` (FK cascade), `name`, `description`, `target_type` (`employee` | `customer`), `is_archived`, `created_at`

### `template_steps`
`id`, `template_id` (FK cascade), `title`, `description`, `position` (int), `offset_days` (int, relatif au démarrage, peut être négatif), `default_assignee_id` (FK `auth.users`, nullable, `on delete set null`)

### `journeys`
`id`, `organization_id` (FK cascade), `template_id` (FK nullable, `on delete set null`), **`template_name`** (snapshot, non nul), `subject_name`, `subject_email`, `owner_id` (FK users), `start_date` (`date`), `status` (`active` | `completed` | `cancelled`), `created_at`, `completed_at`, `cancelled_at`

### `tasks`
`id`, `journey_id` (FK cascade), `title`, `description`, `assignee_id` (FK `auth.users`, nullable, `set null`), `position`, `due_date` (`date`), `status` (`todo` | `done` | `skipped`), `completed_at`, `completed_by`

### `comments`
`id`, `task_id` (FK cascade), `author_id` (FK users), `body`, `created_at`

### `activity_events`
`id`, `journey_id` (FK cascade), `task_id` (nullable), `actor_id`, `type`, `payload` (jsonb), `created_at`

Types d’événements : `journey_launched`, `journey_cancelled`, `task_completed`, `task_reopened`, `task_skipped`, `task_assigned`, `task_due_date_changed`, `comment_added`.

### `notification_logs`
`id`, `task_id` (FK cascade), `kind` (`assigned` | `due_soon` | `overdue`), `sent_on` (`date`), `created_at`
→ contrainte d’unicité sur `(task_id, kind, sent_on)` : **c’est ce qui empêche le cron d’envoyer 40 fois le même rappel.** À savoir expliquer.

**Décision produit sur les rappels** : la clé contenant `sent_on`, une tâche en retard génère **un rappel par jour** tant qu’elle n’est pas traitée. C’est voulu (c’est le but d’une relance), mais c’est un choix à assumer et à mentionner — la variante « un seul rappel définitif » consisterait à retirer `sent_on` de la clé.

## Index à créer (et à justifier)

| Index | Pourquoi |
|---|---|
| `memberships (user_id)` | À chaque requête, on résout l’org de l’utilisateur. La contrainte unique `(organization_id, user_id)` ne sert pas ici : sa colonne de tête n’est pas la bonne |
| `invitations (token)` | Recherche par token à l’acceptation |
| `tasks (journey_id, position)` | Affichage ordonné des tâches d’un onboarding |
| `tasks (assignee_id, status)` | Écran « mes tâches » |
| `tasks (due_date) where status = 'todo'` | Index partiel pour la détection des retards — le vrai bon exemple à montrer |
| `journeys (organization_id, status)` | Dashboard |

## Règles de suppression (à décider consciemment)

- supprimer une **organisation** → tout disparaît (`cascade`) ;
- un **template** ne se supprime pas, il s’archive — mais la FK est en `set null` par sécurité, et `template_name` garantit l’affichage ;
- supprimer un **journey** → ses tâches, commentaires et événements disparaissent (`cascade`) ;
- supprimer un **template** → ses étapes disparaissent (`cascade`) ;
- retirer un **membre** → ses tâches ne disparaissent pas, elles sont **désassignées par le code** (décision 7), pas par la base.

---

# 4. Écrans

```text
/login                          connexion (magic link)
/welcome                        création de l'organisation (première connexion, sans invitation)
/invitations/[token]            acceptation d'une invitation
/                               dashboard
/journeys                       liste des onboardings (recherche, filtres statut / responsable / retard, tri)
/journeys/new                   lancer un onboarding (template + personne + date + aperçu des échéances)
/journeys/[id]                  détail : progression, tâches, historique
/journeys/[id]?task=<id>        détail d'une tâche dans un panneau latéral (commentaires, réassignation)
/templates                      liste des templates
/templates/new                  création d'un template AVEC ses premières étapes
/templates/[id]                 édition du template et de ses étapes
/my-tasks                       mes tâches, groupées par échéance
/settings/members               membres, invitations en attente, invitation d'un collègue
```

Le nom `/welcome` est volontaire : appeler cette route `/onboarding` dans un produit dont le métier *est* l’onboarding rendrait le code illisible. Dans tout le projet, **« onboarding » = un journey pour une personne**, jamais l’accueil d’un nouvel utilisateur de LaunchPath.

## Le panneau de détail de tâche

Les commentaires sont attachés aux tâches, mais `/journeys/[id]` est une liste. Le détail s’ouvre dans un **`Sheet` shadcn piloté par l’URL** (`?task=<id>`), pas par un `useState` local.

Bénéfices concrets : le lien est partageable, le bouton retour du navigateur fonctionne, un rechargement de page conserve le panneau ouvert, et les commentaires se chargent côté serveur. C’est aussi une bonne démonstration de maîtrise des `searchParams`.

## Contenu du dashboard

1. 4 chiffres : onboardings actifs · tâches en retard · tâches dues dans les 7 prochains jours · onboardings terminés ce mois ;
2. liste des onboardings actifs avec barre de progression et prochaine échéance ;
3. bloc « tâches en retard » avec responsable et nombre de jours de retard ;
4. état vide soigné quand il n’y a encore rien (c’est le premier écran qu’un recruteur verra).

**Définition arrêtée** : « dues dans les 7 prochains jours » = `due_date` entre aujourd’hui et aujourd’hui + 7, et non « semaine calendaire ». Sinon le chiffre veut dire autre chose le lundi et le vendredi, et le test devient impossible à écrire. Cette définition va dans `docs/decisions.md`.

## États à traiter systématiquement

Pour **chaque** écran de liste : normal · vide · chargement (skeleton) · erreur.
Le sous-estimer est la différence la plus visible entre un projet de tutoriel et un projet crédible.

## Responsive : la règle est décidée maintenant

La liste des tâches d’un onboarding compte 6 colonnes (titre, responsable, échéance, statut, position, actions). Un tableau à 6 colonnes est illisible en 390 px.

→ **Tableau à partir de `md`, cartes empilées en dessous.** Un seul composant `TaskRow` avec deux rendus, décidé une fois, appliqué partout. Prendre cette décision en semaine 1 évite de reprendre tous les écrans en semaine 6.

## Retours d’action

Toute Server Action se termine par un retour visible : toast de succès, ou message d’erreur exploitable. Le système de toasts (`sonner`) est installé **en semaine 1**, avant la première action — le rajouter à la fin obligerait à repasser sur toutes les mutations.

---

# 5. Découpage semaine par semaine

Estimation totale : **54 à 67 heures**, soit **6 à 8 semaines** à 8-10 h/semaine.

Ce chiffre est plus élevé que les 35-50 h annoncées dans le plan global, pour trois raisons assumées : le flux d’invitation (sans lequel l’assignation n’est pas démontrable), la sécurisation RLS, et les corrections de fuseau horaire. C’est le prix d’un projet qui tient debout en production.

## Si le temps manque

Ordre de coupe recommandé, du moins coûteux au plus coûteux pour le portfolio :

1. **Pagination** — déjà hors MVP : 4 onboardings ne se paginent pas. Garder recherche et filtres, mentionner la pagination dans les limites.
2. **Commentaires sur les tâches** (−3 h) — SignalDesk en a déjà, donc la compétence est prouvée ailleurs. Garder le `Sheet` de détail pour la réassignation.
3. **Historique d’activité** (−3 h) — le moins visible en démo.
4. **Invitations → une seule personne par organisation** (−4 h) — **en dernier recours seulement**, et alors il faut l’écrire explicitement dans le README, parce que ça ampute le message principal du projet.

Ne jamais couper : le calcul d’échéances, le snapshot, RLS, le cron idempotent, les tests de permission.

---

## Semaine 0 — Cadrage (2 à 3 h)

**Objectif** : ne pas ouvrir un éditeur de code avant que le produit soit défini.

À produire :

```text
docs/product-brief.md      (section 1 de ce document, rédigée avec mes mots)
docs/screens.md            (section 4)
docs/data-model.md         (section 3 + le schéma des relations)
docs/decisions.md          (section 2 : une ligne par décision + le pourquoi)
docs/backlog.md            (section 6)
docs/journal.md            (initialisé, vide)
```

**Contenu de démonstration à écrire dès maintenant** — 3 templates réalistes qui serviront ensuite aux mocks, aux seeds, aux captures d’écran et aux tests.

Les responsables sont notés par rôle métier (IT, RH, Manager) pour la lisibilité, mais **le modèle stocke un utilisateur précis** : au seed, ces rôles seront mappés sur les 3 membres de l’organisation de démonstration. À noter dans `docs/decisions.md` pour ne pas se surprendre plus tard.

**Template 1 — Onboarding développeur (10 étapes)**

| Étape | Responsable | offset_days |
|---|---|---|
| Créer les comptes (Google, Slack, GitHub) | IT | -3 |
| Préparer le poste de travail | IT | -2 |
| Envoyer l’email de bienvenue et le programme | RH | -1 |
| Accueil et visite des locaux | RH | 0 |
| Signature des documents administratifs | RH | 0 |
| Installation de l’environnement de dev | Manager | 1 |
| Première mise en production accompagnée | Manager | 5 |
| Point de fin de première semaine | Manager | 5 |
| Formation sécurité et RGPD | RH | 10 |
| Bilan de fin de période d’essai | Manager | 30 |

**Template 2 — Onboarding client SaaS (8 étapes)** : kickoff, collecte des accès, import des données, configuration du compte, formation administrateur, formation utilisateurs, revue à 30 jours, passation au support.

**Template 3 — Onboarding commercial (7 étapes)** : accès CRM, formation produit, écoute d’appels, premier appel accompagné, objectifs du premier mois, revue à 30 jours, certification produit.

**Livrable** : les 6 fichiers `docs/` ci-dessus.

---

## Semaine 1 — Squelette navigable (8 à 10 h)

**Objectif** : une app locale qui *ressemble* déjà au produit, avec des données fictives typées.

Étapes :

1. initialiser Next.js (App Router, TypeScript strict, Tailwind) ;
2. nettoyer le boilerplate ;
3. installer et configurer shadcn/ui, **plus `sonner` pour les toasts** ;
4. créer l’arborescence :

```text
src/
  app/
    (auth)/login/
    (app)/                 layout applicatif protégé
      page.tsx             dashboard
      journeys/
      templates/
      my-tasks/
      settings/members/
  components/ui/           shadcn
  components/              partagés (StatusBadge, ProgressBar, EmptyState, PageHeader…)
  features/
    templates/
    journeys/
    tasks/
    members/
  lib/                     dates.ts, scheduling.ts, utils.ts, validation/
  server/                  db/, actions/, auth/, email/
  types/
  mocks/
```

5. layout applicatif : sidebar, topbar, navigation active, logo, responsive (sidebar en drawer sur mobile) ;
6. `src/lib/dates.ts` avec `today()` en `Europe/Paris` — **écrit maintenant**, avant tout affichage de date, pour que rien dans le projet n’appelle `new Date()` directement ;
7. types TypeScript du domaine dans `src/types/` ;
8. mocks typés dans `src/mocks/` à partir des 3 templates de la semaine 0 + 4 journeys à des stades différents (un qui démarre demain, un à mi-parcours, un avec 3 tâches en retard, un terminé) ;
9. écrans **en lecture seule** alimentés par les mocks : dashboard, liste des journeys, détail d’un journey, liste des templates ;
10. composants transverses : `StatusBadge`, `ProgressBar`, `DueDateBadge` (en retard / aujourd’hui / à venir), `EmptyState`, `PageHeader` ;
11. **appliquer la règle responsive** de la section 4 sur la liste des tâches : tableau ≥ `md`, cartes en dessous ;
12. mettre en place les scripts dans `package.json` :

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
}
```

`test` restera limité à Vitest. **Le parcours Playwright ne doit jamais entrer dans `verify`** : il a besoin d’un serveur lancé et d’une base réinitialisée, il vivra dans `test:e2e`.

**Notions travaillées** : App Router, layouts imbriqués, Server Components vs Client Components, `Suspense`, composition de composants, typage du domaine.

**Definition of done**
- [ ] `pnpm dev` démarre sans erreur, toutes les pages sont navigables
- [ ] responsive vérifié à 390 px : aucun débordement horizontal
- [ ] `pnpm verify` passe entièrement
- [ ] états vides présents partout
- [ ] aucun `new Date()` en dehors de `src/lib/dates.ts`
- [ ] entrée journal + sauvegarde — `jalon v0.1 — squelette navigable`

---

## Semaine 2 — Base de données, authentification et membres (10 à 12 h)

**Objectif** : une vraie base, de vrais comptes, et **plusieurs membres dans une organisation**.

Étapes :

1. démarrer la stack locale :

```bash
supabase init     # crée supabase/config.toml
# → appliquer immédiatement les 3 corrections de config (section « Mode de travail »)
supabase start    # Postgres, Auth, Studio, Inbucket (première fois : ~2 min de téléchargement)
supabase status   # URLs et clés locales à recopier dans .env.local
```

`54322` = Postgres, `54323` = Studio, `54324` = Inbucket, `54325` = SMTP. `supabase stop` en fin de session.

2. créer `.env.local` **et `.env.example`** (mêmes clés, valeurs vides) — le second servira de documentation et sera le seul fichier `.env` versionné à la phase 12 ;
3. installer Drizzle, déclarer le schéma (section 3), avec `pgSchema('auth')` en lecture seule pour référencer `auth.users` ;
4. générer la première migration et **lire le SQL produit avant de l’appliquer** ;
5. migration personnalisée qui active **RLS sur chaque table** (décision 5) — et prendre l’habitude de la mettre à jour à chaque nouvelle table ;
6. définir `pnpm db:reset` (décision 6) et vérifier qu’il reconstruit tout ;
7. brancher Supabase Auth : magic link, callback, `middleware.ts` qui protège `(app)`, helper `getCurrentUser()` — **le lien arrive dans Inbucket sur `localhost:54324`** ;
8. première connexion sans invitation → `/welcome` : création de l’organisation + `membership` `admin` ;
9. `getCurrentMembership()` → **toute requête part de là** ;
10. **flux d’invitation** :
    - `/settings/members` : liste des membres, liste des invitations en attente, formulaire d’invitation (email + rôle),
    - action `inviteMember()` : génération d’un token, insertion en base, envoi de l’email d’invitation,
    - `/invitations/[token]` : page publique qui valide le token (existant, non expiré, non accepté), demande la connexion, puis crée le `membership` et marque `accepted_at`,
    - action `removeMember()` : **désassignation des tâches puis suppression du membership** (décision 7),
    - garde-fous : seul un `admin` invite ou retire, et on ne peut pas retirer le dernier `admin` ;
11. `error.tsx`, `not-found.tsx`, retours d’erreur typés depuis les actions, toasts branchés ;
12. seed minimal : une organisation, 3 utilisateurs (dont un avec mot de passe pour les tests E2E), 3 memberships.

**Notions travaillées** : SQL et migrations, clés primaires et étrangères, relations 1-N, `on delete`, RLS, sessions et cookies, middleware, Server Actions, `revalidatePath`, tokens à usage unique, expiration.

**Piège à connaître** : une Server Action est un endpoint HTTP public. Elle doit **re-vérifier** l’authentification, l’appartenance à l’organisation **et le rôle** à chaque appel, même si l’UI est déjà protégée. C’est une question d’entretien classique.

**Definition of done**
- [ ] `pnpm db:reset` reconstruit une base complète et peuplée en une commande
- [ ] toutes les tables ont RLS activée — vérifié dans Studio, aucun avertissement « unrestricted »
- [ ] je peux créer un compte, une organisation, **inviter un second compte et le voir rejoindre l’organisation**
- [ ] un utilisateur d’une autre organisation ne voit rien de mes données (testé à la main avec 2 comptes)
- [ ] retirer un membre désassigne bien ses tâches
- [ ] `pnpm verify` passe
- [ ] entrée journal + sauvegarde + dumps SQL — `jalon v0.2 — base, auth et membres`

---

## Semaine 3 — Templates et éditeur d’étapes (8 à 10 h)

**Objectif** : créer de vrais templates dans l’application, et remplacer définitivement les mocks.

Étapes :

1. lectures Drizzle dans les Server Components → suppression des mocks de lecture ;
2. `/templates` : liste, état vide, archivage ;
3. `/templates/new` : **création du template et de ses 3 premières étapes dans le même écran** (créer un template vide puis naviguer ailleurs pour le remplir est frustrant et peu réaliste) ;
4. `/templates/[id]` : édition du nom, de la description, du type de cible ;
5. éditeur d’étapes : ajouter, éditer, supprimer, réordonner par boutons monter/descendre (le drag & drop est hors MVP) ;
6. gestion de `position` : recalcul cohérent après insertion, suppression et déplacement ;
7. `offset_days` avec valeurs négatives autorisées, et libellé explicite dans le formulaire (« 3 jours avant l’arrivée ») ;
8. assignation d’un responsable par défaut, choisi parmi **les membres de l’organisation** ;
9. schémas Zod partagés client/serveur : nom obligatoire, au moins une étape, `offset_days` entier borné ;
10. archivage : un template archivé n’apparaît plus dans la sélection au lancement, mais reste visible et consultable.

**Notions travaillées** : formulaires imbriqués (React Hook Form `useFieldArray`), validation partagée, gestion d’ordre, écritures multiples, `revalidatePath` ciblé.

**Definition of done**
- [ ] je peux créer un template complet de 10 étapes sans quitter l’écran de création
- [ ] réordonner puis recharger conserve l’ordre
- [ ] plus aucun mock utilisé par l’application
- [ ] les responsables proposés sont bien les membres de mon organisation
- [ ] `pnpm verify` passe
- [ ] entrée journal + sauvegarde — `jalon v0.3 — templates`

---

## Semaine 4 — Le cœur métier : lancer un onboarding (10 à 12 h)

**Objectif** : la fonctionnalité qui rend le projet intéressant.

Étapes :

1. `src/lib/scheduling.ts` : `addBusinessDays(startDate, offsetDays)`, fonction pure appliquant les règles de la décision 3 ;
2. tests Vitest **avant** utilisation : offset 0 un samedi, offset positif franchissant un week-end, offset négatif, franchissement de mois, franchissement d’année ;
3. Server Action `launchJourney({ templateId, subjectName, subjectEmail, ownerId, startDate })` :
   - vérifier auth + organisation + rôle,
   - valider avec Zod,
   - **dans une transaction** : créer le `journey` avec `template_name` snapshoté, copier chaque `template_step` en `task` avec sa `due_date` calculée et son `assignee_id`, écrire l’`activity_event` `journey_launched`,
   - rediriger vers le journey créé ;
4. `/journeys/new` : sélection du template avec aperçu des étapes, choix de la date, **prévisualisation des échéances calculées avant validation** (petit détail, gros effet en démo) ;
5. `/journeys/[id]` : en-tête (personne, `template_name`, dates, responsable), barre de progression, tâches groupées par semaine, badge de retard ;
6. cocher / décocher une tâche : mise à jour optimiste, `completed_at`, `completed_by`, `activity_event`, toast ;
7. **statut du journey recalculé dans les deux sens** : `completed` quand toutes les tâches sont `done` ou `skipped`, retour à `active` dès qu’une tâche est rouverte. Une seule fonction `recomputeJourneyStatus(journeyId)` appelée après chaque changement de tâche ;
8. action « ignorer une étape » (`skipped`) et action « annuler un onboarding » (`cancelled` + `cancelled_at`) — les deux statuts existent au schéma, ils doivent être atteignables depuis l’interface ;
9. panneau latéral de détail de tâche piloté par `?task=<id>` : description, réassignation, modification de l’échéance, commentaires ;
10. commentaires sur une tâche ;
11. timeline d’historique construite depuis `activity_events`.

**Notions travaillées** : transactions, écritures multi-tables, dérivation de données (progression, retard), `useOptimistic`, `searchParams` comme état d’interface, revalidation ciblée.

**Definition of done**
- [ ] lancer un onboarding génère N tâches aux bonnes dates, vérifiées à la main dans Studio
- [ ] archiver ou modifier le template après lancement ne change rien au journey, et le nom reste affiché
- [ ] rouvrir une tâche d’un onboarding terminé le repasse en cours
- [ ] annuler et ignorer sont accessibles depuis l’interface
- [ ] `?task=<id>` survit à un rechargement de page et au bouton retour
- [ ] tests de `scheduling.ts` verts
- [ ] entrée journal + sauvegarde — `jalon v0.4 — cœur métier fonctionnel`

---

## Semaine 5 — Dashboard, filtres et automatisation (8 à 10 h)

**Objectif** : le produit devient utile sans qu’on le regarde.

Étapes :

1. requêtes d’agrégation SQL pour le dashboard (comptages par statut, retards, échéances à 7 jours) — écrites en SQL/Drizzle, **pas** en filtrant un tableau JavaScript en mémoire ;
2. toutes les comparaisons de dates passent par `(now() AT TIME ZONE 'Europe/Paris')::date` (décision 2) ;
3. dashboard complet (section 4) ;
4. `/journeys` : recherche par nom, filtres statut / responsable / « en retard uniquement », tri par prochaine échéance — **état conservé dans l’URL** ;
5. `/my-tasks` : mes tâches groupées en retard / aujourd’hui / 7 prochains jours / plus tard ;
6. `src/server/email/send.ts` : **couche d’envoi abstraite**, c’est le point clé pour rester local sans dette technique :

```text
sendEmail({ to, subject, react })
```

En local, elle envoie via le SMTP d’Inbucket (`localhost:54325`, activé en semaine 2) avec `nodemailer`. Le jour de la mise en ligne, on remplace **uniquement le corps de cette fonction** par l’appel Resend. Aucun autre fichier ne change.

7. React Email + 4 templates : invitation (déjà utilisée en semaine 2, à mettre au propre), tâche assignée, rappel J-1, tâche en retard ;
8. `pnpm email:dev` (serveur de prévisualisation React Email) pour travailler le rendu sans rien envoyer ;
9. envoi de l’email d’assignation au lancement d’un onboarding, vérifié dans Inbucket ;
10. route `app/api/cron/reminders/route.ts` :
    - protégée par un secret (`CRON_SECRET` en header) — écrite dès maintenant, même sans Vercel,
    - sélectionne les tâches `todo` dues demain et les tâches en retard, avec un responsable assigné,
    - écrit dans `notification_logs` **avant** l’envoi pour garantir l’idempotence,
    - renvoie un résumé JSON : `{ dueSoon: n, overdue: n, sent: n, skipped: n }` ;
11. script de déclenchement manuel — **sans dépendance**, Node 22 charge les variables d’environnement nativement, ce qu’un `curl` dans un script npm ne fait pas :

```json
"reminders": "node --env-file=.env.local scripts/reminders.mjs"
```

Le script lit `CRON_SECRET` dans `process.env`, appelle la route et affiche le JSON.

12. vérifier l’idempotence : `pnpm reminders` deux fois de suite → la seconde exécution renvoie `sent: 0`.

**Notions travaillées** : agrégations SQL, `GROUP BY`, index utiles, dates et fuseaux en SQL, tâches planifiées, idempotence, sécurisation d’un endpoint machine, emails transactionnels.

**Piège à connaître** : sans `notification_logs`, chaque exécution du cron renvoie tous les rappels. Un cron doit toujours être conçu comme pouvant tourner deux fois.

**Definition of done**
- [ ] dashboard exact, vérifié à la main contre la base dans Studio
- [ ] filtres et recherche fonctionnels et conservés dans l’URL
- [ ] une tâche due aujourd’hui n’est **jamais** comptée en retard, y compris tôt le matin
- [ ] les 4 emails visibles et corrects dans Inbucket
- [ ] `pnpm reminders` lancé deux fois → `sent: 0` la seconde fois
- [ ] entrée journal + sauvegarde — `jalon v0.5 — dashboard et automatisation`

---

## Semaine 6 — Qualité et finalisation locale (8 à 10 h)

**Objectif** : montrer que je ne développe pas « jusqu’à ce que ça marche ».

### Tests (ciblés, ~18 tests utiles)

Vitest — logique pure :
- `addBusinessDays` : 5 cas (offset 0 un samedi, positif avec week-end, négatif, changement de mois, changement d’année) ;
- `today()` renvoie bien la date en `Europe/Paris` et non en UTC — **le test qui protège contre le bug le plus sournois du projet** ;
- calcul de progression d’un journey ;
- détection de retard, avec la frontière « dû aujourd’hui = pas en retard » ;
- schémas Zod : template sans étape rejeté, `offset_days` non entier rejeté, email invalide rejeté ;
- sélection des tâches du cron (dues demain / en retard / sans responsable ignorées).

Tests d’intégration sur une base de test :
- `launchJourney` : bon nombre de tâches, bonnes dates, `template_name` snapshoté, `activity_event` créé ;
- une action refuse un utilisateur d’une **autre organisation** → **le test de permission le plus important du projet** ;
- une action d’administration refuse un utilisateur `member` ;
- `removeMember` désassigne bien les tâches ;
- une invitation expirée est refusée ;
- deux exécutions du cron n’envoient qu’une fois.

Playwright (1 parcours end-to-end) :
- se connecter → créer un template de 3 étapes → le lancer → cocher une tâche → voir la progression à 33 %.

**Connexion dans le test : par mot de passe, pas par magic link.** Il n’existe pas d’OTP de test pour l’email dans la configuration Supabase (seulement pour le SMS) : passer par le magic link obligerait à interroger l’API d’Inbucket depuis le test. L’utilisateur de test créé au seed en semaine 2 se connecte en trois lignes.

`pnpm db:reset` avant la suite E2E pour partir d’un état connu. `test:e2e` reste **hors** de `verify`.

### Vérification complète

`pnpm verify` doit passer intégralement, en une commande, sans avertissement. C’est le futur contenu exact du workflow GitHub Actions : quand la CI arrivera, elle n’aura qu’une ligne à exécuter.

### Données de démonstration

Le seed final doit produire un état **intéressant à regarder** :
- 3 utilisateurs, 3 memberships, une invitation en attente ;
- 3 templates complets, dont un archivé ;
- 4 onboardings : un qui démarre demain, un à mi-parcours, un **avec 3 tâches en retard**, un terminé ;
- des commentaires et un historique déjà remplis.

Sans onboarding en retard, le dashboard est vide de sens. C’est ce seed qui servira aux captures d’écran et à la future base de production.

### Documentation locale

- `README.md` — structure de la section 21 du plan global, avec le schéma du modèle de données, une section « Décisions techniques » (snapshot, fuseau métier, RLS deny-all, idempotence du cron, source de vérité des migrations) et une section « Limites assumées » reprenant le hors-MVP ;
- `docs/setup.md` — relancer le projet de zéro : `supabase start`, les 3 corrections de `config.toml`, `.env.local` depuis `.env.example`, `pnpm db:reset`, `pnpm dev`. À écrire **et à tester** en suivant ses propres instructions, parce que c’est ce document qui évitera de perdre une soirée après trois semaines de pause ;
- captures dans `docs/screenshots/` : dashboard, détail d’un onboarding avec le panneau de tâche ouvert, éditeur de template, écran des membres, un email rendu ;
- un GIF de 15 secondes (Cmd+Shift+5 puis conversion) : lancer un onboarding → les tâches apparaissent avec leurs dates.

### Pitch

Pitch de 45 secondes (section 9) écrit et répété **à voix haute**, démo en local, trois minutes maximum.

**Definition of done**
- [ ] `pnpm verify` passe intégralement
- [ ] ~18 tests utiles verts + le parcours Playwright
- [ ] `pnpm db:reset` produit le jeu de démonstration complet
- [ ] `docs/setup.md` testé en repartant d’un dossier vide
- [ ] README complet avec captures et GIF
- [ ] pitch répété à voix haute
- [ ] sauvegarde complète + dumps SQL — `jalon v1.0 — projet complet en local`

---

# 6. Backlog local — `docs/backlog.md`

Pas de GitHub Issues pour l’instant : la même liste vit dans un fichier, avec des cases à cocher. Une ligne = une unité de travail terminable en une session.

Les préfixes (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) sont conservés volontairement : ce sont les messages de commit qui seront réutilisés le jour de la mise sous Git.

```text
#1  docs: cadrage produit, écrans, modèle de données, décisions
#2  chore: initialisation Next.js, Tailwind, shadcn, sonner
#3  feat: layout applicatif (sidebar, topbar, responsive)
#4  feat: helper de dates en fuseau métier Europe/Paris
#5  feat: écrans en lecture seule avec données fictives
#6  chore: stack Supabase locale et corrections de config.toml
#7  chore: schéma Drizzle, première migration, RLS deny-all
#8  chore: script db:reset (reset + migrate + seed)
#9  feat: authentification magic link et création d'organisation
#10 feat: invitation, acceptation et retrait de membres
#11 feat: liste et archivage des templates
#12 feat: création d'un template avec ses étapes
#13 feat: éditeur d'étapes (ordre, offsets, responsables)
#14 feat: calcul des échéances en jours ouvrés
#15 feat: lancement d'un onboarding et génération des tâches
#16 feat: page détail d'un onboarding et complétion des tâches
#17 feat: recalcul du statut d'un onboarding dans les deux sens
#18 feat: annulation d'un onboarding et étapes ignorées
#19 feat: panneau de détail de tâche piloté par l'URL
#20 feat: commentaires et historique d'activité
#21 feat: dashboard et métriques SQL
#22 feat: recherche, filtres et tri des onboardings
#23 feat: écran mes tâches
#24 feat: couche d'envoi d'email et templates React Email
#25 feat: route de rappels idempotente et script pnpm reminders
#26 test: tests unitaires (dates, échéances, Zod)
#27 test: tests d'intégration (lancement, permissions, invitations)
#28 test: parcours end-to-end Playwright
#29 chore: seed de démonstration complet
#30 docs: README, setup.md, captures et pitch
```

Différé jusqu’à la décision de mise en ligne (section 12) : Git, GitHub, CI, Vercel, Supabase cloud, Resend, Sentry.

---

# 7. Les pièges spécifiques à ce projet

| Piège | Symptôme | Solution |
|---|---|---|
| **RLS oubliée** | Rien en local. En production, toutes les tables lisibles et modifiables via l’API REST et la clé anon publique | RLS activée sans policy sur **chaque** table, y compris les nouvelles |
| **Deux systèmes de migrations** | `supabase db reset` produit une base incomplète, sans erreur | Drizzle propriétaire du schéma applicatif, Supabase du schéma `auth`, enchaînés dans `db:reset` |
| **Fuseau horaire** | Une tâche due aujourd’hui apparaît en retard entre minuit et 2 h du matin | Type `date` **et** fuseau métier fixe : un seul `today()`, un seul `AT TIME ZONE` |
| **Redirect URL du magic link** | Le lien de connexion mène à une erreur ou ne connecte pas | `site_url` et `additional_redirect_urls` en `http://localhost:3000` |
| **SMTP local désactivé** | L’envoi d’email échoue silencieusement ou refuse la connexion | Décommenter `smtp_port = 54325` dans `[inbucket]` |
| **Variables d’environnement dans un script npm** | La route de cron répond 401 alors que le secret est bien dans `.env.local` | `node --env-file=.env.local`, les scripts npm ne chargent aucun fichier `.env` |
| **Magic link dans un test E2E** | Le test ne peut pas se connecter, pas d’OTP de test pour l’email | Utilisateur de test avec mot de passe créé au seed |
| **Server Action non protégée** | N’importe qui peut cocher les tâches d’une autre organisation | Re-vérifier auth + organisation + rôle **dans** chaque action |
| **Cron non idempotent** | 12 emails de rappel pour la même tâche | `notification_logs` avec contrainte d’unicité |
| **Agrégations en JavaScript** | Le dashboard charge toutes les tâches pour en compter 3 | `COUNT` / `GROUP BY` en SQL |
| **Template lié au lieu d’être copié** | Modifier un template change les onboardings passés | Snapshot des étapes **et** du nom au lancement |
| **Organisation à un seul membre** | Impossible de démontrer l’assignation, le cœur du produit | Flux d’invitation dès la semaine 2 |
| **Membre retiré, tâches orphelines** | Des tâches assignées à quelqu’un qui n’a plus accès | Désassignation explicite dans `removeMember()` |
| **Statuts inatteignables** | `cancelled` et `skipped` existent en base sans action pour les produire | Actions d’annulation et d’étape ignorée dans l’interface |
| **Tableau à 6 colonnes sur mobile** | Débordement horizontal, projet qui paraît bâclé | Tableau ≥ `md`, cartes en dessous, décidé en semaine 1 |
| **Base de démo vide** | Le recruteur ouvre la démo et ne voit rien | Seed avec 4 onboardings dont un en retard |

---

# 8. Questions d’entretien auxquelles ce projet doit permettre de répondre

1. Pourquoi as-tu copié les étapes du template en tâches plutôt que de faire une jointure ?
2. Pourquoi avoir aussi copié le nom du template ?
3. Comment calcules-tu une échéance ? Comment gères-tu les week-ends ?
4. Pourquoi `date` et pas `timestamp` — et pourquoi ça ne suffit pas ?
5. Où est défini « aujourd’hui » dans ton projet, et pourquoi à un seul endroit ?
6. Pourquoi as-tu activé RLS alors que tu n’écris aucune policy ?
7. Comment garantis-tu qu’un utilisateur ne voit pas les données d’une autre organisation ?
8. Une Server Action est-elle sécurisée par défaut ? Pourquoi non ?
9. Qu’est-ce qui se passe si ton cron tourne deux fois dans la même journée ?
10. Pourquoi une transaction au lancement d’un onboarding ?
11. Tu as deux outils de migration dans le projet : lequel est propriétaire de quoi, et pourquoi ?
12. Quels index as-tu créés, et pourquoi celui sur `memberships (user_id)` alors qu’il existe déjà une contrainte unique ?
13. Qu’as-tu choisi de ne pas construire, et pourquoi ?
14. Quelle différence d’architecture avec SignalDesk, et qu’est-ce que tu préfères ?

Si une réponse n’est pas claire, c’est le signe qu’il faut ralentir sur cette partie du code, pas avancer.

---

# 9. Pitch recruteur (45 secondes, à retravailler à la fin)

> LaunchPath est un outil interne d’onboarding que j’ai construit en Next.js fullstack avec TypeScript et PostgreSQL.
>
> On y crée des templates d’onboarding avec des étapes, des responsables et des délais relatifs. Quand on lance un onboarding pour une nouvelle recrue, l’application génère automatiquement les tâches avec des échéances calculées en jours ouvrés à partir de la date d’arrivée, assigne chaque étape au bon membre de l’équipe, lui envoie un email, et un cron quotidien relance les tâches en retard.
>
> Deux choses m’ont particulièrement appris quelque chose. La première, je copie les étapes du template au lancement plutôt que de les référencer : ça garantit qu’un onboarding en cours n’est pas modifié si le template change. La seconde, les échéances sont des jours civils, donc j’ai dû définir un fuseau métier unique — sinon une tâche due aujourd’hui apparaissait en retard entre minuit et deux heures du matin.
>
> C’est aussi le projet où j’ai utilisé Next.js en fullstack, alors que sur SignalDesk j’avais séparé le front et une API Rails — je peux comparer les deux approches.

---

# 10. Critères pour considérer LaunchPath terminé (en local)

- [ ] `supabase start` + `pnpm db:reset` + `pnpm dev` suffisent à obtenir une app complète et peuplée
- [ ] toutes les tables ont RLS activée, sans exception
- [ ] authentification, création d’organisation, invitation et retrait de membres opérationnels
- [ ] données strictement isolées par organisation, et rôle `admin` respecté
- [ ] création d’un template complet avec étapes, responsables et délais
- [ ] lancement d’un onboarding générant les tâches aux bonnes dates
- [ ] complétion, réouverture, étape ignorée, annulation : les quatre chemins fonctionnent
- [ ] progression et retards exacts, y compris à minuit passé
- [ ] dashboard avec métriques calculées en SQL
- [ ] recherche et filtres conservés dans l’URL
- [ ] panneau de détail de tâche partageable et rechargeable
- [ ] commentaires et historique
- [ ] les 4 emails corrects et visibles dans Inbucket
- [ ] rappels idempotents (`pnpm reminders` deux fois → `sent: 0`)
- [ ] ~18 tests utiles + 1 parcours Playwright
- [ ] `pnpm verify` passe intégralement
- [ ] responsive vérifié à 390 px
- [ ] README complet avec captures, GIF, architecture, modèle de données, décisions et limites
- [ ] `docs/setup.md` testé
- [ ] démo réalisable en moins de 3 minutes
- [ ] les 14 questions de la section 8 ont une réponse claire

---

# 11. Prochaine action concrète

Rédiger `docs/product-brief.md` avec mes propres mots à partir de la section 1, puis écrire les 3 templates de démonstration en entier (titre, responsable, `offset_days`, description d’une phrase par étape).

Ces trois templates serviront ensuite aux mocks, aux seeds, aux captures et aux tests : les écrire correctement une fois évite de réinventer des données à chaque étape.

Ensuite seulement : initialiser Next.js en local.

---

# 12. Phase de mise en ligne — le jour où je le décide

Cette phase est **volontairement repoussée**. Elle ne se déclenche que sur ma décision, une fois le projet terminé en local. Estimation : **5 à 7 heures**, en une ou deux sessions.

Elle est courte parce que les semaines 1 à 6 ont été construites pour ça : la stack locale est identique à la stack cloud, et les seuls points de contact avec l’extérieur (emails, cron) sont isolés derrière une fonction et une route.

**Identité à préparer avant de commencer** : une adresse email personnelle et durable, et le compte GitHub qui figurera sur le CV. C’est ce compte que les recruteurs consulteront — autant que ce soit le bon dès le premier commit. Les comptes Supabase, Vercel et Resend sont tous transférables ensuite (sauf Resend, à recréer en 30 minutes), mais autant ne pas avoir à le faire.

## Ordre des opérations

### 1. Git et GitHub (1 h)

- `git init` ;
- `.gitignore` : `node_modules`, `.next`, `supabase/.temp`, `docs/backups/`, et surtout :

```gitignore
.env*
!.env.example      # sans cette ligne, .env* exclut aussi le fichier d'exemple
```

- **relire le diff complet avant le premier commit** : aucune clé, aucun token, aucun mot de passe de démonstration en dur ;
- premier commit `chore: initial commit — LaunchPath v1.0` ;
- repo GitHub : nom, description, topics, README affiché ;
- puis, pour les 2 ou 3 dernières fonctionnalités restantes, travailler en branches + Pull Requests afin d’avoir un historique réel et démontrable.

### 2. Base de données cloud (1 h 30)

- créer le projet Supabase cloud ;
- appliquer les migrations Drizzle sur la base distante — les mêmes fichiers SQL, déjà éprouvés en local ;
- **vérifier dans Studio que chaque table affiche RLS activée.** Toute table marquée « unrestricted » est publiquement lisible via la clé anon : c’est le point de contrôle le plus important de cette phase ;
- exécuter le seed de démonstration ;
- configurer `Site URL` et `Redirect URLs` de l’auth sur le domaine de production (même piège qu’en local, à l’envers).

### 3. Emails réels (30 min)

- compte Resend, clé API ;
- remplacer le corps de `src/server/email/send.ts` par l’appel Resend — **un seul fichier modifié** ;
- envoi de test vérifié sur une vraie adresse ;
- attention : sans domaine vérifié, Resend n’autorise l’envoi que vers sa propre adresse. Pour une démo, envoyer les invitations vers soi-même suffit.

### 4. Déploiement (1 h)

- projet Vercel connecté au repo ;
- variables d’environnement : `DATABASE_URL`, clés Supabase, `RESEND_API_KEY`, `CRON_SECRET` ;
- `vercel.ts` avec le cron quotidien pointant sur `/api/cron/reminders` ;
- **Vercel Cron s’exécute en UTC** : `0 7 * * *` tombe à 9 h en heure d’hiver et 8 h en heure d’été côté Paris. Choisir l’heure en connaissance de cause, et noter la raison en commentaire ;
- build vérifié, premier déploiement.

### 5. CI (30 min)

- workflow GitHub Actions qui exécute `pnpm verify` sur chaque Pull Request ;
- badge de CI dans le README.

### 6. Vérification en production (1 h 30)

À refaire à la main sur l’URL publique : connexion → invitation d’un second compte → création d’un template → lancement d’un onboarding → complétion d’une tâche → dashboard → filtres → réception d’un email → déclenchement manuel du cron → affichage mobile.

Et un test de sécurité explicite, avec la clé anon publique :

```bash
curl "https://<projet>.supabase.co/rest/v1/tasks?select=*" \
  -H "apikey: <clé anon>"
```

La réponse **doit** être vide ou refusée. Si des données sortent, RLS n’est pas active quelque part.

### 7. Finalisation portfolio (30 min)

- lien de démo et identifiants de démonstration dans le README ;
- captures remplacées par des captures de production si nécessaire ;
- Sentry si souhaité ;
- pitch relu avec l’URL en main.

## Definition of done de la mise en ligne

- [ ] aucun secret dans l’historique Git
- [ ] `.env.example` présent et à jour, aucun autre `.env` versionné
- [ ] la requête `curl` avec la clé anon ne renvoie aucune donnée
- [ ] URL publique fonctionnelle avec compte de démonstration
- [ ] invitation et emails réellement reçus
- [ ] cron planifié, heure UTC assumée, exécution vérifiée
- [ ] CI verte, badge affiché
- [ ] README avec lien de démo
