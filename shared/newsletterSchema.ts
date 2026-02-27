import { pgTable, serial, text, timestamp, boolean, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribed: boolean("subscribed").default(true).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  source: text("source"), // e.g., "contact_form", "manual", "import"
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata").$type<Record<string, any>>(),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
  unsubscribedAt: true,
});

export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Newsletters/Campaigns
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  content: text("content").notNull(), // HTML content from rich text editor
  plainText: text("plain_text"), // Plain text version for email clients
  previewText: text("preview_text"), // Email preview text
  status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by"), // User ID who created it
  // Sending stats
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  failedCount: integer("failed_count").default(0),
  // Campaign settings
  recipientFilter: json("recipient_filter").$type<{
    tags?: string[];
    subscribed?: boolean;
  }>(),
  // Explicit recipient list: when set, send to these emails (bulk/CRM); otherwise use subscriber filter
  recipientEmails: json("recipient_emails").$type<string[]>(),
  // Media attachments
  images: json("images").$type<Array<{ url: string; alt?: string; cid?: string }>>(),
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  sentCount: true,
  deliveredCount: true,
  openedCount: true,
  clickedCount: true,
  failedCount: true,
});

export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletters.$inferSelect;

// Newsletter send logs (for tracking individual sends)
export const newsletterSends = pgTable("newsletter_sends", {
  id: serial("id").primaryKey(),
  newsletterId: integer("newsletter_id").notNull(),
  subscriberId: integer("subscriber_id").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, opened, clicked, failed, bounced
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  brevoMessageId: text("brevo_message_id"), // Brevo message ID for tracking
});

export const insertNewsletterSendSchema = createInsertSchema(newsletterSends).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  failedAt: true,
});

export type InsertNewsletterSend = z.infer<typeof insertNewsletterSendSchema>;
export type NewsletterSend = typeof newsletterSends.$inferSelect;
