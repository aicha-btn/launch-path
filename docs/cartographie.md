# Cartographie de LaunchPath

Ce document sert trois usages à la fois :

- **sommaire** — où trouver quoi dans le code ;
- **cahier des charges** — ce que chaque partie doit faire ;
- **grille de relecture** — ce qu'il faut vérifier, partie par partie.

Chiffres à la fin de la relecture : **12 254 lignes** de TypeScript, 23 routes,
23 composants, 24 actions serveur, 10 tables, **172 tests** — 82 unitaires,
86 d'intégration, 4 end-to-end. Au début de la relecture : 41 tests.

---

## Suivi de la relecture

| # | Partie | Fichiers | Statut |
|---|---|---|---|
| 1 | Fondations et design system | 14 | **relue et corrigée** — 5 points, voir plus bas |
| 2 | Page publique | 5 | **relue et corrigée** |
| 3 | Authentification et session | 10 | **relue et corrigée** |
| 4 | Équipe et invitations | 8 | **relue et corrigée** |
| 5 | Parcours types | 8 | **relue et corrigée** |
| 6 | Lancement et suivi des onboardings | 7 | **relue et corrigée** |
| 7 | Détail de tâche, commentaires, historique | 6 | **relue et corrigée** |
| 8 | Tableau de bord, recherche, filtres | 4 | **relue et corrigée** |
| 9 | Emails et rappels automatiques | 4 | **relue et corrigée** |
| 10 | Base de données et sécurité | 13 | **relue et corrigée** — 7 points, dont un trou dans l'audit lui-même |
| 11 | Tests et outillage | 17 | **relue et corrigée** — 8 points, dont deux tests qui ne vérifiaient rien |

Statuts possibles : `à relire` · `relu, rien à signaler` · `relu, corrigé` ·
`relu, réserve` (un point laissé volontairement).

---

# Partie 1 — Fondations et design system

## Fichiers

```
next.config.ts                      origines autorisées en développement
tsconfig.json                        TypeScript strict, alias @/
src/app/layout.tsx                   les trois polices, métadonnées
src/app/globals.css                  tokens des 4 encres, 2 thèmes, filets
src/types/index.ts                   types du domaine
src/lib/dates.ts                     fuseau métier — LE seul new Date()
src/lib/scheduling.ts                calcul des échéances, fonctions pures
src/components/brand/glyph.tsx        le glyphe, réduction du Folio
src/components/brand/logo.tsx         le lockup
src/app/icon.svg                     favicon
src/components/marks.tsx             Stamp, StatusLabel, SectionRule
src/components/masthead.tsx          en-tête de page
src/components/ui.tsx                Button, Avatar, Figure, EmptyState
src/components/folio.tsx             Folio et FolioCompact
src/components/skeleton.tsx          états de chargement
src/components/toaster.tsx           toasts
```

## Ce que ça doit faire

- **Quatre encres, un rôle exclusif chacune.** Noir = texte et filets. Bleu
  offset = identité, structure, action. Jaune signal = emphase, **en aplat
  uniquement**. Rouge = **le retard, et rien d'autre**.
- **Aucun angle arrondi, aucune ombre floue.** Garde-fou global dans le CSS.
- **Trois familles typographiques, rôles exclusifs.** Instrument Serif jamais
  sous 28 px, Archivo pour l'interface, IBM Plex Mono pour dates et libellés.
- **`src/lib/dates.ts` est le seul endroit qui appelle `new Date()`** pour
  obtenir la date du jour, en fuseau `Europe/Paris`.
- **`addBusinessDays` est pure** : pas de base, pas d'horloge, pas de fuseau.

## Points à vérifier

