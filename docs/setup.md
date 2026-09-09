# Installation et reprise du projet

Ce document existe pour une raison précise : **reprendre LaunchPath après trois
semaines sans y toucher, sans perdre une soirée.** Il est écrit pour être suivi
à la lettre, dans l'ordre.

---

## Prérequis

| Outil | Version utilisée | Vérification |
|---|---|---|
| Node | 22 | `node -v` |
| pnpm | 11 | `pnpm -v` |
| Docker | Colima ou Docker Desktop | `docker ps` |
| Supabase CLI | **2.98** — ne pas mettre à jour | `supabase --version` |

**Ne pas mettre à jour la CLI Supabase en cours de projet.** Les clés de
`config.toml` changent entre versions majeures, et les corrections décrites
plus bas ne s'appliqueraient plus telles quelles.

Si Docker tourne via Colima et que `docker ps` échoue avec
« Cannot connect to the Docker daemon » alors que `colima list` affiche
« Running », le socket est périmé :

```bash
colima restart
```

---

## Démarrage

```bash
pnpm install
supabase start        # Postgres, Auth, Studio, boîte mail — dans Docker
pnpm db:reset         # reset → migrations → seed → audit RLS
pnpm dev              # http://localhost:3200
```

### Services locaux

| Service | Adresse |
|---|---|
| Application | http://localhost:3200 |
| API Supabase | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio (interface base) | http://localhost:54323 |
| **Boîte mail locale** | http://localhost:54324 |
| SMTP local | port 54325 |

`supabase stop` libère les ressources en fin de session. Les données survivent.

### Compte de démonstration

```
manon@atelier-novembre.test  /  launchpath2026
```

Accessible aussi en un clic depuis `/login`, bouton
« Entrer avec le compte de démonstration ».

---

## Variables d'environnement

Copier `.env.example` vers `.env.local`, puis remplir avec les valeurs de
`supabase status -o env` :

```bash
cp .env.example .env.local
supabase status -o env | grep -E 'API_URL|ANON_KEY|DB_URL'
```

| Clé | Rôle |
|---|---|
| `DATABASE_URL` | Connexion directe à Postgres (Drizzle et serveur) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client d'authentification |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Idem — **publique par nature** |
| `CRON_SECRET` | Protège la route de rappels |

Le projet **n'utilise pas** de clé `service_role`. Les utilisateurs de test
sont créés par l'inscription publique, ce qui évite d'avoir un secret de plus
à gérer.

---

## Les quatre corrections de `supabase/config.toml`

Elles sont déjà appliquées dans le dépôt. Elles sont documentées ici parce
qu'elles seraient à refaire sur une machine neuve après `supabase init`, et
que chacune coûte une soirée si on ne sait pas.

### 1. Port SMTP désactivé

```toml
[inbucket]
smtp_port = 54325   # commenté par défaut → l'envoi d'email échoue
```

### 2. URLs de redirection

Les défauts sont en `127.0.0.1` **et en https**, alors que le serveur de
développement sert `http://localhost:3200`. Supabase Auth ne considère pas
`localhost` et `127.0.0.1` comme équivalents : le lien de connexion est refusé.

```toml
site_url = "http://localhost:3200"
additional_redirect_urls = ["http://localhost:3200/**", "http://127.0.0.1:3200/**"]
```

### 3. Analytique désactivée

```toml
[analytics]
enabled = false
```

Le conteneur `vector` de la pile analytique monte le socket Docker, ce que
virtiofs (Colima) refuse : `operation not supported`. L'analytique locale n'a
aucune utilité ici — les logs se lisent avec `docker logs`.

### 4. Port de l'application

LaunchPath tourne sur **3200**, pas 3000. Le port 3000 est souvent occupé par
un autre projet, et l'auto-incrémentation de Next (3001, 3002…) casserait la
configuration d'authentification à chaque fois.

---

## Commandes

### Développement

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur sur le port 3200 |
| `pnpm db:reset` | Reconstruit tout : reset, migrations, seed, audit RLS |
| `pnpm db:studio` | Interface Drizzle sur le schéma |
| `pnpm reminders` | Déclenche les rappels quotidiens à la main |

### Base de données

| Commande | Effet |
|---|---|
| `pnpm db:generate` | Génère une migration depuis le schéma TypeScript |
| `pnpm db:migrate` | Applique les migrations |
| `pnpm db:audit` | **Vérifie que chaque table a RLS activée** |

