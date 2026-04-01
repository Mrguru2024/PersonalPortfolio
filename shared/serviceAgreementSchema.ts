/**
 * Growth platform — persona pricing, agreements, clause library, DocuSign metadata, retainers.
 */
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  json,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";

/** Multipliers applied to DFY/DWY cent ranges from `ascendraOfferStack` for a persona key (e.g. journey persona id). */
export const growthPersonaOfferPricing = pgTable(
  "growth_persona_offer_pricing",
  {
    id: serial("id").primaryKey(),
    personaKey: text("persona_key").notNull(),
    label: text("label"),
    dfySetupMultiplier: real("dfy_setup_multiplier").default(1).notNull(),
    dfyMonthlyMultiplier: real("dfy_monthly_multiplier").default(1).notNull(),
    dwyProgramMultiplier: real("dwy_program_multiplier").default(1).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("growth_persona_offer_pricing_key_uidx").on(t.personaKey)],
);

/**
 * Lawyer-reviewable clause blocks composed into agreements (admin-edited HTML; counsel should review before production).
 */
export const legalClauseLibrary = pgTable(
  "legal_clause_library",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    /** Sanitized HTML body (admin-only source). */
    bodyHtml: text("body_html").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lawyerReviewedAt: timestamp("lawyer_reviewed_at"),
    lawyerReviewerName: text("lawyer_reviewer_name"),
    lawyerFirmName: text("lawyer_firm_name"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("legal_clause_library_slug_uidx").on(t.slug),
    index("legal_clause_library_category_idx").on(t.category),
    index("legal_clause_library_active_idx").on(t.isActive),
  ],
);

export const clientServiceAgreements = pgTable(
  "client_service_agreements",
  {
    id: serial("id").primaryKey(),
    publicToken: text("public_token").notNull(),
    status: text("status").notNull().default("draft"),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull(),
    companyLegalName: text("company_legal_name"),
    scopeBulletsJson: json("scope_bullets_json").$type<string[]>().notNull(),
    pricingNarrative: text("pricing_narrative"),
    tierHint: text("tier_hint"),
    htmlBody: text("html_body").notNull(),
    /** Ordered clause slugs composed into this agreement. */
    clauseSlugsJson: json("clause_slugs_json").$type<string[] | null>(),
    variablesJson: json("variables_json").$type<Record<string, string>>(),
    signedAt: timestamp("signed_at"),
    signerLegalName: text("signer_legal_name"),
    signatureImageBase64: text("signature_image_base64"),
    signatureAuditJson: json("signature_audit_json").$type<Record<string, unknown>>(),
    pdfGeneratedAt: timestamp("pdf_generated_at"),
    docusignEnvelopeId: text("docusign_envelope_id"),
    docusignStatus: text("docusign_status"),
    docusignSigningUri: text("docusign_signing_uri"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdByUserId: integer("created_by_user_id"),
  },
  (t) => [
    uniqueIndex("client_service_agreements_token_uidx").on(t.publicToken),
    index("client_service_agreements_status_idx").on(t.status),
    index("client_service_agreements_email_idx").on(t.clientEmail),
    index("client_service_agreements_docusign_idx").on(t.docusignEnvelopeId),
  ],
);

export const clientServiceAgreementMilestones = pgTable(
  "client_service_agreement_milestones",
  {
    id: serial("id").primaryKey(),
    agreementId: integer("agreement_id")
      .notNull()
      .references(() => clientServiceAgreements.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull(),
    stripeInvoiceId: text("stripe_invoice_id"),
    status: text("status").notNull().default("pending"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("cs_agreement_milestones_agreement_idx").on(t.agreementId)],
);

/** Stripe subscription retainers (recurring), separate from one-off milestone invoices. */
export const retainerSubscriptions = pgTable(
  "retainer_subscriptions",
  {
    id: serial("id").primaryKey(),
    agreementId: integer("agreement_id").references(() => clientServiceAgreements.id, { onDelete: "set null" }),
    clientName: text("client_name"),
    clientEmail: text("client_email").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripePriceId: text("stripe_price_id").notNull(),
    interval: text("interval").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").notNull().default("active"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    metadataJson: json("metadata_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("retainer_subscriptions_stripe_sub_uidx").on(t.stripeSubscriptionId),
    index("retainer_subscriptions_email_idx").on(t.clientEmail),
    index("retainer_subscriptions_status_idx").on(t.status),
  ],
);

export type GrowthPersonaOfferPricing = typeof growthPersonaOfferPricing.$inferSelect;
export type LegalClauseLibraryRow = typeof legalClauseLibrary.$inferSelect;
export type ClientServiceAgreement = typeof clientServiceAgreements.$inferSelect;
export type ClientServiceAgreementMilestone = typeof clientServiceAgreementMilestones.$inferSelect;
export type RetainerSubscription = typeof retainerSubscriptions.$inferSelect;