- [ ] Aucun `new Date()` hors de `dates.ts` (hors horodatage d'écriture)
- [ ] Aucun `toISOString().slice(0,10)` qui contournerait le fuseau métier
- [ ] Le rouge n'apparaît nulle part ailleurs que pour un retard
- [ ] Le jaune n'est jamais utilisé pour du texte
- [ ] Cohérence entre les tokens du CSS et ceux du design system
- [ ] Les types du domaine correspondent au schéma de la base
- [ ] Les chiffres sont tabulaires partout où il y a des chiffres

---

# Partie 2 — Page publique

## Fichiers

```
src/app/(marketing)/layout.tsx        en-tête + pied de page publics
src/app/(marketing)/page.tsx          la landing, 8 sections
src/components/marketing/header.tsx   navigation publique
src/components/marketing/footer.tsx   pied de page + mention de démonstration
src/mocks/landing-preview.ts          données d'aperçu du hero
```

## Ce que ça doit faire

- Expliquer le produit et amener vers la démonstration en un clic.
- Le visuel du hero utilise **les vrais composants** du produit, pas une image.
- Aucune donnée réelle : la page est publique, donc sans organisation.
- Mention obligatoire en pied de page : les tarifs sont illustratifs.

## Points à vérifier

- [ ] Aucun lien mort, aucune ancre cassée
- [ ] Aucun faux témoignage ni faux logo client
- [ ] La mention de démonstration est présente et lisible
- [ ] Pas de débordement horizontal à 390 px
- [ ] Les données d'aperçu restent relatives à aujourd'hui
- [ ] `TaskRow` en `readOnly` : aucune action déclenchable sans session

---

# Partie 3 — Authentification et session

## Fichiers

```
src/proxy.ts                          rafraîchit la session, protège les pages
src/lib/supabase/server.ts            client d'auth côté serveur
src/app/auth/callback/route.ts         réception du lien de connexion
src/app/login/page.tsx                 écran de connexion
src/components/auth/login-form.tsx     magic link + accès démonstration
src/app/welcome/page.tsx               création de l'organisation
src/components/auth/welcome-form.tsx
src/server/auth/session.ts            getCurrentMembership, requireMembership
src/server/actions/auth.ts             magic link, démo, déconnexion
src/server/actions/organization.ts     création d'organisation
```

## Ce que ça doit faire

- Connexion par lien email ; mot de passe réservé au compte de démonstration
  et aux tests.
- `proxy.ts` protège **les pages**, pas les données.
- Deux redirections distinctes : pas de session → `/login` ; session sans
  organisation → `/welcome`.
- `?suivant=` validé : uniquement des chemins internes.

## Points à vérifier

- [ ] Le proxy couvre bien toutes les routes protégées, et seulement elles
- [ ] `?suivant=` refuse une URL externe
- [ ] Un utilisateur déjà connecté ne reste pas bloqué sur `/login`
- [ ] `createOrganization` empêche la création d'une seconde organisation
- [ ] La déconnexion nettoie réellement la session
- [ ] Aucune donnée métier ne passe par le client Supabase

---

# Partie 4 — Équipe et invitations

## Fichiers

```
src/app/(app)/settings/members/page.tsx    membres + invitations en attente
src/components/members/invite-form.tsx     inviter, retirer
src/app/invitations/[token]/page.tsx        acceptation, 4 états
src/server/actions/members.ts               inviter, annuler, retirer
src/server/actions/invitations.ts           lire, accepter
src/server/db/queries/members.ts            membres, invitations, compte admins
```

## Ce que ça doit faire

- Seul un administrateur invite ou retire.
- Le jeton d'invitation est la preuve, pas l'email.
- **Retirer un membre désassigne ses tâches** — traitement explicite, aucune
  cascade ne le fait.
- Impossible de retirer le dernier administrateur.
- Une invitation expirée ou déjà utilisée est refusée avec un message distinct.

## Points à vérifier

- [ ] Chaque action filtre sur `organizationId`, y compris les suppressions
- [ ] Le rôle est revérifié côté serveur, pas seulement masqué dans l'interface
- [ ] Le jeton est assez long et imprévisible
- [ ] Une invitation acceptée ne peut pas resservir
- [ ] La désassignation couvre tâches **et** responsables par défaut
- [ ] Un membre retiré ne reste pas pilote d'un parcours

---

# Partie 5 — Parcours types

## Fichiers

```
src/app/(app)/templates/page.tsx             liste, actifs et archivés
src/app/(app)/templates/new/page.tsx          création
src/app/(app)/templates/[id]/page.tsx         édition
src/components/templates/template-form.tsx    création avec étapes
src/components/templates/template-header-form.tsx
src/components/templates/step-editor.tsx      ordre, délais, responsables
src/server/actions/templates.ts               7 actions
src/server/db/queries/templates.ts            lectures
```

## Ce que ça doit faire

- Créer un parcours type **et ses premières étapes dans le même écran**.
- Délais relatifs, négatifs autorisés, affichés en langage clair.
- Réordonnancement par échange de positions ; renumérotation après suppression.
- Archivage : le modèle disparaît du lancement, les parcours lancés survivent.
- Les responsables proposés sont **les membres de l'organisation**, et validés
  côté serveur.

## Points à vérifier

- [ ] Les positions restent une suite continue de 1 à N après chaque opération
- [ ] Un responsable hors organisation est refusé
- [ ] Les bornes sur les délais sont appliquées
- [ ] Un parcours type sans étape ne peut pas être lancé
- [ ] Les formulaires de déplacement n'écrasent pas une saisie en cours
- [ ] Chaque action vérifie l'appartenance du parcours type

---

# Partie 6 — Lancement et suivi des onboardings

## Fichiers

```
src/app/(app)/journeys/new/page.tsx        écran de lancement
src/components/journeys/launch-form.tsx     aperçu des échéances
src/app/(app)/journeys/[id]/page.tsx        détail d'un parcours
src/app/(app)/journeys/[id]/not-found.tsx
src/components/journeys/task-row.tsx        LA ligne de tâche, 4 contextes
src/server/actions/journeys.ts              lancement, statuts, annulation
src/server/db/queries/journeys.ts           lectures et compteurs
```

## Ce que ça doit faire

- Le lancement **copie** les étapes en tâches, et snapshote le nom du modèle.
- Tout dans une transaction : pas de parcours sans ses tâches.
- Échéances calculées en jours ouvrés depuis la date d'arrivée.
- Aperçu côté client avec **la même fonction** que le serveur.
- Statut recalculé **dans les deux sens** : terminé quand tout est traité,
  de nouveau en cours dès qu'une tâche est rouverte.
- Un parcours annulé n'est pas recalculé automatiquement.

## Points à vérifier

- [ ] Un identifiant mal formé donne un 404, pas une erreur serveur
- [ ] Le pilote reçu du formulaire est validé contre les membres
- [ ] Les tâches sont numérotées dans l'ordre du modèle
- [ ] L'événement d'historique est écrit dans la même transaction
- [ ] La mise à jour optimiste ne masque pas un échec serveur
- [ ] `skipped` et `cancelled` sont atteignables et réversibles

---

# Partie 7 — Détail de tâche, commentaires, historique

## Fichiers

```
src/components/journeys/task-sheet.tsx       panneau piloté par ?task=
src/components/journeys/task-form.tsx        réassignation, échéance, commentaire
src/components/journeys/activity-timeline.tsx
src/server/actions/comments.ts               ajouter, supprimer
src/server/db/queries/tasks.ts               détail, historique
```

## Ce que ça doit faire

- Le panneau s'ouvre par l'URL : lien partageable, bouton retour fonctionnel,
  fermeture sans JavaScript.
- La tâche doit appartenir à l'organisation **et** au parcours affiché.
- On ne supprime que son propre commentaire.
- L'historique enregistre le **fait** ; le libellé vit dans l'interface.

## Points à vérifier

- [ ] `?task=` d'un autre parcours n'affiche rien d'incohérent
- [ ] Un identifiant mal formé ne casse pas la page
- [ ] La suppression de commentaire vérifie auteur **et** organisation
- [ ] Les commentaires sont échappés, pas interprétés
- [ ] Le panneau reste utilisable au clavier
- [ ] Un événement dont la tâche a été supprimée s'affiche proprement

---

# Partie 8 — Tableau de bord, recherche, filtres

## Fichiers

```
src/app/(app)/dashboard/page.tsx            4 chiffres, parcours, retards
src/app/(app)/journeys/page.tsx             liste filtrée
src/components/journeys/journey-filters.tsx  filtres sans JavaScript
src/app/(app)/my-tasks/page.tsx             mes tâches par échéance
```

## Ce que ça doit faire

- **Tous les compteurs en SQL**, y compris les agrégats dérivés.
- « Aujourd'hui » toujours en fuseau métier, jamais en UTC.
- Une tâche due aujourd'hui n'est **jamais** en retard.
- Filtres et tri entièrement dans l'URL.
- Les paramètres d'URL sont validés avant d'atteindre la requête.

## Points à vérifier

- [ ] Les compteurs correspondent au SQL brut
- [ ] Aucun filtrage ni tri fait en JavaScript sur des données chargées entières
- [ ] Un paramètre d'URL inattendu est ignoré, pas transmis
- [ ] Les groupes de « mes tâches » ne se chevauchent pas
- [ ] Les états vides sont présents et proposent l'action suivante
- [ ] Un pilote inexistant dans l'URL n'écrase pas la liste

---

# Partie 9 — Emails et rappels automatiques

## Fichiers

```
src/server/email/send.ts                  LA couche d'envoi
src/server/email/templates.ts             4 modèles
src/app/api/cron/reminders/route.ts       rappels quotidiens
scripts/reminders.mjs                     déclenchement manuel
```

## Ce que ça doit faire

- Un seul endroit connaît le transport ; un seul fichier à changer pour Resend.
- Un envoi qui échoue **ne fait pas échouer** l'action métier.
- Un seul email par personne au lancement, pas un par tâche.
- **Idempotence arbitrée par la base**, pas par le code.
- Le cron est protégé par un secret et ne renvoie que des compteurs.

## Points à vérifier

- [ ] Deux exécutions le même jour n'envoient qu'une fois
- [ ] Une tâche sans responsable est ignorée, pas en erreur
- [ ] Le secret est comparé avant tout accès à la base
- [ ] Les modèles échappent le contenu inséré
- [ ] Le cron ne fuit aucune donnée dans sa réponse
- [ ] La sélection « dues demain » est exactement demain

---

# Partie 10 — Base de données et sécurité

## Fichiers

```
src/server/db/schema.ts                  10 tables, index, relations
src/server/db/auth-users.ts              vue lecture seule sur auth
src/server/db/index.ts                   client Postgres
src/server/db/queries/index.ts           point d'entrée des lectures
src/server/db/queries/ids.ts             garde-fou sur les identifiants
src/server/db/queries/members-lookup.ts  résolution des utilisateurs
src/server/db/errors.ts                  erreurs Postgres traitées en cas métier
src/server/db/schema.db.test.ts          le schéma déclaré vs la base réelle
src/types/index.ts                       unions de statuts — contrat, pas copie
drizzle/0000_initial_schema.sql
drizzle/0001_enable_rls.sql              RLS deny-all
drizzle/0002_one_org_per_user.sql        unique sur user_id
drizzle/0003_drop_redundant_token_index.sql
scripts/db-audit.mts                     vérification mécanique du refus total
scripts/db-seed.mts                      jeu de démonstration
supabase/config.toml                     4 corrections
```

## Ce que ça doit faire

- **Chaque table a RLS activée sans policy.** Sans ça, l'API REST de Supabase
  expose tout via la clé anon, qui est publique.
- Drizzle possède le schéma applicatif, Supabase possède `auth`.
- Toute lecture exige un `organizationId`.
- Les échéances sont des `date`, jamais des `timestamp`.

## Points à vérifier

- [x] `pnpm db:audit` passe, 10 tables sur 10
- [x] Aucune migration ne touche au schéma `auth`
- [x] Les règles `on delete` correspondent à ce qui est documenté
- [x] Les index déclarés existent réellement en base
- [x] L'index partiel est bien utilisé par les requêtes de retard (`EXPLAIN`)
- [x] Le seed ne laisse aucun secret en clair inutile
- [x] Aucune requête ne peut être appelée sans organisation
- [x] Les types de `src/types/index.ts` correspondent au schéma
- [x] Test RLS réel : `curl` avec la clé anon renvoie `[]` sur les 10 tables
      alors qu'elles contiennent des lignes, et refuse l'écriture

---

# Partie 11 — Tests et outillage

## Fichiers

```
vitest.config.mts                            tests unitaires, sans dépendance
vitest.db.config.mts                         tests d'intégration, base requise
playwright.config.ts                         parcours end-to-end
src/lib/dates.test.ts                        37 tests
src/lib/scheduling.test.ts                   14 tests
src/lib/safe-redirect.test.ts                12 tests
src/server/db/queries/ids.test.ts             8 tests
src/server/email/templates.test.ts            8 tests
src/components/journeys/activity-timeline.test.ts   libellés exhaustifs
src/server/integration.db.test.ts            actions, isolation, entrées
src/server/auth/session.db.test.ts           le module de session, pour de vrai
src/server/db/schema.db.test.ts              le schéma déclaré vs la base
e2e/parcours-critique.spec.ts                1 parcours
e2e/responsive.spec.ts                       390 px, public ET applicatif
e2e/global-teardown.ts                       nettoyage
src/test/fixtures.ts                          jeux jetables + purge des comptes
src/test/setup-env.ts
package.json                                  scripts
```

## Ce que ça doit faire

- `pnpm verify` sans aucune dépendance : lint, typecheck, tests unitaires, build.
- Les tests d'intégration créent leurs propres organisations et nettoient —
  organisations **et** comptes.
- Le parcours end-to-end ne laisse rien derrière lui.
- **Un test qui ne peut pas échouer ne compte pas.** Tout test important est
  validé par mutation : on casse le code, on vérifie que le test le voit.

## Points à vérifier

- [x] Aucun test ne passe sans rien vérifier
- [x] Les tests d'isolation échouent si on retire un filtre (mutation)
- [x] Les trois familles d'entrée sont couvertes : valide, inexistante, invalide
- [x] Les tests ne dépendent pas de l'ordre d'exécution
- [x] Le nettoyage ne peut pas supprimer des données de démonstration
- [x] `pnpm verify` ne dépend ni de Docker ni d'un serveur
- [x] Les fixtures ne laissent pas de comptes orphelins
- [x] Le module de session est testé, pas seulement simulé

---

# Méthode de relecture

Pour chaque partie, dans cet ordre :

1. **lire chaque fichier en entier**, pas seulement les signatures ;
2. confronter au cahier des charges ci-dessus ;
3. dérouler la liste de points à vérifier ;
4. chercher les trois familles de problème :
   - **erreur** — le code ne fait pas ce qu'il prétend ;
   - **incohérence** — deux endroits se contredisent ;
   - **risque** — ça marche aujourd'hui, ça cassera demain ;
5. corriger, vérifier la correction, puis mettre le statut à jour.

Ce qui ne compte PAS comme une relecture : vérifier qu'un test existe. Un test
peut passer sans rien vérifier — c'est arrivé deux fois sur ce projet.

---

# Journal des relectures

## Partie 1 — Fondations · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | Le rouge servait à **trois** intentions (retard, erreur de saisie, survol destructif) alors que le design system affirmait l'exclusivité au retard | incohérence doc/code | Règle **élargie et énumérée** dans `design-system.md` § 3, plus le README. Retirer le rouge des erreurs aurait été de la dogmatique contre l'usage |
| B | Le jaune : 6 usages, la doc disait « un seul » | incohérence doc/code | Usages énumérés dans le § 3. La règle importante (jamais de texte en jaune) était, elle, respectée — vérifié |
| C | `src/lib/dates.ts` n'avait **aucun test**, alors que `lateDays` décide de tout ce qui est « en retard » | trou de couverture | **37 tests ajoutés** (`dates.test.ts`), dont la frontière « dû aujourd'hui ≠ en retard » et les deux cas de changement d'heure |
| D | `addDays` et `daysBetween` ne validaient pas leur entrée. `lateDays("bidon")` renvoyait **0**, donc « pas en retard » — une réponse fausse et silencieuse | risque | Primitives `parseCivilDate` / `formatCivilDate` validées, **partagées** avec `scheduling.ts` qui avait sa propre copie |
| E | La page publique était prérendue au build : `today()` évalué une seule fois, donc dates figées au jour du déploiement. Le fichier affirmait le contraire | bug invisible en local | `export const revalidate = 3600`. Build confirme `Revalidate 1h` |

Vérifié et conforme : `new Date()` hors de `dates.ts` uniquement pour horodater
une écriture · `toISOString()` uniquement dans des fonctions pures · aucun
texte en jaune · chiffres tabulaires appliqués partout.

Tests : 22 → **59**.

## Partie 2 — Page publique · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | Le hero affichait `Retard 3 tâches` **écrit en dur**, et sélectionnait « les 3 premières tâches à faire » en supposant qu'elles étaient les 3 en retard. Vrai par coïncidence avec le jeu d'aperçu du moment | risque de mensonge | Le compte et la sélection sont **dérivés** de `lateDays()` |
| B | Le visuel était légendé « Capture réelle de l'application » alors que les données sont inventées | affirmation trompeuse | « Composants réels · données d'exemple » — plus exact, et l'argument reste plus fort qu'une capture |
| C | Le forfait Structure proposait « Nous écrire » et menait à `/login` | promesse non tenue | Libellé aligné sur ce que le lien fait réellement |
| D | La mention de démonstration couvrait les tarifs mais pas les **limites de forfait** annoncées (« 3 intégrations », « 2 membres »), qui ne sont appliquées nulle part | mention incomplète | Mention étendue aux limites |
| E | Le débordement horizontal à 390 px était coché depuis des semaines **sans avoir jamais été mesuré** | vérification fictive | Test permanent `e2e/responsive.spec.ts`. Résultat : la page est conforme — `scrollWidth = clientWidth = 390` |

Sur le point E, mon premier script de vérification donnait un faux positif : il
signalait le tableau de comparaison en `min-w-[640px]`, qui dépasse
**légitimement** puisqu'il vit dans un parent `overflow-x-auto`. Le test
corrigé ignore tout élément ayant un ancêtre à défilement. Le code était bon,
c'est le test qui était faux.

Vérifié et conforme : les 4 ancres du menu correspondent à 4 `id` existants ·
aucun lien mort · aucun faux témoignage ni faux logo client · le tableau large
défile dans son conteneur · `TaskRow readOnly` ne déclenche aucune action.

Tests end-to-end : 1 → **3**.

## Partie 3 — Authentification et session · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | **`/auth/callback` ne validait pas `?suivant=` du tout.** `?suivant=@evil.example` produit `http://localhost:3200@evil.example`, dont l'hôte réel est `evil.example` — la partie avant le `@` est lue comme un identifiant | redirection ouverte | `safeInternalPath()` appliqué dans la route |
| B | La page de connexion se contentait de `startsWith("/")`, ce qui laisse passer `//evil.example` et `/\evil.example` | piège latent | Même validation centralisée. Inoffensif *aujourd'hui* par accident de concaténation ; exploitable dès qu'on passerait à `new URL(next, origin)` |
| C | La règle « un utilisateur appartient à une seule organisation » n'était qu'un commentaire plus une vérification applicative **avec fenêtre de concurrence**. La contrainte existante porte sur `(organization_id, user_id)` : elle n'empêche pas un utilisateur dans deux organisations différentes | règle non garantie | `uniqueIndex` sur `memberships(user_id)` — migration `0002`. **Vérifié** : une seconde insertion est refusée avec `23505 memberships_user_key` |
| D | Les deux actions qui insèrent un membership laissaient remonter l'exception de contrainte comme une panne | erreur mal qualifiée | `isUniqueViolation()` dans `server/db/errors.ts` — le refus de la base est traité comme le cas métier qu'il est |

Sur le point A, honnêteté sur la gravité : la redirection ne se déclenche
qu'après un échange de jeton réussi, donc un attaquant ne peut pas la
déclencher chez une victime — il lui faudrait le lien reçu par email. C'est un
défaut de défense en profondeur, pas une faille exploitable. Il se corrige en
dix lignes, donc il se corrige.

Vérifié et conforme : le proxy couvre les 9 routes applicatives via 5 préfixes
et rien d'autre · un utilisateur connecté est renvoyé de `/login` vers le
dashboard · `/welcome` est laissé à la page, qui seule peut interroger la base ·
`signOut` passe par une Server Action, donc les cookies sont réellement
effacés · **aucun appel `.from()` sur le client Supabase** — il ne sert qu'à
l'authentification, tout le métier passe par Drizzle.

Réserve assumée : `requireAdmin()` lève une exception au lieu de renvoyer un
résultat typé. L'interface ne propose l'action qu'aux administrateurs, donc le
cas ne se produit que sur requête forgée — l'utilisateur verrait la frontière
d'erreur. Acceptable, noté.

Tests : 59 → **71**.

## Partie 4 — Équipe et invitations · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | **Les 22 identifiants lus d'un `FormData` allaient directement dans une requête.** Un identifiant mal formé provoquait `22P02` — donc une erreur serveur au lieu d'un refus. C'est **la même cause que le bug `/journeys/j-clara`**, côté écriture cette fois, et le garde-fou des lectures ne protégeait que les pages | systémique | `readId()` / `readOptionalId()` dans `server/actions/read-id.ts`, appliqués aux 22 endroits |
| B | `removeMember` ne bloquait pas l'**auto-retrait**. L'interface masque le bouton, mais l'action est publique — et les parcours du partant étaient « transférés » à lui-même, donc à un non-membre | incohérence | Refus explicite avec message |
| C | `removeMember` chargeait **tous** les identifiants de parcours et de parcours types en mémoire, puis filtrait par `inArray` — le motif « je charge tout pour filtrer » que ce projet refuse ailleurs | incohérence avec ses propres principes | Sous-requêtes. Cinq allers-retours devenus trois instructions |

Sur le point A, le compilateur a fait le travail : passer de `string` à
`string | null` a fait remonter **21 erreurs de typage**, une par endroit où le
cas n'était pas traité. Impossible d'en oublier un.

Distinction retenue entre les deux lecteurs : `readId` refuse le vide (un
identifiant obligatoire), `readOptionalId` renvoie `null` pour le vide — « non
assignée » est une valeur légitime — et `undefined` pour une valeur mal formée.
Confondre les deux aurait transformé « responsable invalide » en
« désassigner », c'est-à-dire une écriture silencieuse au lieu d'un refus.

Vérifié et conforme : chaque action filtre sur `organizationId`, y compris
`cancelInvitation` et la suppression de commentaire · le rôle est revérifié
côté serveur par `requireAdmin()` · le jeton fait 24 octets aléatoires
(192 bits) en base64url · une invitation acceptée est marquée `acceptedAt` donc
inutilisable · la désassignation couvre les tâches, les parcours pilotés **et**
les responsables par défaut des parcours types · le dernier administrateur ne
peut pas être retiré.

Incident de manipulation à noter : mes commandes `perl` ont remplacé des
apostrophes par des barres obliques dans trois messages d'erreur. Repéré par
relecture ciblée, corrigé. Une correction mécanique de masse mérite toujours
une vérification du texte produit.

## Partie 5 — Parcours types · relue et corrigée

Le constat principal de cette partie est **l'absence de tests** sur la logique
la plus fragile du projet : l'ordre des étapes. Les 18 tests d'intégration
couvraient le lancement, l'isolation et les membres — rien sur l'éditeur.

**11 tests ajoutés**, et le code s'est révélé correct :

| Vérifié | Résultat |
|---|---|
| `addStep` ajoute en fin | positions `1,2,3,4` |
| `moveStep` échange deux voisines | ordre inversé, suite intacte |
| Monter la première étape | sans effet, sans erreur |
| `deleteStep` au **milieu** | renumérote en `1,2,3` — pas de trou |
| Ajouter après une suppression | pas de position réutilisée |
| Parcours type d'une autre organisation | ajout, suppression et archivage refusés |
| Délais hors bornes, non entiers | refusés |
| Responsable extérieur | refusé |
| Identifiant mal formé | refusé proprement |

**Validé par mutation** : retirer l'appel à `renumber()` dans `deleteStep` fait
échouer 2 tests. Les tests savent échouer.

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | `parseOffset("")` renvoyait **0**. `Number("")` vaut 0 et `Number.isInteger(0)` vaut `true` : vider le champ de délai enregistrait « le jour de l'arrivée » sans le dire | écriture silencieuse | Le vide est refusé |
| B | Les étapes et les tâches étaient triées par `.sort()` **après** la requête, alors que le projet fait un principe de trier en SQL | incohérence avec ses propres principes | `with: { steps: { orderBy: … } }` |

Vérifié et conforme : chaque action vérifie l'appartenance du parcours type ·
un parcours type sans étape ne peut pas être lancé, et l'écran le dit · les
formulaires de déplacement sont des `<form>` frères du formulaire d'édition,
donc ils n'emportent pas la saisie en cours · l'archivage n'affecte pas les
onboardings déjà lancés.

Tests d'intégration : 18 → **29**.

## Partie 6 — Lancement et suivi · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | La validation des dates ne vérifiait que le **format**. `/^\d{4}-\d{2}-\d{2}$/` accepte `2026-02-31` et `2026-13-01` : `launchJourney` passait la garde, puis `addBusinessDays` levait « Date inexistante » — écran d'erreur au lieu d'un refus lisible. Même défaut sur l'échéance dans `updateTask`, où Postgres aurait rejeté la valeur | erreur | `isValidCivilDate()` dans `dates.ts`, qui s'appuie sur le parseur réel |
| B | **`setTaskStatus` échouait en silence** (`Promise<void>`). Combiné à la mise à jour optimiste, la case se cochait puis revenait toute seule, sans aucune explication : l'optimisme masquait l'échec — exactement ce que la grille de relecture interdisait | erreur d'expérience | L'action renvoie un `ActionResult`, et `TaskRow` affiche un toast en cas de refus. Elle est appelée impérativement, pas comme `action` de formulaire, donc elle peut renvoyer une valeur |
| C | `reopenJourney` forçait « en cours » sans recalculer. Réactiver un parcours dont toutes les tâches sont traitées l'affichait « en cours » avec 3/3, et le dashboard le comptait parmi les actifs | incohérence d'état | Recalcul dans la transaction, après la réactivation — l'ordre compte, `recomputeJourneyStatus` ignore les parcours annulés |

**8 tests ajoutés**, et validés par mutation : remettre l'ancienne expression
régulière de format fait échouer 2 tests.

Vérifié et conforme : le pilote reçu du formulaire est validé contre les
membres, et un pilote absent retombe sur l'utilisateur courant plutôt que de
faire échouer le lancement · les tâches sont numérotées dans l'ordre du
modèle · l'événement d'historique est écrit dans la même transaction que les
tâches · `skipped` et `cancelled` sont atteignables et réversibles depuis
l'interface.

Réserve assumée : `cancelJourney` reste un `void` silencieux, parce qu'il est
utilisé comme `action` de formulaire — donc sans JavaScript. Le refus ne peut
survenir que sur requête forgée, et l'écran se recharge inchangé.

Tests d'intégration : 29 → **37**.

## Partie 7 — Détail de tâche, commentaires, historique · relue et corrigée

En vérifiant que les commentaires étaient bien échappés dans l'interface — ils
le sont, React s'en charge — j'ai remonté la même question jusqu'aux emails. Et
là, rien ne le faisait.

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | **Injection HTML dans les emails.** Titres d'étapes, noms de personnes et noms d'organisation sont des saisies utilisateur, interpolés **bruts** dans le HTML des quatre modèles. Le risque n'est pas l'exécution de script — les clients de messagerie la bloquent — mais l'**hameçonnage** : un membre pouvait glisser `<a href="https://evil.example">Réinitialisez votre mot de passe</a>` dans un titre d'étape, et LaunchPath l'envoyait à ses collègues depuis son adresse légitime | **sécurité** | `esc()` sur chaque valeur interpolée dans du HTML |
| B | L'objet du message reprenait des saisies utilisateur telles quelles. Un retour à la ligne y permet d'injecter d'autres en-têtes | sécurité | `header()` : les sauts de ligne sont aplatis. La bibliothèque d'envoi encode déjà les en-têtes, mais on ne s'appuie pas sur une protection qu'on ne contrôle pas |
| C | **Régression que j'ai introduite en corrigeant A** : le titre échappé servait aussi à la version TEXTE, où « Marie d'Anjou » devenait « Marie d&#39;Anjou ». Corriger un contexte en cassant l'autre | erreur | Convention explicite : chaque modèle construit son titre **en clair**, et ne l'échappe qu'au moment de l'injecter dans le HTML. Les deux contextes sont testés séparément |
| D | Le type `task_due_date_changed` existait au schéma **et** dans la timeline, mais **rien ne l'écrivait** : déplacer une échéance ne laissait aucune trace — or c'est exactement le geste qu'on veut pouvoir expliquer plus tard | fonctionnalité fantôme | Événement écrit dans la transaction, uniquement si la date change réellement |

**14 tests ajoutés** (8 sur l'échappement, 3 sur l'historique, 3 sur les
refus). Un test vérifie en plus que **tout type d'événement écrit est connu de
la timeline** — sinon il s'afficherait brut à l'écran.

Vérifié et conforme : `?task=` d'un autre parcours n'ouvre rien, la page
vérifie l'appartenance à l'organisation **et** au parcours affiché · la
suppression de commentaire exige auteur **et** organisation · les commentaires
sont échappés par React · un événement dont la tâche a été supprimée s'affiche
« une étape supprimée » grâce au `leftJoin`.

Réserve assumée : le panneau ne se ferme pas avec la touche Échap et ne piège
pas le focus. Ce n'est pas une modale — la page derrière reste consultable, et
le voile comme la croix sont de vrais liens, donc accessibles au clavier.

## Partie 8 — Tableau de bord, recherche, filtres · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | Le sur-titre de la liste déduisait « N en cours » de la **liste filtrée**. Choisir « Terminés » affichait donc **« 0 en cours »** — un chiffre faux, alors que la règle du § 15 du design system impose au sur-titre de porter un chiffre réel | erreur | `countActiveJourneys()` : une requête indépendante des filtres. **Vérifié dans un navigateur** — filtré sur « Terminés », l'en-tête affiche toujours « 3 en cours » |
| B | Un seul état vide pour deux situations très différentes. Une organisation qui n'a **encore rien lancé** recevait « Aucun onboarding ne correspond à cette recherche » et un bouton « Réinitialiser les filtres » — alors qu'aucun filtre n'était actif. La toute première visite était la plus mal servie | erreur d'expérience | Deux états vides distincts, chacun proposant l'action qui a du sens |
| C | `isFiltered` était calculé **deux fois**, dans la page et dans le composant de filtres, à partir de sources différentes | risque de divergence | Calculé une fois, passé en propriété. Ajouter un filtre à un seul des deux endroits aurait donné un état vide en contradiction avec le bandeau de résultats |

Vérifié et conforme : les compteurs du dashboard correspondent au SQL brut
(recoupé à la main) · les paramètres d'URL inattendus sont ignorés, et un
pilote qui n'est pas membre est écarté avant d'atteindre la requête · les
quatre groupes de « mes tâches » ne se chevauchent pas et couvrent tous les
cas — `en retard` est `delta < 0`, `aujourd'hui` est `delta = 0`, puis `1..7`,
puis `> 7` · le filtrage en JavaScript qui subsiste porte sur des tâches déjà
chargées **parce que l'affichage en a besoin**, ce qui n'est pas le motif
reproché ailleurs.

## Partie 9 — Emails et rappels automatiques · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | **Réassigner une tâche ne prévenait personne.** `updateTask` écrivait bien l'événement `task_assigned` mais n'envoyait aucun email : le nouveau responsable l'apprenait au rappel de la veille — ou jamais si l'échéance était lointaine. La page publique promet pourtant « prévient chaque responsable par email » | trou fonctionnel, visible depuis la promesse commerciale | Email envoyé à la réassignation. **Sans passer par `notification_logs`** : une réassignation est un geste humain délibéré, pas une tâche rejouable — et la clé du journal ne contient pas le destinataire, elle aurait donc bloqué à tort l'email du nouveau responsable le jour du lancement |
| B | Le secret du cron était comparé par `!==`, qui s'arrête au premier caractère différent | durcissement | `timingSafeEqual`. Honnêteté sur la portée : sur HTTP, la gigue réseau couvre largement l'écart mesurable — ce n'était pas une faille pratique. Six lignes, et c'est ce qu'un relecteur cherche |
| C | `date + interval '1 day'` produit un `timestamp`, pas une `date`. L'égalité ne tenait que parce que l'intervalle tombe à minuit — correct, mais par accident | fragilité | `date + 1`, qui reste une `date`. La comparaison est exacte par construction |

**Et un défaut trouvé dans ma propre suite de tests, pas dans le code.**

Le test « retirer un membre désassigne ses tâches » est destructif : il retirait
un membre de `orgA`, partagée par tout le fichier. Deux tests écrits plus tard
échouaient donc — les tâches n'étaient plus assignées, et une réassignation
vers cet ancien membre était refusée à juste titre.

Les tests dépendaient de leur ordre d'exécution, ce que la grille de la partie
11 interdit explicitement. Corrigé : le test destructif crée une organisation
**jetable** et la détruit dans un `finally`.

Vérifié en conséquence : `pnpm vitest --sequence.shuffle` deux fois de suite,
43 tests verts. L'indépendance est mesurée, plus supposée.

Second défaut de test au passage : ma vérification de la réassignation prenait
« la première tâche venue », or le gabarit l'assigne déjà au membre visé —
réassigner à la même personne ne doit rien envoyer. Le test vérifiait donc
l'inverse de son intention. Il sélectionne maintenant une tâche non assignée.

Vérifié et conforme : deux exécutions le même jour n'envoient qu'une fois · une
tâche sans responsable est écartée par la jointure, pas en erreur · le secret
est comparé avant tout accès à la base — 401 sans secret, avec un mauvais
secret et avec un secret tronqué · la réponse du cron ne contient que des
compteurs · la sélection « dues demain » est exactement demain.

Tests d'intégration : 40 → **43**.

## Partie 10 — Base de données et sécurité · relue et corrigée

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | **`pnpm db:audit` ne vérifiait que la moitié de la règle.** La décision n° 5 est « RLS activée **et** aucune policy ». Le script lisait le nombre de policies, l'affichait… et ne s'en servait pas pour échouer. Une seule policy permissive — le `using (true)` de n'importe quel tutoriel — rouvrait donc la table en entier pendant que le script concluait « toutes les tables sont protégées » | erreur, dans l'outil censé garantir la sécurité | Trois contrôles au lieu d'un : RLS activée, zéro policy, aucune vue dans `public`. **Démontré, pas supposé** : avec `create policy ... using (true)` sur `tasks`, la clé anon renvoyait les vrais titres des tâches, et l'ancien script les déclarait protégées |
| B | Aucune vue n'était surveillée. PostgREST expose aussi les vues, et une vue s'exécute par défaut avec les droits de son propriétaire : elle traverse le RLS des tables qu'elle lit | angle mort | Une vue dans `public` fait échouer l'audit, avec la sortie de secours indiquée (`security_invoker`) |
| C | `process.env.DATABASE_URL!` en trois endroits. `postgres(undefined)` ne lève pas : la bibliothèque retombe sur ses défauts et tente de se connecter à `localhost:5432` avec l'utilisateur du système — donc à une **autre** base de la machine | réponse fausse et silencieuse au lieu d'un refus | Refus immédiat avec le message qui oriente, dans le client, l'audit et le seed |
| D | **Le seed calculait ses échéances en jours calendaires** alors que le lancement réel les calcule en jours **ouvrés**. Le jeu de démonstration contenait donc des échéances que le produit ne peut pas produire — deux tombaient un samedi, mesurées | incohérence entre la démonstration et le produit | Le seed appelle `addBusinessDays`, la même fonction que l'action de lancement, et ses dates d'arrivée sont elles aussi des jours ouvrés. Vérifié en base après reconstruction : **0 échéance un week-end** |
| E | Toutes les tâches terminées étaient datées de `new Date()`, l'instant du seed. Sur le parcours clôturé il y a trois jours, elles étaient donc terminées **après** la clôture du parcours — lisible tel quel dans le journal d'activité | donnée incohérente, visible | Datées du matin de leur échéance, plafonnées à la clôture. Vérifié : **0 tâche terminée après la clôture de son parcours** |
| F | Le récapitulatif du seed annonçait « 1 parcours avec 3 retards ». C'était vrai — par accident du calcul calendaire, qui rendait l'écart constant. En jours ouvrés, le nombre dépend du jour de la semaine | un chiffre affirmé plutôt que mesuré | Le récapitulatif **compte** en base : parcours, retards, et échéances tombant un week-end. Il rapporte au lieu d'affirmer |
| G | Le jeton de l'invitation de démonstration était en dur dans le dépôt (`seed-invitation-token-4f2a9c`). Quiconque lit le code pouvait ouvrir `/invitations/<jeton>`, s'inscrire et devenir membre de l'organisation de démonstration | secret inutile, sans effet en local mais du genre qui survit jusqu'à la mise en ligne | `randomBytes(24)` à chaque exécution |
| H | `invitations_token_idx` était un doublon **exact** de l'index créé par la contrainte `invitations_token_unique` : même table, même colonne, même méthode. Confirmé en comparant les deux `indexdef` dans `pg_indexes` | coût d'écriture pour rien | Retiré de `schema.ts`, migration `0003` |
| I | `src/server/db/queries/index.ts` affirme une garantie mécanique — « toute fonction exportée ici exige un `organizationId` » — qui reposait sur une omission tacite : `members-lookup` n'est pas ré-exporté. Une ligne ajoutée de bonne foi ouvrait une lecture d'emails non scopée | documentation incomplète sur un point de sécurité | L'omission est désormais écrite et motivée dans le fichier |

### Une piste ouverte, mesurée, puis abandonnée

Les trois unions de statuts de `src/types/index.ts` recopient des `pgEnum`. Je
les ai dérivées du schéma — `(typeof taskStatus.enumValues)[number]` — au motif
qu'une duplication finit toujours par diverger.

**La contre-épreuve a dit le contraire.** En ajoutant une valeur à
l'énumération `task_status` : **4 erreurs de compilation** avec les unions
écrites à la main, **1 seule** avec la version dérivée. Les unions manuelles ne
sont pas une copie à synchroniser, ce sont un contrat que la frontière avec la
base doit satisfaire ; les dériver élargit le type tout seul et fait taire
justement l'endroit qui devait protester.

Annulé. Le raisonnement est écrit en tête du fichier pour que personne — moi
compris — ne refasse la manœuvre.

### Sept tests qui regardent la base, pas le code

`src/server/db/schema.db.test.ts` transforme mes vérifications manuelles en
contrôles rejouables : les dix tables, les index déclarés présents en base, les
index en base **encore** déclarés, le caractère partiel de `tasks_due_date_todo_idx`,
le refus total, l'absence de vue, et les trois colonnes de date qui doivent
rester des `date`.

La liste des tables et des index est **prise dans `schema.ts`** par
`getTableConfig`, pas recopiée : une table ajoutée sans son RLS fait échouer les
tests d'elle-même.

Chacun a été validé par mutation, en cassant la base puis en la réparant :
index supprimé, index orphelin, index partiel remplacé par un index complet du
même nom, policy permissive, vue, colonne passée en `timestamptz`. **Six
mutations, six échecs d'un seul test à chaque fois.** Et la plus importante — une
table ajoutée sans RLS : la clé anon lisait son contenu, l'audit et les tests
l'ont signalée tous les deux.

### Vérifié et conforme

Les **19** clés étrangères correspondent une à une aux `on delete` déclarés
dans `schema.ts` · aucune des quatre migrations ne touche au schéma `auth`, et
`auth.users` reste importée sans être ré-exportée, ce qui empêche drizzle-kit de
la régénérer · les **12** index déclarés et les 2 contraintes d'unicité de
colonne existent tous en base, et `memberships_user_idx` a bien disparu ·
l'index partiel est **réellement utilisé** — `EXPLAIN (analyze)` sur 40 000
tâches donne `Bitmap Index Scan on tasks_due_date_todo_idx`, 10 blocs lus pour
7 903 lignes trouvées, la condition `status = 'todo'` étant satisfaite par le
prédicat de l'index · les **14** fonctions de lecture exigent toutes un
`organizationId` en premier paramètre · les journaux et instantanés de Drizzle
sont cohérents avec les quatre migrations · la table de suivi des migrations
vit dans le schéma `drizzle`, pas dans `public` — l'exclusion qu'en faisait
l'audit ne servait donc à rien et a été retirée · les 4 corrections de
`config.toml` sont exactes et documentées.

**Le test RLS pour de vrai**, avec la clé anon récupérée par `supabase status` :
les 10 tables renvoient `[]` alors qu'elles contiennent des lignes (1
organisation, 3 membres, 4 parcours, 35 tâches), et une écriture est refusée par
`42501` sans créer de ligne.

