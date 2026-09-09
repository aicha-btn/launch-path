-- ==========================================================================
-- RLS deny-all sur toutes les tables applicatives.
-- Décision d'architecture n° 5 — docs/plan_action_launchpath.md
--
-- POURQUOI CETTE MIGRATION EXISTE
--
-- Supabase expose automatiquement une API REST sur toutes les tables du
-- schéma `public` (config.toml : schemas = ["public", "graphql_public"]).
-- La clé anon est publique par nature : elle part dans le bundle navigateur
-- via NEXT_PUBLIC_SUPABASE_ANON_KEY.
--
-- Sans RLS, n'importe qui peut lire et écrire `journeys`, `tasks` ou
-- `memberships` en appelant /rest/v1/<table>, en contournant totalement
-- getCurrentMembership(). Tout le travail d'isolation par organisation
-- deviendrait décoratif.
--
-- Le piège est parfait : EN LOCAL ÇA NE SE VOIT PAS. Le problème
-- n'apparaîtrait qu'au déploiement, quand on ne le cherche plus.
--
-- COMMENT ÇA MARCHE
--
-- Activer RLS sans écrire AUCUNE policy équivaut à un refus total pour les
-- rôles `anon` et `authenticated`. L'application continue de fonctionner
-- parce que le serveur se connecte via DATABASE_URL avec le rôle `postgres`,
-- propriétaire des tables, qui contourne RLS.
--
-- À METTRE À JOUR À CHAQUE NOUVELLE TABLE, sans exception.
-- Vérification mécanique : `pnpm db:audit`
-- ==========================================================================

alter table "organizations"     enable row level security;--> statement-breakpoint
alter table "memberships"       enable row level security;--> statement-breakpoint
alter table "invitations"       enable row level security;--> statement-breakpoint
alter table "templates"         enable row level security;--> statement-breakpoint
alter table "template_steps"    enable row level security;--> statement-breakpoint
alter table "journeys"          enable row level security;--> statement-breakpoint
alter table "tasks"             enable row level security;--> statement-breakpoint
alter table "comments"          enable row level security;--> statement-breakpoint
alter table "activity_events"   enable row level security;--> statement-breakpoint
alter table "notification_logs" enable row level security;
