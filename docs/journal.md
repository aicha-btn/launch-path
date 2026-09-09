# Journal de bord — LaunchPath

Une entrée par session. Ce fichier alimentera la section « difficultés
rencontrées » du README et servira de base aux réponses d'entretien.

---

## 2026-08-09 — Un bug trouvé en trente secondes par un utilisateur

**Le symptôme** : `/journeys/j-clara` affichait un squelette de chargement
infini. Ni erreur, ni 404, rien.

**Trois causes empilées**

1. `j-clara` était l'identifiant des **données fictives**. Depuis le
   branchement sur la vraie base, les parcours ont des UUID. Un vieux lien
   donc — le cas le plus banal du monde.
2. Les colonnes `id` sont de type `uuid` : Postgres ne renvoie pas zéro ligne
   pour une valeur mal formée, il **lève une erreur** `22P02`. `getJourney` ne
   renvoyait donc jamais `null`, et `notFound()` n'était jamais appelé.
3. `loading.tsx` avait déjà lancé le flux de réponse, donc la frontière
   d'erreur ne pouvait plus s'afficher. J'avais documenté en semaine 1 que le
   flux empêchait un vrai code 404 — sans réaliser qu'il **masque aussi les
   erreurs**. C'est la conséquence que j'avais manquée.

**Corrigé** : `isUuid()` dans `src/server/db/queries/ids.ts`, appliqué à
`getJourney`, `getTemplate`, `getTaskDetail` et `getJourneyActivity`. Plus 8
tests unitaires, dont le cas exact `j-clara`.

**Ce que ça dit de mes tests**

33 tests, et aucun ne passait un identifiant **mal formé**. Je testais
« inexistant mais valide » (`00000000-0000-…`), jamais « invalide ». Le trou
n'était pas dans le code, il était dans mon imagination des cas d'usage.

Leçon à retenir : pour chaque entrée venant de l'URL, tester trois familles —
valide et existante, valide et inexistante, **invalide**. La troisième est
celle qu'on oublie, et c'est la première qu'un utilisateur produit.

**Bonus** : le serveur de développement était aussi corrompu
(`TurbopackInternalError: Cell … no longer exists`) parce que j'avais lancé
`pnpm build` des dizaines de fois pendant que `pnpm dev` tournait — les deux
partagent `.next`. Noté dans `docs/setup.md`.

---

## 2026-08-08 (suite) — Cœur métier, automatisation, qualité

**Fait**

- Templates : création avec étapes, éditeur d'ordre, archivage
- Lancement d'un onboarding en transaction, avec snapshot et aperçu des échéances
- Complétion optimiste, recalcul du statut dans les deux sens, annulation
- Panneau de détail piloté par `?task=`, commentaires, historique
- Recherche, filtres et tri — tout en SQL, tout dans l'URL
- Emails d'assignation et de rappel, route de cron idempotente
- 14 tests unitaires, 18 d'intégration, 1 parcours end-to-end
- README et `docs/setup.md`

**Appris**

- Dans `db.query.x.findMany`, Drizzle **réécrit** les références de colonnes
  d'un fragment `sql` brut en les préfixant de l'alias de la table extérieure.
  `${tasks.journeyId}` devenait `"journeys"."journey_id"` → erreur 42703.
  Solution : SQL littéral avec alias explicites.
- Recharger la page juste après un clic **annule la Server Action en vol**. La
  mise à jour optimiste change l'interface avant que le serveur ait répondu :
  s'y fier pour savoir « c'est fait » est une erreur, en test comme en usage.
- `onConflictDoNothing().returning()` est la bonne façon d'obtenir
  l'idempotence : c'est la BASE qui arbitre, donc deux appels concurrents ne
  peuvent pas doubler. Un `if (déjà envoyé ?)` en JavaScript ne le garantirait
  pas.

**Deux tests qui passaient sans rien tester**

- Invitation expirée : je simulais « connecté sans organisation » avec un objet
  dont `organizationId` valait `""` — donc **truthy**. L'action redirigeait vers
  le dashboard avant d'atteindre la vérification d'expiration. Le `.catch()`
  avalait le reste. Réécrit avec un membership réellement `null`.
- Un seul email par personne : le gabarit n'assignait qu'une seule étape, donc
  « destinataires uniques == nombre de destinataires » était vrai
  trivialement. Gabarit corrigé pour assigner deux étapes à la même personne.

**Vérifié par mutation, pas seulement par exécution**

Retirer le filtre par organisation dans `launchJourney` fait échouer le test
d'isolation ; le remettre le fait passer. Un test qui passe ne prouve rien
tant qu'on n'a pas vu qu'il sait échouer.

**Habitude à surveiller**

Quatre fois, j'ai écrit un `void x;` ou un export bidon pour masquer un import
inutilisé au lieu de le retirer. Corrigé chaque fois, mais c'est le lint qui
l'a rattrapé — argument de plus pour les garde-fous mécaniques plutôt que
pour la discipline.

---

## 2026-08-08 — Landing publique et authentification

**Fait**

- Landing publique sur `/`, l'app déplacée sur `/dashboard`, deux groupes de
  routes : `(marketing)` et `(app)`
