/**
 * Ascendra Agency Operating System Core — internal delivery layer.
 *
 * - Distinct from: portfolio `projects`, CRM `crm_tasks` (lead follow-ups), and
 *   `client_service_agreement_milestones` (client SOW / billing).
 * - Optional links to CRM and agreements via integer FKs (no circular import to users table).
 *
 * @see Docs/implementation/ASCENDRA-AGENCY-OS-CORE-AUDIT-AND-PLAN.md
 */
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

/** Canonical HVD category slugs (extend via new rows; seed nine defaults). */
export const AOS_HVD_CATEGORY_SLUGS = [
  "market_intelligence",
  "offer_validation",
  "conversion_funnel",
  "lead_capture_crm",
  "traffic_acquisition",
  "booking_conversion",
  "growth_intelligence",
  "revenue_optimization",
  "content_authority",
] as const;

export type AosHvdCategorySlug = (typeof AOS_HVD_CATEGORY_SLUGS)[number];

export const AOS_VALUE_CONTRIBUTION_KEYS = [
  "leads",
  "conversions",
  "revenue",
  "retention",
  "efficiency",
  "visibility",
  "training",
] as const;

/** Registry of High-Value Delivery definitions (built-in rows + custom). */
export const aosHvdRegistry = pgTable(
  "aos_hvd_registry",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** Guidance for expected outcome / metric wording. */
    defaultOutcomeHints: text("default_outcome_hints"),
    sortOrder: integer("sort_order").notNull().default(0),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("aos_hvd_registry_slug_uidx").on(t.slug)],
);

export type AosHvdRegistryRow = typeof aosHvdRegistry.$inferSelect;
export type InsertAosHvdRegistryRow = typeof aosHvdRegistry.$inferInsert;

/** Strategist, Developer, … + custom agency roles. */
export const aosExecutionRoles = pgTable(
  "aos_execution_roles",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    responsibilities: json("responsibilities").$type<string[]>().notNull().default([]),
    taskTypes: json("task_types").$type<string[]>().notNull().default([]),
    systemsUsed: json("systems_used").$type<string[]>().notNull().default([]),
    aiFocus: text("ai_focus"),
    sortOrder: integer("sort_order").notNull().default(0),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("aos_execution_roles_key_uidx").on(t.key)],
);

export type AosExecutionRole = typeof aosExecutionRoles.$inferSelect;
export type InsertAosExecutionRole = typeof aosExecutionRoles.$inferInsert;

/** Maps admin users to one or more execution roles. */
export const aosUserExecutionRoles = pgTable(
  "aos_user_execution_roles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    roleId: integer("role_id")
      .notNull()
      .references(() => aosExecutionRoles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("aos_user_execution_roles_uidx").on(t.userId, t.roleId),
    index("aos_user_execution_roles_user_idx").on(t.userId),
  ],
);

export type AosUserExecutionRole = typeof aosUserExecutionRoles.$inferSelect;

/** Standard operating procedure — linked from tasks. */
export const aosSops = pgTable("aos_sops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  executionRoleId: integer("execution_role_id").references(() => aosExecutionRoles.id, {
    onDelete: "set null",
  }),
  primaryHvdSlug: text("primary_hvd_slug"),
  tools: json("tools").$type<string[]>().notNull().default([]),
  steps: json("steps")
    .$type<Array<{ title: string; detail?: string }>>()
    .notNull()
    .default([]),
  mistakes: json("mistakes").$type<string[]>().notNull().default([]),
  qaChecklist: json("qa_checklist").$type<string[]>().notNull().default([]),
  successCriteria: text("success_criteria"),
  status: text("status").notNull().default("draft"), // draft | published | archived
  aiGeneratedDraft: boolean("ai_generated_draft").notNull().default(false),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AosSop = typeof aosSops.$inferSelect;
export type InsertAosSop = typeof aosSops.$inferInsert;

/** Reusable playbooks (ordered steps; tie to HVD). */
export const aosPlaybooks = pgTable(
  "aos_playbooks",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    purpose: text("purpose"),
    primaryHvdSlug: text("primary_hvd_slug"),
    steps: json("steps")
      .$type<Array<{ title: string; body?: string; suggestedTaskTitle?: string }>>()
      .notNull()
      .default([]),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("aos_playbooks_slug_uidx").on(t.slug)],
);

