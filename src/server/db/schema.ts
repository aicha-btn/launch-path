import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ==========================================================================
   Schéma applicatif — docs/plan_action_launchpath.md § 3

   Deux règles structurantes :

   1. Drizzle est propriétaire du schéma applicatif, Supabase est propriétaire
      du schéma `auth` (décision n° 6). Le schéma `auth` est déclaré ici en
      LECTURE SEULE, uniquement pour pouvoir y référencer `auth.users`.
      Une migration qui tenterait de le créer ou de le modifier casserait
      l'authentification.

   2. Toutes les tables activent RLS sans policy (décision n° 5). Voir la
      migration `0001_enable_rls.sql` : sans elle, l'API REST auto-générée
      de Supabase expose tout via la clé anon, qui est publique.
   ========================================================================== */

/**
 * Table d'authentification de Supabase, importée mais VOLONTAIREMENT NON
 * RÉ-EXPORTÉE : drizzle-kit collecte les tables via les exports de ce
 * fichier, et l'exporter ferait générer un `CREATE TABLE "auth"."users"`
 * qui écraserait la table de connexion. Voir auth-users.ts pour le détail.
 *
 * Les clés étrangères qui la référencent sont, elles, bien générées.
 */
import { authUsers } from "./auth-users";

/* ------------------------------------------------------------------ */
/* Énumérations                                                        */
/* ------------------------------------------------------------------ */

export const membershipRole = pgEnum("membership_role", ["admin", "member"]);
export const targetType = pgEnum("target_type", ["employee", "customer"]);
export const journeyStatus = pgEnum("journey_status", [
  "active",
  "completed",
  "cancelled",
]);
export const taskStatus = pgEnum("task_status", ["todo", "done", "skipped"]);
export const notificationKind = pgEnum("notification_kind", [
  "assigned",
  "due_soon",
  "overdue",
]);
export const activityType = pgEnum("activity_type", [
  "journey_launched",
  "journey_cancelled",
  "task_completed",
  "task_reopened",
  "task_skipped",
  "task_assigned",
  "task_due_date_changed",
  "comment_added",
]);

/* ------------------------------------------------------------------ */
/* Organisations et membres                                            */
/* ------------------------------------------------------------------ */

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_org_user_key").on(t.organizationId, t.userId),
    /**
     * UNIQUE sur `user_id` seul, et c'est délibéré.
     *
     * Deux rôles en un :
     *
     *   1. Cet index sert la requête la plus fréquente de l'application —
     *      résoudre l'organisation à partir de l'utilisateur. La contrainte
     *      ci-dessus ne le fait pas : sa colonne de tête est organization_id.
     *
     *   2. Il ENFORCE la règle « un utilisateur appartient à une seule
     *      organisation », qui n'était jusqu'ici qu'un commentaire et une
     *      vérification applicative avec une fenêtre de concurrence : un
     *      double envoi du formulaire de création pouvait produire deux
     *      organisations. Comme pour l'idempotence du cron, c'est la base qui
     *      arbitre, pas le code.
     *
     * À retirer le jour où le multi-organisation sortira du hors-MVP.
     */
    uniqueIndex("memberships_user_key").on(t.userId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: membershipRole("role").notNull().default("member"),
    /** Identifiant aléatoire long. Jamais l'email, jamais l'id. */
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    /**
     * Pas d'index sur `token` ici : le `.unique()` de la colonne en crée déjà
     * un (`invitations_token_unique`), et c'est lui qui sert la recherche par
     * jeton. Le second index déclaré au départ était un doublon exact —
     * même colonne, même méthode — payé à chaque écriture pour rien.
     * Vérifié dans `pg_indexes` : les deux définitions étaient identiques.
     */
    // Une seule invitation en attente par email et par organisation.
    // L'index partiel autorise de réinviter quelqu'un dont l'invitation
    // précédente a été acceptée.
    uniqueIndex("invitations_pending_key")
      .on(t.organizationId, t.email)
      .where(sql`accepted_at is null`),
  ],
);

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  targetType: targetType("target_type").notNull().default("employee"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const templateSteps = pgTable(
  "template_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull(),
    /** Relatif au démarrage. Négatif = avant l'arrivée. */
    offsetDays: integer("offset_days").notNull().default(0),
    defaultAssigneeId: uuid("default_assignee_id").references(
      () => authUsers.id,
      { onDelete: "set null" },
    ),
  },
  (t) => [index("template_steps_template_idx").on(t.templateId, t.position)],
);

/* ------------------------------------------------------------------ */
/* Parcours lancés                                                     */
/* ------------------------------------------------------------------ */

export const journeys = pgTable(
  "journeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Le template peut être archivé ou supprimé : l'historique survit. */
    templateId: uuid("template_id").references(() => templates.id, {
      onDelete: "set null",
    }),
    /** Snapshot du nom au lancement — décision n° 1. Sans lui, la page
        détail affiche un nom vide dès que le template disparaît. */
    templateName: text("template_name").notNull(),
    subjectName: text("subject_name").notNull(),
    subjectEmail: text("subject_email"),
    ownerId: uuid("owner_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    /** Jour civil, jamais un timestamp — décision n° 2. */
    startDate: date("start_date").notNull(),
    status: journeyStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [index("journeys_org_status_idx").on(t.organizationId, t.status)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    /** Référence un utilisateur, pas un membership — décision n° 7.
        Retirer un membre ne désassigne donc PAS automatiquement :
        c'est `removeMember()` qui doit le faire explicitement. */
    assigneeId: uuid("assignee_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    position: integer("position").notNull(),
    dueDate: date("due_date").notNull(),
    status: taskStatus("status").notNull().default("todo"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("tasks_journey_position_idx").on(t.journeyId, t.position),
    index("tasks_assignee_status_idx").on(t.assigneeId, t.status),
    // Index partiel : la détection des retards ne regarde que les tâches
    // à faire. Inutile d'indexer les milliers de tâches déjà terminées.
    index("tasks_due_date_todo_idx")
      .on(t.dueDate)
      .where(sql`status = 'todo'`),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("comments_task_idx").on(t.taskId, t.createdAt)],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journeyId: uuid("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    type: activityType("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("activity_events_journey_idx").on(t.journeyId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Relations — purement TypeScript, aucun SQL généré.                  */
/* Elles servent aux requêtes imbriquées `db.query.x.findMany({ with })`. */
/* ------------------------------------------------------------------ */

export const journeysRelations = relations(journeys, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  journey: one(journeys, {
    fields: [tasks.journeyId],
    references: [journeys.id],
  }),
  comments: many(comments),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  steps: many(templateSteps),
}));

export const templateStepsRelations = relations(templateSteps, ({ one }) => ({
  template: one(templates, {
    fields: [templateSteps.templateId],
    references: [templates.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
}));

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    kind: notificationKind("kind").notNull(),
    /** Jour civil de l'envoi. C'est cette colonne dans la clé unique qui
        rend le cron idempotent : deux exécutions le même jour n'envoient
        qu'une fois. Corollaire assumé : une tâche en retard génère un
        rappel PAR JOUR tant qu'elle n'est pas traitée. */
    sentOn: date("sent_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("notification_logs_key").on(t.taskId, t.kind, t.sentOn),
  ],
);
