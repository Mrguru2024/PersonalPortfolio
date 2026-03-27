/**
 * Email Hub — founder/admin outbound workspace (Brevo-backed).
 * Complements comm_campaigns / comm_email_designs (campaign sends) without duplicating them.
 */
import { pgTable, serial, text, timestamp, boolean, json, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** Verified / logical sender identity (maps to Brevo verified sender email). */
export const emailHubSenders = pgTable("email_hub_senders", {
  id: serial("id").primaryKey(),
  /** Optional primary founder this row was created for (not exclusive: permissions table grants others). */
  founderUserId: integer("founder_user_id"),
  /** Brevo numeric/string sender id if synced via API; optional. */
  brevoSenderId: text("brevo_sender_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  replyToEmail: text("reply_to_email"),
  replyToName: text("reply_to_name"),
  isVerified: boolean("is_verified").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  signatureHtml: text("signature_html"),
  brandProfileId: integer("brand_profile_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailHubSenderPermissions = pgTable(
  "email_hub_sender_permissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    emailSenderId: integer("email_sender_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("email_hub_sender_perm_user_sender_uq").on(t.userId, t.emailSenderId)],
);

export const emailHubBrandProfiles = pgTable("email_hub_brand_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoAssetId: integer("logo_asset_id"),
  footerHtml: text("footer_html"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  defaultCtaStyleJson: json("default_cta_style_json").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailHubAssets = pgTable("email_hub_assets", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id"),
  brandProfileId: integer("brand_profile_id"),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type"),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  /** Optional taxonomy: brand | founder | campaign | persona */
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** access_scope: private | org | global (super-managed) */
export const emailHubTemplates = pgTable("email_hub_templates", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id"),
  name: text("name").notNull(),
  category: text("category").notNull().default("general"),
  subjectTemplate: text("subject_template").notNull(),
  htmlTemplate: text("html_template").notNull(),
  textTemplate: text("text_template"),
  editorJson: json("editor_json").$type<unknown>().default(null),
  accessScope: text("access_scope").notNull().default("private"),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  /** Link to comm_email_designs when cloned from campaign design (optional). */
  commEmailDesignId: integer("comm_email_design_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailHubDrafts = pgTable("email_hub_drafts", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").notNull(),
  senderId: integer("sender_id").notNull(),
  toJson: json("to_json").$type<string[]>().notNull(),
  ccJson: json("cc_json").$type<string[] | null>().default(null),
  bccJson: json("bcc_json").$type<string[] | null>().default(null),
  subject: text("subject").notNull().default(""),
  htmlBody: text("html_body").notNull().default(""),
  textBody: text("text_body"),
  editorJson: json("editor_json").$type<unknown>().default(null),
  status: text("status").notNull().default("draft"), // draft | scheduled
  scheduledFor: timestamp("scheduled_for"),
  templateId: integer("template_id"),
  relatedContactId: integer("related_contact_id"),
  relatedCompanyId: integer("related_company_id"),
  /** legacy alias — same CRM contact */
  relatedLeadId: integer("related_lead_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** One-off or scheduled outbound message (not bulk campaign row). */
export const emailHubMessages = pgTable("email_hub_messages", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").notNull(),
  senderId: integer("sender_id").notNull(),
  brevoMessageId: text("brevo_message_id"),
  toJson: json("to_json").$type<string[]>().notNull(),
  ccJson: json("cc_json").$type<string[] | null>().default(null),
  bccJson: json("bcc_json").$type<string[] | null>().default(null),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  status: text("status").notNull().default("pending"), // pending | sent | failed | scheduled | cancelled
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  templateId: integer("template_id"),
  relatedContactId: integer("related_contact_id"),
  relatedCompanyId: integer("related_company_id"),
  relatedLeadId: integer("related_lead_id"),
  campaignId: integer("campaign_id"),
  trackingOpen: boolean("tracking_open").notNull().default(true),
  trackingClick: boolean("tracking_click").notNull().default(true),
  unsubFooter: boolean("unsub_footer").notNull().default(false),
  errorMessage: text("error_message"),
  providerJson: json("provider_json").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailHubEvents = pgTable("email_hub_events", {
  id: serial("id").primaryKey(),
  emailMessageId: integer("email_message_id").notNull(),
  eventType: text("event_type").notNull(),
  providerEventId: text("provider_event_id"),
  recipientEmail: text("recipient_email").notNull(),
  eventTimestamp: timestamp("event_timestamp").defaultNow().notNull(),
  metadata: json("metadata_json").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Connected personal inbox (Gmail / Microsoft) — Phase 2. One row per admin user per provider. */
export const emailHubMailboxAccounts = pgTable(
  "email_hub_mailbox_accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    /** gmail | microsoft */
    provider: text("provider").notNull(),
    emailAddress: text("email_address").notNull(),
    displayName: text("display_name"),
    encryptedRefreshToken: text("encrypted_refresh_token").notNull(),
    /** Optional provider sync token (e.g. Graph delta URL). */
    syncCursor: text("sync_cursor"),
    lastSyncedAt: timestamp("last_synced_at"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("email_hub_mailbox_user_provider_uq").on(t.userId, t.provider)],
);

export const emailHubInboxThreads = pgTable(
  "email_hub_inbox_threads",
  {
    id: serial("id").primaryKey(),
    mailboxAccountId: integer("mailbox_account_id").notNull(),
    provider: text("provider").notNull(),
    providerThreadId: text("provider_thread_id").notNull(),
    subject: text("subject"),
    snippet: text("snippet"),
    lastMessageAt: timestamp("last_message_at"),
    isRead: boolean("is_read").notNull().default(true),
    participantEmailsJson: json("participant_emails_json").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("email_hub_inbox_thread_mailbox_provider_uq").on(t.mailboxAccountId, t.providerThreadId)],
);

export const emailHubInboxMessages = pgTable(
  "email_hub_inbox_messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id").notNull(),
    mailboxAccountId: integer("mailbox_account_id").notNull(),
    provider: text("provider").notNull(),
    providerMessageId: text("provider_message_id").notNull(),
    rfcMessageId: text("rfc_message_id"),
    fromEmail: text("from_email"),
    fromName: text("from_name"),
    toJson: json("to_json").$type<{ email: string; name?: string }[]>().notNull().default([]),
    subject: text("subject"),
    snippet: text("snippet"),
    htmlBody: text("html_body"),
    internalDate: timestamp("internal_date").notNull(),
    isRead: boolean("is_read").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("email_hub_inbox_msg_mailbox_provider_uq").on(t.mailboxAccountId, t.providerMessageId)],
);

export const insertEmailHubSenderSchema = createInsertSchema(emailHubSenders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailHubSender = z.infer<typeof insertEmailHubSenderSchema>;
export type EmailHubSender = typeof emailHubSenders.$inferSelect;

export type EmailHubMessage = typeof emailHubMessages.$inferSelect;
export type EmailHubDraft = typeof emailHubDrafts.$inferSelect;
export type EmailHubEvent = typeof emailHubEvents.$inferSelect;
export type EmailHubTemplateRow = typeof emailHubTemplates.$inferSelect;
export type EmailHubAsset = typeof emailHubAssets.$inferSelect;
export type EmailHubMailboxAccount = typeof emailHubMailboxAccounts.$inferSelect;
export type EmailHubInboxThread = typeof emailHubInboxThreads.$inferSelect;
export type EmailHubInboxMessage = typeof emailHubInboxMessages.$inferSelect;
