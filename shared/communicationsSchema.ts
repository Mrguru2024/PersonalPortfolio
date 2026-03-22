/**
 * Ascendra OS — Communications engine (CRM-linked campaigns, templates, sends).
 * Integrates with Brevo, existing email tracking (/api/track/email/*), and communication_events.
 */
import { pgTable, serial, text, timestamp, boolean, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { CrmSavedList } from "./crmSchema";

/** Segment filters: CRM saved-list shape plus communications-specific fields. */
export type CommSegmentFilters = NonNullable<CrmSavedList["filters"]> & {
  contactIds?: number[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** Matches marketing_personas.id or customFields.marketingPersonaId */
  personaId?: string;
  bookedCall?: boolean;
  excludeDoNotContact?: boolean;
  serviceInterestContains?: string;
};

export const COMM_CAMPAIGN_TYPES = [
  "one_time",
  "newsletter",
  "promo_offer",
  "lead_magnet_delivery",
  "nurture",
  "follow_up_sequence",
  "direct",
] as const;
export type CommCampaignType = (typeof COMM_CAMPAIGN_TYPES)[number];

export const COMM_DESIGN_CATEGORIES = [
  "newsletter",
  "lead_magnet_delivery",
  "nurture",
  "promo_offer",
  "proposal_follow_up",
  "booked_call_follow_up",
  "re_engagement",
  "onboarding",
  "testimonial_request",
  "case_study_request",
  "direct_correspondence",
  "general",
] as const;
export type CommDesignCategory = (typeof COMM_DESIGN_CATEGORIES)[number];

/** Reusable email design (HTML + optional structured blocks for future block analytics). */
export const commEmailDesigns = pgTable("comm_email_designs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlContent: text("html_content").notNull(),
  plainText: text("plain_text"),
  /** Structured blocks for builder v2 / block-level analytics; optional. */
  blocksJson: json("blocks_json").$type<unknown[] | null>().default(null),
  /** Future multi-tenant / client portal scoping (nullable = global admin). */
  organizationId: integer("organization_id"),
  category: text("category").notNull().default("general"),
  personaIdsJson: json("persona_ids_json").$type<string[]>().notNull().default([]),
  senderName: text("sender_name"),
  status: text("status").notNull().default("draft"), // draft | published
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommEmailDesignSchema = createInsertSchema(commEmailDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCommEmailDesign = z.infer<typeof insertCommEmailDesignSchema>;
export type CommEmailDesign = typeof commEmailDesigns.$inferSelect;

/** Campaign run: audience + links to offers / lead magnets / UTMs. */
export const commCampaigns = pgTable("comm_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  campaignType: text("campaign_type").notNull().default("one_time"),
  emailDesignId: integer("email_design_id").notNull(),
  /** A/B variant design (Phase 2). When abTestEnabled, traffic split by abVariantBPercent. */
  variantEmailDesignId: integer("variant_email_design_id"),
  abTestEnabled: boolean("ab_test_enabled").notNull().default(false),
  /** Percentage of recipients assigned variant B (0–100). Remainder get control (A). */
  abVariantBPercent: integer("ab_variant_b_percent").notNull().default(50),
  organizationId: integer("organization_id"),
  segmentFilters: json("segment_filters").$type<CommSegmentFilters>().notNull(),
  /** Optional pointer to CRM saved list (filters copied into segmentFilters on save or resolved at send). */
  savedListId: integer("saved_list_id"),
  offerSlug: text("offer_slug"),
  leadMagnetId: integer("lead_magnet_id"),
  landingPageUrl: text("landing_page_url"),
  targetPersonaIdsJson: json("target_persona_ids_json").$type<string[]>().notNull().default([]),
  sendMode: text("send_mode").notNull().default("immediate"), // immediate | scheduled
  scheduledAt: timestamp("scheduled_at"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft | scheduled | sending | sent | failed | paused
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  failedCount: integer("failed_count").default(0),
  sentAt: timestamp("sent_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommCampaignSchema = createInsertSchema(commCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  totalRecipients: true,
  sentCount: true,
  openedCount: true,
  clickedCount: true,
  failedCount: true,
});
export type InsertCommCampaign = z.infer<typeof insertCommCampaignSchema>;
export type CommCampaign = typeof commCampaigns.$inferSelect;

/** Per-recipient send log + tracking token id embedded in signEmailTrackingPayload leadId + emailId `commSend-{id}`. */
export const commCampaignSends = pgTable("comm_campaign_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  contactId: integer("contact_id"),
  recipientEmail: text("recipient_email").notNull(),
  status: text("status").notNull().default("pending"), // pending | sent | failed
  brevoMessageId: text("brevo_message_id"),
  /** A/B bucket when campaign uses variant design */
  abVariant: text("ab_variant"), // a | b
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  firstClickedUrl: text("first_clicked_url"),
  /** From tracked link query `block=` mapped to blocks_json order or id */
  firstClickedBlockId: text("first_clicked_block_id"),
  errorMessage: text("error_message"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  bounceType: text("bounce_type"), // hard | soft | spam | invalid
  bouncedAt: timestamp("bounced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommCampaignSendSchema = createInsertSchema(commCampaignSends).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  openedAt: true,
  clickedAt: true,
  brevoMessageId: true,
  errorMessage: true,
  unsubscribedAt: true,
});
export type InsertCommCampaignSend = z.infer<typeof insertCommCampaignSendSchema>;
export type CommCampaignSend = typeof commCampaignSends.$inferSelect;