export type AosPlaybook = typeof aosPlaybooks.$inferSelect;

/** Structured training modules (role/HVD filters optional). */
export const aosTrainingModules = pgTable("aos_training_modules", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  /** Structured sections: explanation, examples, steps, mistakes, metrics. */
  contentJson: json("content_json").$type<Record<string, unknown>>().notNull(),
  /** When set, surface module when viewer has this role key. */
  filterRoleKey: text("filter_role_key"),
  filterHvdSlug: text("filter_hvd_slug"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("aos_training_modules_slug_uidx").on(t.slug)]);

export type AosTrainingModule = typeof aosTrainingModules.$inferSelect;

/** Internal agency project (delivery engagement). */
export const aosAgencyProjects = pgTable(
  "aos_agency_projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("planning"), // draft | planning | active | on_hold | completed | cancelled
    health: text("health").default("on_track"), // on_track | at_risk | blocked
    progressPercent: integer("progress_percent").notNull().default(0),
    primaryHvdSlug: text("primary_hvd_slug").notNull(),
    secondaryHvdSlugs: json("secondary_hvd_slugs").$type<string[]>().notNull().default([]),
    valueContributions: json("value_contributions").$type<string[]>().notNull().default([]),
    expectedOutcome: text("expected_outcome").notNull(),
    impactMetric: text("impact_metric").notNull(),
    dataSource: text("data_source").notNull(),
    priority: text("priority").notNull().default("medium"), // low | medium | high | critical
    valueFitScore: integer("value_fit_score"),
    measurabilityScore: integer("measurability_score"),
    strategicScore: integer("strategic_score"),
    ownerUserIds: json("owner_user_ids").$type<number[]>().notNull().default([]),
    linkedCrmAccountId: integer("linked_crm_account_id"),
    linkedCrmContactId: integer("linked_crm_contact_id"),
    linkedCrmDealId: integer("linked_crm_deal_id"),
    linkedAgreementId: integer("linked_agreement_id"),
    createdByUserId: integer("created_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("aos_agency_projects_status_idx").on(t.status)],
);

export type AosAgencyProject = typeof aosAgencyProjects.$inferSelect;
export type InsertAosAgencyProject = typeof aosAgencyProjects.$inferInsert;

export const aosProjectPhases = pgTable(
  "aos_project_phases",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => aosAgencyProjects.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(0),
    name: text("name").notNull(),
    description: text("description"),
    startAt: timestamp("start_at"),
    endAt: timestamp("end_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("aos_project_phases_project_idx").on(t.projectId)],
);

export type AosProjectPhase = typeof aosProjectPhases.$inferSelect;

/** Delivery milestone (internal; not client agreement billing milestone). */
export const aosDeliveryMilestones = pgTable(
  "aos_delivery_milestones",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => aosAgencyProjects.id, { onDelete: "cascade" }),
    phaseId: integer("phase_id").references(() => aosProjectPhases.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at"),
    status: text("status").notNull().default("pending"), // pending | in_progress | done | skipped
    approvalState: text("approval_state").default("none"), // none | pending | approved | rejected
    isBlocked: boolean("is_blocked").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("aos_delivery_milestones_project_idx").on(t.projectId)],
);

export type AosDeliveryMilestone = typeof aosDeliveryMilestones.$inferSelect;

/** Internal task with acceptance workflow. */
export const aosAgencyTasks = pgTable(
  "aos_agency_tasks",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").references(() => aosAgencyProjects.id, { onDelete: "cascade" }),
    milestoneId: integer("milestone_id").references(() => aosDeliveryMilestones.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    executionRoleId: integer("execution_role_id").references(() => aosExecutionRoles.id, {
      onDelete: "set null",
    }),
    assigneeUserId: integer("assignee_user_id"),
    createdByUserId: integer("created_by_user_id"),
    primaryHvdSlug: text("primary_hvd_slug").notNull(),
    secondaryHvdSlugs: json("secondary_hvd_slugs").$type<string[]>().notNull().default([]),
    valueContributions: json("value_contributions").$type<string[]>().notNull().default([]),
    expectedOutcome: text("expected_outcome").notNull(),
    impactMetric: text("impact_metric").notNull(),
    expectedOutput: text("expected_output"),
    sopId: integer("sop_id").references(() => aosSops.id, { onDelete: "set null" }),
    playbookId: integer("playbook_id").references(() => aosPlaybooks.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending_acceptance"),
    // pending_acceptance | active | blocked | in_review | completed | cancelled | declined
    acceptanceUnderstandingConfirmed: boolean("acceptance_understanding_confirmed").notNull().default(false),
    acceptanceResponsibilityConfirmed: boolean("acceptance_responsibility_confirmed").notNull().default(false),
    acceptedAt: timestamp("accepted_at"),
    acceptedByUserId: integer("accepted_by_user_id"),
    declineReason: text("decline_reason"),
    clarificationRequest: text("clarification_request"),
    linkedCrmTaskId: integer("linked_crm_task_id"),
    dueAt: timestamp("due_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("aos_agency_tasks_project_idx").on(t.projectId),
    index("aos_agency_tasks_assignee_idx").on(t.assigneeUserId),
    index("aos_agency_tasks_status_idx").on(t.status),
  ],
);

export type AosAgencyTask = typeof aosAgencyTasks.$inferSelect;
export type InsertAosAgencyTask = typeof aosAgencyTasks.$inferInsert;

/** Append-only activity log for accountability. */
export const aosTaskEvents = pgTable(
  "aos_task_events",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => aosAgencyTasks.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    // assigned | acceptance_requested | accepted | declined | clarification_requested | status_change |
    // comment | sop_viewed | ai_assist | blocker_set | blocker_cleared | approval | completion | reopened
    actorUserId: integer("actor_user_id"),
    payload: json("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("aos_task_events_task_idx").on(t.taskId)],
);

export type AosTaskEvent = typeof aosTaskEvents.$inferSelect;

// ——— Drizzle relations (optional for queries) ———

export const aosAgencyProjectsRelations = relations(aosAgencyProjects, ({ many }) => ({
  phases: many(aosProjectPhases),
  milestones: many(aosDeliveryMilestones),
  tasks: many(aosAgencyTasks),
}));

export const aosProjectPhasesRelations = relations(aosProjectPhases, ({ one, many }) => ({
  project: one(aosAgencyProjects, {
    fields: [aosProjectPhases.projectId],
    references: [aosAgencyProjects.id],
  }),
  milestones: many(aosDeliveryMilestones),
}));

export const aosDeliveryMilestonesRelations = relations(aosDeliveryMilestones, ({ one, many }) => ({
  project: one(aosAgencyProjects, {
    fields: [aosDeliveryMilestones.projectId],
    references: [aosAgencyProjects.id],
  }),
  phase: one(aosProjectPhases, {
    fields: [aosDeliveryMilestones.phaseId],
    references: [aosProjectPhases.id],
  }),
  tasks: many(aosAgencyTasks),
}));

export const aosAgencyTasksRelations = relations(aosAgencyTasks, ({ one, many }) => ({
  project: one(aosAgencyProjects, {
    fields: [aosAgencyTasks.projectId],
    references: [aosAgencyProjects.id],
  }),
  milestone: one(aosDeliveryMilestones, {
    fields: [aosAgencyTasks.milestoneId],
    references: [aosDeliveryMilestones.id],
  }),
  sop: one(aosSops, { fields: [aosAgencyTasks.sopId], references: [aosSops.id] }),
  playbook: one(aosPlaybooks, {
    fields: [aosAgencyTasks.playbookId],
    references: [aosPlaybooks.id],
  }),
  executionRole: one(aosExecutionRoles, {
    fields: [aosAgencyTasks.executionRoleId],
    references: [aosExecutionRoles.id],
  }),
  events: many(aosTaskEvents),
}));

export const aosTaskEventsRelations = relations(aosTaskEvents, ({ one }) => ({
  task: one(aosAgencyTasks, {
    fields: [aosTaskEvents.taskId],
    references: [aosAgencyTasks.id],
  }),
}));

export const insertAosAgencyProjectSchema = createInsertSchema(aosAgencyProjects);
export const insertAosAgencyTaskSchema = createInsertSchema(aosAgencyTasks);
