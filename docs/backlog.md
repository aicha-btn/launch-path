# Backlog — LaunchPath

Une ligne = une unité de travail terminable en une session.
Les préfixes seront réutilisés comme messages de commit à la phase 12.

## Semaine 0 — Cadrage

- [ ] `docs: rédiger product-brief.md avec mes mots` — **à faire par moi**, section 1 du plan
- [ ] `docs: rédiger screens.md` — section 4 du plan
- [ ] `docs: rédiger data-model.md` — section 3 du plan
- [ ] `docs: rédiger decisions.md` — les 7 décisions d'architecture, une ligne + le pourquoi
- [x] `docs: design system complet` → `docs/design-system.md`

## Semaine 1 — Squelette navigable

- [x] `chore: initialisation Next.js 16, Tailwind 4, TypeScript strict`
- [x] `chore: tokens du design system et trois familles typographiques`
- [x] `feat: glyphe, logotype et favicon`
- [x] `feat: helper de dates en fuseau métier Europe/Paris`
- [x] `feat: types du domaine et données fictives relatives à aujourd'hui`
- [x] `feat: shell applicatif (sidebar bleu offset, responsive)`
- [x] `feat: composants signature (Masthead, Folio, Stamp, LedgerRow)`
- [x] `feat: écran de connexion`
- [x] `feat: dashboard, liste des onboardings, détail, mes tâches, templates, équipe`
- [x] `feat: états de chargement, d'erreur et 404`
- [x] `chore: toasts sonner montés`
- [x] `chore: script pnpm verify`
- [ ] `fix: décider du port de développement` — Supabase Auth attend `localhost:3000`, occupé par un autre projet
- [ ] `chore: vérifier le responsive à 390 px dans un vrai navigateur`

## Semaine 2 — Base de données, authentification, membres

- [x] `chore: stack Supabase locale et les 4 corrections de config.toml`
- [x] `chore: schéma Drizzle (10 tables), migration, RLS deny-all`
- [x] `chore: script db:reset et db:audit (vérification mécanique du RLS)`
- [x] `feat: authentification magic link, proxy, création d'organisation`
- [x] `feat: accès démonstration en un clic`
- [x] `feat: couche d'envoi d'email vers la boîte locale`
- [x] `feat: invitation, acceptation, annulation et retrait de membres`
- [x] `feat: écran Équipe branché sur la vraie base`

## Landing publique (hors plan initial)

- [x] `feat: landing publique, app déplacée sur /dashboard`
- [x] `feat: en-tête et pied de page marketing`

## Semaine 3 — Templates

- [x] `refactor: lectures scopées par organisation dans queries/`
- [x] `feat: tous les écrans branchés sur la vraie base`
- [x] `feat: compteurs du dashboard calculés en SQL`
- [x] `fix: filtre des parcours actifs descendu en SQL`
- [x] `fix: toBusinessDate() — trois affichages de date étaient en UTC`
- [x] `feat: création d'un template avec ses étapes dans le même écran`
- [x] `feat: éditeur d'étapes (ordre, délais, responsables)`
- [x] `feat: archivage et réactivation d'un template`

## Semaine 4 — Cœur métier

- [x] `chore: Vitest configuré, tests branchés dans pnpm verify`
- [x] `test: 14 tests sur addBusinessDays, écrits AVANT l'implémentation`
- [x] `feat: calcul des échéances en jours ouvrés`
- [x] `feat: lancement d'un onboarding en transaction, avec snapshot`
- [x] `feat: prévisualisation des échéances avant validation`
- [x] `feat: complétion optimiste et recalcul du statut dans les deux sens`
- [x] `feat: annulation et réactivation d'un onboarding, étapes ignorées`
- [x] `fix: validation des responsables contre les membres de l'organisation`
- [x] `feat: panneau de détail de tâche piloté par l'URL`
- [x] `feat: commentaires et historique d'activité`
- [x] `refactor: LedgerRow et TaskRow unifiés en un seul composant`

## Semaine 5 — Dashboard et automatisation

- [x] `feat: métriques du dashboard calculées en SQL`
- [x] `feat: recherche, filtres et tri, entièrement pilotés par l'URL`
- [x] `fix: sous-requêtes SQL brutes dans le constructeur relationnel Drizzle`
- [x] `feat: couche d'envoi d'email et quatre modèles`
- [x] `feat: email d'assignation au lancement, un seul par personne`
- [x] `feat: route de rappels idempotente et script pnpm reminders`
- [ ] `feat: React Email à la place du HTML inline` — différé, non bloquant

## Semaine 6 — Qualité

- [x] `test: 14 tests unitaires sur le calcul des échéances`
- [x] `test: 18 tests d'intégration (lancement, isolation, invitations, statut)`
- [x] `test: parcours end-to-end Playwright avec nettoyage automatique`
- [x] `fix: deux tests qui passaient sans rien vérifier`
- [x] `chore: seed de démonstration complet`
- [x] `docs: README complet`
- [x] `docs: setup.md testé`
- [ ] `docs: captures d'écran et GIF` — à faire à la main
- [ ] `docs: rédiger les 4 documents de cadrage avec mes mots` — exercice personnel

## Différé — phase 12

GitHub, CI, Vercel, Supabase cloud, Resend, Sentry.
