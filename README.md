# LaunchPath

[![Verify](https://github.com/aicha-btn/launch-path/actions/workflows/verify.yml/badge.svg)](https://github.com/aicha-btn/launch-path/actions/workflows/verify.yml)

**Des parcours d'intégration qui se suivent tout seuls.**
Créez un parcours type une fois, lancez-le pour une nouvelle recrue, et les
échéances, les responsables et les retards se gèrent d'eux-mêmes.

> Projet de portfolio. Application complète et fonctionnelle en local ;
> aucun service commercial n'existe derrière, et les tarifs affichés sur la
> page publique sont illustratifs.

---

## Le problème

Dans une petite structure, un onboarding vit dans un template Notion dupliqué à
la main, des relances Slack et un tableau de suivi. Trois conséquences :

1. **Le modèle se perd** — chaque intégration est une copie ; les améliorations
   trouvées en route ne remontent jamais dans le modèle de référence.
2. **Les échéances glissent** — « la première semaine » n'est pas une date.
3. **Personne n'a de vue d'ensemble** — répondre à « où en sont les quatre
   intégrations en cours ? » demande d'ouvrir quatre documents.

## La solution

Un parcours type porte des étapes, chacune avec un responsable et un **délai
relatif** (« 3 jours avant l'arrivée », « fin de première semaine »). Au
lancement, LaunchPath copie ces étapes en tâches et calcule chaque échéance
**en jours ouvrés** à partir de la date d'arrivée. Chaque responsable reçoit un
email, et un rappel quotidien relance les tâches en retard.

---

## Fonctionnalités

- **Parcours types réutilisables** — étapes ordonnées, responsables par défaut,
  délais relatifs positifs ou négatifs, archivage
- **Lancement en trente secondes** — avec prévisualisation des échéances
  calculées **avant** validation
- **Suivi** — progression en folios numérotés, tâches groupées par semaine,
  complétion optimiste, étapes ignorables, annulation et réactivation
- **Panneau de détail piloté par l'URL** — réassignation, échéance,
  commentaires ; le lien est partageable et le bouton retour fonctionne
- **Historique** — qui a fait quoi, quand
- **Dashboard** — quatre métriques calculées en SQL, parcours actifs, retards
- **Recherche, filtres et tri** — entièrement dans l'URL, sans JavaScript
- **Équipe** — invitation par email, acceptation par jeton, retrait avec
  désassignation
- **Rappels automatiques** — la veille de l'échéance, puis chaque jour de retard

Volontairement hors périmètre : dépendances entre étapes, intégrations
Calendar et Slack, pièces jointes, pagination, multi-organisation.

---

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16, App Router, React 19, TypeScript strict |
| Base | PostgreSQL (Supabase), **Drizzle ORM** |
| Auth | Supabase Auth — magic link, mot de passe pour les tests |
| Style | Tailwind CSS 4, design system maison |
| Emails | nodemailer vers la boîte locale ; Resend prévu en production |
| Tests | Vitest (unitaire et intégration), Playwright (1 parcours) |

---

## Architecture

```
Navigateur
    │
    ├── (marketing)  page publique
    └── (app)        écrans protégés par proxy.ts
                          │
              Server Components  ─── lecture ──┐
              Server Actions     ─── écriture ─┤
                          │                    │
                    src/server/db/queries   (toutes scopées par organisation)
                          │
                     PostgreSQL  ── RLS deny-all
                          │
                     schéma auth ── géré par Supabase
```

Deux couches de données, séparées volontairement :

- **Supabase Auth** répond uniquement à « qui est connecté ? »
- **Drizzle** lit et écrit les données métier avec le rôle `postgres`

---

## Modèle de données

```
organizations
  ├── memberships ──── auth.users (Supabase)
  ├── invitations
  ├── templates
  │     └── template_steps
  └── journeys
        └── tasks
              ├── comments
              └── activity_events

notification_logs  ── unicité (task_id, kind, sent_on)
```

Dix tables. Index notable : **`tasks (due_date) where status = 'todo'`** — un
index partiel qui sert les trois requêtes de retard du dashboard, le filtre
« en retard uniquement » et la sélection du cron.

---

## Décisions techniques

Sept décisions, chacune prise pour une raison qu'on peut expliquer.

### 1. Le lancement copie, il ne référence pas

Lancer un onboarding **copie** les étapes du parcours type en tâches, y compris
le nom du parcours type (`journeys.template_name`).

Modifier un parcours type ne touche donc pas aux onboardings en cours — c'est
le bon comportement métier : on ne réécrit pas l'historique d'une intégration
commencée. Et la page de détail continue d'afficher de quoi il s'agit même
après archivage du modèle.

### 2. Une échéance est un jour civil, pas un instant

Colonnes `date`, jamais `timestamp`. Mais ça ne règle que la moitié du
problème : il reste à définir **« aujourd'hui »**.

`CURRENT_DATE` dépend du fuseau de la session Postgres, en pratique UTC. À
00h30 à Paris, il est encore la veille en UTC — une tâche due la veille
n'apparaîtrait pas en retard avant 2 h du matin.

D'où un fuseau métier unique et **un seul point de vérité** :
`today()` dans `src/lib/dates.ts`, `(now() at time zone 'Europe/Paris')::date`
en SQL. Aucun `new Date()` ailleurs dans le projet.

### 3. Le calcul d'échéance est une fonction pure

`addBusinessDays(startDate, offsetDays)` : pas de base, pas d'horloge, pas de
fuseau. **14 tests unitaires**, écrits avant l'implémentation.

Elle sert aussi à l'aperçu côté client — donc une seule implémentation des
règles, et aucun risque que l'aperçu montre autre chose que ce qui sera écrit.

### 4. Toute lecture part de l'organisation

Chaque fonction de `src/server/db/queries/` exige un `organizationId`. Il
n'existe pas de fonction capable de lire sans organisation : l'oubli est
structurellement impossible.

### 5. RLS activée en deny-all sur toutes les tables

Supabase expose automatiquement une API REST sur le schéma `public`, et la clé
anon est publique par nature — elle part dans le bundle navigateur.

Sans RLS, n'importe qui lit et écrit `journeys` ou `memberships` via
`/rest/v1/`, en contournant toute la couche serveur. **Et ça ne se voit pas en
local** : le problème n'apparaîtrait qu'au déploiement.

Chaque table active donc RLS **sans aucune policy** — un refus total pour
`anon` et `authenticated`. L'application fonctionne parce que le serveur se
connecte avec le rôle propriétaire, qui contourne RLS.

`pnpm db:audit` vérifie mécaniquement qu'aucune table n'a été oubliée, et il
est enchaîné dans `pnpm db:reset`.

### 6. Une seule source de vérité pour les migrations

Drizzle possède le schéma applicatif, Supabase possède le schéma `auth`.

La table `auth.users` est déclarée dans un fichier séparé et **jamais
ré-exportée** depuis `schema.ts` : drizzle-kit collecte les tables via les
exports, et l'exporter générait un `CREATE TABLE "auth"."users"` qui aurait
écrasé la table de connexion. `schemaFilter` ne protège pas — il ne filtre que
l'introspection.

### 7. Retirer un membre désassigne explicitement ses tâches

`tasks.assignee_id` référence `auth.users`, pas `memberships` : supprimer un
membership ne déclenche donc aucun `on delete set null`. La désassignation est
un traitement écrit dans `removeMember()`, en transaction — sinon on garderait
des tâches assignées à quelqu'un qui n'a plus accès.

---

## Sécurité

- **Une Server Action est un endpoint HTTP public.** `proxy.ts` protège les
  pages, pas les données : chaque action re-vérifie session, organisation et
  rôle. Les identifiants reçus d'un formulaire — responsable, pilote — sont
  validés contre les membres de l'organisation, jamais acceptés tels quels.
- **`?suivant=` est validé** : seuls les chemins commençant par `/` sont
  acceptés, sinon la page de connexion devient une redirection ouverte.
- **Le cron est protégé par un secret** et ne renvoie que des compteurs.
- **Les états ne dépendent pas de la couleur** : le retard est signalé par un
  aplat rouge **et** le mot « retard ».

---

## Tests

```bash
pnpm test       # 14 tests unitaires — aucune dépendance
pnpm test:db    # 18 tests d'intégration — base requise
pnpm test:e2e   # 1 parcours end-to-end — base + serveur
```

**Unitaires** — `addBusinessDays` : décalage nul un samedi, franchissement de
week-end, décalage négatif, changements de mois et d'année, année bissextile,
date mal formée.

**Intégration** — vraie base, vraies transactions, vraies contraintes. Session
et envoi d'email simulés, ce qui permet d'affirmer *combien* d'emails partent
et *à qui*. Deux organisations sont créées pour vérifier l'isolation :
lancement depuis un parcours type étranger, complétion d'une tâche étrangère,
commentaire sur une tâche étrangère, réassignation à un utilisateur extérieur.

Le test d'isolation a été **validé par mutation** : retirer le filtre par
organisation dans `launchJourney` le fait échouer.

**End-to-end** — connexion, création d'un parcours type de trois étapes,
lancement, complétion d'une étape, progression vérifiée, historique vérifié.
Connexion par mot de passe : il n'existe pas d'OTP de test pour l'email dans
Supabase.

---

## Difficultés rencontrées

**La migration qui allait écraser l'authentification.** La première migration
générée contenait `CREATE TABLE "auth"."users"`. Lue avant d'être appliquée —
d'où la décision 6.

**Drizzle réécrit le SQL brut dans son constructeur relationnel.** Dans
`db.query.x.findMany`, un fragment `sql` référençant `${tasks.journeyId}`
devenait `"journeys"."journey_id"` : erreur Postgres 42703. Corrigé en SQL
littéral avec des alias explicites.

**`loading.tsx` empêche un vrai 404.** Un `loading.tsx` crée une frontière
Suspense : la réponse part en flux avec un 200 déjà écrit, et `notFound()` ne
peut plus le corriger. Vérifié par test. Arbitrage assumé — l'application est
derrière une authentification, aucun robot ne l'indexe.

**Recharger juste après un clic annule l'action en vol.** Le premier jet du
test end-to-end rechargeait la page dès que le bouton changeait de libellé —
or ce changement vient de la mise à jour optimiste, pas du serveur.

**Un test qui passait sans rien tester.** Le test d'invitation expirée
simulait un utilisateur « sans organisation » avec un objet dont
`organizationId` valait `""` — donc truthy. L'action redirigeait vers le
dashboard avant d'atteindre la vérification d'expiration. Réécrit.

Détail complet dans [`docs/journal.md`](docs/journal.md).

---

## Design system

Direction assumée : **brutalisme éditorial**. Le produit ressemble à un
document imprimé plutôt qu'à un dashboard.

- **Quatre encres, un rôle exclusif chacune** — noir (texte et filets), bleu
  offset (identité, structure, action), jaune signal (emphase, en aplat
  uniquement), rouge de correction (**ce qui requiert une attention** : le
  retard, une erreur de saisie, une action destructive — et rien d'autre)
- **Aucun angle arrondi, aucune ombre** — l'élévation s'exprime par
  l'épaisseur du filet
- **Les états sont des marques typographiques** — une tâche faite est barrée,
  une échéance proche est soulignée, un retard est tamponné
- **Trois familles typographiques, rôles exclusifs** — Instrument Serif
  (affichage, jamais sous 28 px), Archivo (interface), IBM Plex Mono (dates,
  compteurs, libellés)

Spécification complète : [`docs/design-system.md`](docs/design-system.md).

---

## Installation

Voir [`docs/setup.md`](docs/setup.md) — prérequis, corrections de
`config.toml`, commandes, problèmes connus.

```bash
pnpm install
supabase start
pnpm db:reset
pnpm dev          # http://localhost:3200
```

Compte de démonstration : `manon@atelier-novembre.test` / `launchpath2026`,
ou le bouton « Entrer avec le compte de démonstration » sur `/login`.

---

## Améliorations futures

Étapes conditionnelles et dépendances entre tâches · intégrations Google
Calendar et Slack · pièces jointes · pagination des listes · parcours types
partagés entre organisations · éditeur d'étapes en glisser-déposer · rôles
fins · plusieurs organisations par utilisateur · jours fériés dans le calcul
des échéances · React Email à la place du HTML inline.

---

## Documentation

| Fichier | Contenu |
|---|---|
| [`docs/setup.md`](docs/setup.md) | Installation, commandes, problèmes connus |
| [`docs/design-system.md`](docs/design-system.md) | Direction artistique et tokens |
| [`docs/plan_action_launchpath.md`](docs/plan_action_launchpath.md) | Plan de construction et décisions |
| [`docs/journal.md`](docs/journal.md) | Journal de bord — appris, bloqué, décidé |
| [`docs/backlog.md`](docs/backlog.md) | Suivi des tâches |
