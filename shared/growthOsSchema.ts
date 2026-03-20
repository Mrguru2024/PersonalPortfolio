/**
 * Growth Operating System — foundation tables (visibility, internal notes, client-safe shares, audit).
 * No FK to users table to avoid circular imports with schema.ts; integrity enforced in app layer.
 */
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  json,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** Registered GOS modules with default visibility for exported/summary data. */
export const gosModuleRegistry = pgTable("gos_module_registry", {
  id: serial("id").primaryKey(),
  moduleKey: text("module_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  /** Default tier for primary data class (internal_only | client_visible | public_visible). */
  defaultDataVisibility: text("default_data_visibility").notNull().default("internal_only"),
  /** Minimum Ascendra role to use admin UI for this module (phase 1: ADMIN only). */
  minAdminAccessRole: text("min_admin_access_role").notNull().default("ADMIN"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GosModuleRegistryRow = typeof gosModuleRegistry.$inferSelect;
export type InsertGosModuleRegistry = typeof gosModuleRegistry.$inferInsert;

/** Per-entity visibility override (content, audits, reports keyed by type+id). */
export const gosEntityVisibilityOverrides = pgTable(
  "gos_entity_visibility_overrides",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    visibility: text("visibility").notNull(),
    updatedByUserId: integer("updated_by_user_id"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("gos_entity_visibility_unique").on(t.entityType, t.entityId)],
);

export type GosEntityVisibilityOverride = typeof gosEntityVisibilityOverrides.$inferSelect;

/** Internal-only notes; never exposed via client/public APIs without explicit sanitize layer. */
export const gosInternalNotes = pgTable("gos_internal_notes", {
  id: serial("id").primaryKey(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  body: text("body").notNull(),
  authorUserId: integer("author_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGosInternalNoteSchema = createInsertSchema(gosInternalNotes).omit({
  id: true,
  createdAt: true,
});
export type InsertGosInternalNote = z.infer<typeof insertGosInternalNoteSchema>;

/** Tokenized client-safe summary links (raw token shown once at creation; only hash stored). */
export const gosClientSafeReportShares = pgTable("gos_client_safe_report_shares", {
  id: serial("id").primaryKey(),
  publicTokenHash: text("public_token_hash").notNull().unique(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  summaryPayload: json("summary_payload").$type<Record<string, unknown>>().notNull(),
  expiresAt: timestamp("expires_at"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGosClientSafeReportShareSchema = createInsertSchema(
  gosClientSafeReportShares,
).omit({
  id: true,
  createdAt: true,
});
export type InsertGosClientSafeReportShare = z.infer<
  typeof insertGosClientSafeReportShareSchema
>;

/** Security / access audit (Growth OS actions; not a full app audit log). */
export const gosAccessAuditEvents = pgTable("gos_access_audit_events", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  /** Visibility context at time of action (optional). */
  visibilityContext: text("visibility_context"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GosAccessAuditEvent = typeof gosAccessAuditEvents.$inferSelect;

/**
 * Links CRM leads/contacts to internal content, blog posts, or calendar rows for dashboard attribution.
 * No FK constraints — enforced in app layer (matches other GOS tables).
 */
export const gosLeadContentAttributions = pgTable("gos_lead_content_attributions", {
  id: serial("id").primaryKey(),
  projectKey: text("project_key").notNull().default("ascendra_main"),
  contactId: integer("contact_id").notNull(),
  dealId: integer("deal_id"),
  documentId: integer("document_id"),
  blogPostId: integer("blog_post_id"),
  calendarEntryId: integer("calendar_entry_id"),
  /** manual | utm | form | import | campaign */
  channel: text("channel").notNull().default("manual"),
  attributionLabel: text("attribution_label"),
  metadataJson: json("metadata_json").$type<Record<string, unknown>>().default({}),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GosLeadContentAttribution = typeof gosLeadContentAttributions.$inferSelect;