Un second `pnpm db:seed` échoue au premier utilisateur avec un message clair et
n'écrit rien — comportement conservé tel quel.

Tests d'intégration : 43 → **50**. Unitaires 79, end-to-end 3, `lint` et
`typecheck` propres.

## Partie 11 — Tests et outillage · relue et corrigée

Relire ses propres tests est la partie la plus inconfortable de cet audit : un
test vert donne le sentiment d'une garantie. Deux n'en donnaient aucune.

| # | Constat | Nature | Traitement |
|---|---|---|---|
| A | **`src/server/auth/session.ts` n'était jamais testé, seulement simulé** — et la simulation **recopiait sa logique**, vérification du rôle comprise. Si le vrai `requireAdmin` cessait de vérifier le rôle, toute la suite restait verte. Le test « un membre simple ne peut pas inviter » ne prouvait qu'une chose : que l'action *appelle* `requireAdmin`. C'est le module qui porte la décision n° 4, dont dépend toute l'isolation | trou de couverture sur la pièce la plus sensible | Nouveau fichier `session.db.test.ts`, **11 tests**. Une seule chose y est simulée : `createSupabaseServerClient`, qui lit des cookies HTTP inexistants hors serveur. Le reste est réel — base, résolution du membership, deux redirections, contrôle du rôle. **Validé par mutation** : neutraliser le contrôle de rôle, confondre `/login` et `/welcome`, ou retirer le filtre sur l'utilisateur fait échouer 1, 1 et 5 tests |
| B | **Le test « tous les types écrits sont connus de la timeline » ne pouvait pas échouer.** Il lisait les types présents en base et les comparait à une liste recopiée à la main — or `type` est une colonne d'énumération : Postgres refuse déjà toute autre valeur. Il prétendait couvrir « un type non traduit s'afficherait brut à l'écran » sans jamais regarder la carte des libellés | test qui passe sans rien vérifier | La cause était un typage trop large : `LABEL: Record<string, …>`. Devenu `Record<ActivityEventType, …>`, dérivé de l'énumération — **le compilateur exige maintenant un libellé par type**. Plus trois tests unitaires sans base, et le test d'intégration réécrit pour vérifier le troisième côté du triangle : ce que les actions écrivent réellement. Mutation : retirer un libellé casse la compilation **et** 3 tests ; un libellé qui recopie le type brut en casse 1 |
| C | **La famille d'entrée « invalide » n'était testée qu'en un seul endroit** (`addStep`), alors que le correctif `readId` avait été appliqué à 22 sites. Une action qui oublierait la validation repassait donc inaperçue — exactement le bug qui a cassé `/journeys/j-clara` | couverture absente sur la classe de bug la plus coûteuse du projet | 31 tests couvrant les trois familles — valide, uuid inexistant, chaîne mal formée — sur les 15 actions d'écriture. **Mesuré** : neutraliser la validation d'uuid faisait échouer **1** test avant, **14** maintenant |
| D | **Les fixtures laissaient les comptes de test derrière elles.** `destroyTestOrg` supprime l'organisation, la cascade emporte les memberships, jamais les comptes. Relevé en base : **232 lignes dans `auth.users`** pour 3 comptes de démonstration | le point de contrôle « pas de comptes orphelins » échouait | `cleanupTestUsers()`, appelée dans les deux `afterAll`. Après : **3 comptes**. Deux garde-fous, parce qu'une suppression ne se rejoue pas — le domaine `@test.local` propre aux fixtures, et l'absence de membership. Vérifiés par un test qui crée un orphelin et un compte rattaché, et contrôle que seul le premier disparaît |
| E | Une assertion `.resolves.not.toThrow()` appliquée à une valeur qui n'est pas une fonction : le sens n'était pas clair, donc la garantie non plus. **Défaut de mes propres tests, écrit une heure plus tôt** | assertion floue | `resolves.toBeUndefined()` — vérifiable, et une exception fait échouer le test de toute façon puisque `.resolves` refuse une promesse rejetée |
| F | Le nettoyage end-to-end retournait en silence si `DATABASE_URL` était absente. Un nettoyage silencieux est un nettoyage qui n'a pas eu lieu | refus silencieux | Message d'avertissement explicite |
| G | `setup-env.ts` ne contrôlait que `DATABASE_URL`, alors que les fixtures créent leurs comptes par l'API d'inscription : sans les deux clés Supabase, l'échec survenait plus tard, avec un message qui ne désignait pas la cause | diagnostic tardif | Les trois variables sont contrôlées avant le premier test |
| H | Le test de non-débordement ne couvrait que la page publique et la connexion, alors que l'exigence porte sur tout le produit | couverture partielle | Étendu aux cinq écrans applicatifs. **Aucun défaut trouvé** — les pages sont correctes. Le test est donc de la couverture, pas une correction, et je le dis. Sa capacité à échouer est prouvée : à 200 px de large, il signale bien les débordements |