### Vérification

| Commande | Dépendances | Dans `verify` |
|---|---|---|
| `pnpm verify` | aucune | — |
| `pnpm test` | aucune | oui |
| `pnpm test:db` | base lancée | non |
| `pnpm test:e2e` | base + serveur | non |

`pnpm verify` = `lint` + `typecheck` + `test` + `build`. Il ne dépend ni de
Docker ni d'un serveur : c'est ce qui le rend exécutable partout et vite.
C'est aussi le contenu exact du futur workflow de CI.

---

## Après une migration

Toute nouvelle table doit être ajoutée à la migration RLS. Sans ça, elle est
publiquement lisible via l'API REST auto-générée de Supabase et la clé anon.

```bash
pnpm db:generate --custom --name=enable_rls_<table>
# écrire : alter table "<table>" enable row level security;
pnpm db:migrate
pnpm db:audit     # doit afficher « Toutes les tables sont protégées »
```

`pnpm db:audit` est enchaîné dans `db:reset` : impossible d'ajouter une table
non protégée sans le voir.

---

## Sauvegardes

Une fois par semaine, ou avant toute migration risquée :

```bash
mkdir -p docs/backups
supabase db dump --local -f docs/backups/$(date +%F)-schema.sql
supabase db dump --local --data-only -f docs/backups/$(date +%F)-data.sql
```

**Le flag `--local` est obligatoire** : sans lui, la commande cible le projet
distant (`--linked` vaut `true` par défaut) et échoue.

---

## Problèmes connus

| Symptôme | Cause | Solution |
|---|---|---|
| `Cannot connect to the Docker daemon` | socket Colima périmé | `colima restart` |
| `failed to start docker container "supabase_vector"` | virtiofs refuse le montage du socket | analytique désactivée dans `config.toml` |
| Le lien de connexion ne connecte pas | `site_url` en `127.0.0.1` ou https | correction 2 |
| L'envoi d'email échoue | `smtp_port` commenté | correction 1 |
| `pnpm reminders` répond 401 | les scripts npm ne lisent pas `.env` | déjà réglé : `node --env-file=.env.local` |
| `pnpm typecheck` échoue sur `.next/types` après suppression d'une page | types de routes en cache | relancer `pnpm build` |
| Un port autre que 3200 est utilisé | un autre projet occupe 3200 | libérer le port : la config d'auth en dépend |
| **Squelette de chargement infini, la page ne s'affiche jamais** | `[Server HMR] TurbopackInternalError: Cell … no longer exists` — `pnpm build` a tourné **pendant** que `pnpm dev` était lancé, et les deux partagent `.next` | arrêter le serveur, `mv .next /tmp/`, relancer `pnpm dev`. **Ne jamais lancer `build` et `dev` en même temps** |
| Connecté sur un hôte, déconnecté sur l'autre | `localhost` et `127.0.0.1` ont des cookies **séparés** | utiliser `localhost:3200`, l'adresse canonique — c'est elle qui est dans `site_url` |
| Une URL avec un identifiant bricolé donnait une erreur serveur | les colonnes `id` sont de type `uuid` : Postgres lève `22P02` au lieu de renvoyer zéro ligne | réglé par `isUuid()` dans `src/server/db/queries/ids.ts`, appliqué à toute lecture par identifiant |

### L'adresse canonique est `http://localhost:3200`

`127.0.0.1:3200` fonctionne (autorisé dans `next.config.ts` et dans les URLs
de redirection Supabase), mais les cookies de session sont propres à chaque
hôte. Se connecter sur l'un ne connecte pas sur l'autre — et le lien de
connexion reçu par email pointe toujours vers `localhost`.

### Ne pas mélanger `build` et `dev`

Turbopack garde un cache dans `.next`. Lancer `pnpm build` alors que
`pnpm dev` tourne corrompt ce cache : le serveur répond, mais le HMR ne livre
plus rien au navigateur, qui reste sur le squelette de chargement. Le symptôme
ne ressemble pas à sa cause, d'où cette note.

Pour vérifier une modification pendant que `dev` tourne : `pnpm typecheck` et
`pnpm lint` sont sans danger. Réserver `pnpm verify` aux moments où le serveur
est arrêté.
