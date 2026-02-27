import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** CRM contact/lead: unified record for leads and clients with high-value fields */
export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("lead"), // lead | client
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  industry: text("industry"),
  source: text("source"), // website, referral, linkedin, etc.
  status: text("status").default("new"), // new, contacted, qualified, proposal, negotiation, won, lost
  estimatedValue: integer("estimated_value"), // cents or deal size
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  customFields: json("custom_fields").$type<Record<string, unknown>>(),
  // Link to legacy contact form submission if imported
  contactId: integer("contact_id"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrmContactSchema = createInsertSchema(crmContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmContact = z.infer<typeof insertCrmContactSchema>;
export type CrmContact = typeof crmContacts.$inferSelect;

/** Deals pipeline */
export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  title: text("title").notNull(),
  value: integer("value").notNull(), // cents
  stage: text("stage").notNull().default("qualification"), // qualification, proposal, negotiation, won, lost
  expectedCloseAt: timestamp("expected_close_at"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrmDealSchema = createInsertSchema(crmDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCrmDeal = z.infer<typeof insertCrmDealSchema>;
export type CrmDeal = typeof crmDeals.$inferSelect;

/** Communication / activity log */
export const crmActivities = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  dealId: integer("deal_id"),
  type: text("type").notNull(), // email, call, meeting, note
  subject: text("subject"),
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrmActivitySchema = createInsertSchema(crmActivities).omit({
  id: true,
  createdAt: true,
});
export type InsertCrmActivity = z.infer<typeof insertCrmActivitySchema>;
export type CrmActivity = typeof crmActivities.$inferSelect;