- Base de données réelle : 10 tables, RLS deny-all, `pnpm db:reset` complet
- Authentification Supabase : magic link, `proxy.ts`, `requireMembership()`,
  création d'organisation, accès démo en un clic, déconnexion

**Appris**

- `schemaFilter: ["public"]` dans drizzle.config **ne protège pas** le schéma
  `auth` : il ne filtre que l'introspection, pas la génération. La migration
  générée contenait bien `CREATE TABLE "auth"."users"`. La solution vérifiée :
  **ne pas exporter** la déclaration de la table — drizzle-kit collecte les
  tables via les exports du fichier. Les clés étrangères restent générées.
- Le conteneur `supabase_inbucket_*` fait tourner **Mailpit**, pas Inbucket.
  La clé de config a gardé l'ancien nom. L'API est donc
  `GET /api/v1/messages` puis `/api/v1/message/<id>`.
- Next 16 déprécie `middleware.ts` au profit de `proxy.ts`, avec un export
  par défaut.
- Une Server Action utilisée directement comme `action` de formulaire doit
  renvoyer `void`. Pour signaler une erreur, il faut soit rediriger avec un
  paramètre, soit passer par `useActionState`.
- Le conteneur `vector` de la pile analytique Supabase monte le socket Docker,
  ce que virtiofs de Colima refuse. Analytique désactivée : inutile ici.

**Vérifié plutôt que supposé**

- 44 lignes en base, et la clé anon publique renvoie `[]` sur chaque table.
- `/dashboard` sans session renvoie 307 vers `/login?suivant=%2Fdashboard`.
- Le magic link reçu dans Mailpit redirige bien vers `localhost:3200`.

**Décidé**

- Le compte de démonstration se connecte en un clic depuis `/login`. Sans ce
  raccourci, un visiteur venu de la landing buterait sur un formulaire.
- Le pied de page de la landing indique que les tarifs sont illustratifs :
  la page en affiche, aucun service commercial n'existe derrière.
- Pas de faux témoignages ni de faux logos clients : remplacés par un tableau
  comparatif et une FAQ, qui convertissent mieux et n'inventent rien.

**Prochaine fois**

- Flux d'invitation complet (table prête, écran et email à faire)
- Brancher les écrans sur la vraie base — ils lisent encore les mocks

---

## 2026-08-07 — Cadrage et semaine 1

**Fait**

- Plan d'action complet du projet, révisé une fois : `docs/plan_action_launchpath.md`
- Questionnaire de direction artistique, puis design system : `docs/design-system.md`
- Direction retenue : **brutalisme éditorial**, puis passage en **trichromie**
  (noir, bleu offset, jaune signal) parce que le monochrome manquait de couleur
- Squelette Next.js 16 + Tailwind 4, tokens du design system, trois polices
- 11 routes : dashboard, onboardings, détail, mes tâches, templates, équipe,
  connexion, 404, erreur, chargement
- Composants signature : `Masthead`, `Folio`, `Stamp`, `LedgerRow`

**Appris**

- Un `page.tsx` à la racine de `app/` et un `page.tsx` dans un groupe de routes
  `(app)/` résolvent tous les deux `/` → conflit de route. Il faut supprimer le
  premier.
- Les types de routes générés par Next dans `.next/types` restent en cache après
  la suppression d'une page : `pnpm typecheck` échoue jusqu'au prochain `build`.
- Supabase expose une API REST automatique sur toutes les tables du schéma
  `public`. Sans RLS, la clé anon — publique par nature — donne accès à tout.
  C'est invisible en local, et c'est une fuite de données en production.
- `supabase db dump` cible le projet **distant** par défaut. Le flag `--local`
  est obligatoire, et un dump sans option ne contient que le schéma.

- Un `loading.tsx` crée une frontière Suspense : la réponse part en flux avec un
  statut 200 déjà écrit, donc `notFound()` ne peut plus renvoyer un vrai 404.
  Vérifié par test — 404 sans le fichier, 200 avec. **Arbitrage assumé** : on
  garde le squelette, parce que l'application est derrière une authentification
  et qu'aucun robot ne l'indexera. L'interface 404 s'affiche correctement, seul
  le code HTTP est faux. À corriger si un écran devenait public un jour.

**Bloqué**

- 20 min sur une « redirection vers login » qui n'en était pas une :
  `localhost:3000` était occupé par un autre projet, LaunchPath tournait sur
  `3002`. Réflexe à prendre : vérifier le `<title>` de la page avant de
  soupçonner le code.

**Décidé**

- Le rouge ne dit qu'une chose : le retard. Les autres états sont des marques
  typographiques (barré, souligné, estompé), pas des couleurs. Bénéfice
  secondaire : lisible sans percevoir les couleurs.
- `src/lib/dates.ts` est le seul endroit du projet qui appelle `new Date()`.
- Les données fictives sont **relatives à aujourd'hui**, jamais figées.

**Prochaine fois**

- Trancher le port de développement (Supabase Auth attend `localhost:3000`)
- Écrire les quatre documents de cadrage avec mes mots
- Semaine 2 : Supabase local, schéma Drizzle, RLS, authentification