### Une hypothèse fausse, corrigée en cours de route

J'ai justifié l'extension du test de débordement par « le tableau en
`min-w-[640px]` vit sur les pages applicatives, là où rien n'est testé ». Faux :
`grep` le place sur la page publique, déjà couverte. L'extension reste utile,
mais pour une autre raison que celle que j'avais avancée.

### Vérifié et conforme

`pnpm verify` **ne dépend ni de Docker ni d'un serveur**, et c'est démontrable :
la configuration unitaire n'a pas de `setupFiles`, donc `.env.local` n'y est pas
chargée — le refus sur `DATABASE_URL` ajouté en partie 10 sert alors de
détecteur. Une sonde important `@/server/db` dans un test unitaire échoue
immédiatement ; sans elle, les 82 tests passent. Aucun test unitaire ne touche
donc la base.

**Indépendance à l'ordre** : `--sequence.shuffle` trois fois de suite sur les
tests d'intégration, 86 verts à chaque fois, et une fois sur les unitaires.

Le nettoyage end-to-end filtre sur `subject_name like 'E2E %'` et
`name like 'Parcours E2E %'` : aucun nom du jeu de démonstration ne peut
correspondre · les deux configurations Vitest sont bien disjointes, `pnpm test`
excluant `*.db.test.ts` · `fileParallelism: false` est nécessaire puisque les
fichiers partagent une base · le parcours end-to-end passe par mot de passe, et
la raison est écrite : il n'existe pas d'OTP de test pour l'email chez Supabase.

Les tests d'isolation les plus importants ont été rejoués sous mutation :
retirer un filtre d'organisation, neutraliser la validation d'identifiant,
casser le contrôle de rôle — chaque fois, la suite le voit.

Total : **82** tests unitaires (79 → 82), **86** d'intégration (43 → 86), **4**
end-to-end (3 → 4). `lint` et `typecheck` propres.

**Réserve assumée** : `pnpm build` n'a pas été relancé pendant cette session, le
serveur de développement tournant — la combinaison a déjà corrompu le cache
Turbopack une fois. À faire avant la mise en ligne, serveur arrêté.
