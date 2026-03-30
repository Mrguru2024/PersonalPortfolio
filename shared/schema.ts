import { pgTable, text, serial, integer, boolean, json, timestamp, unique, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with GitHub auth support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false),
  adminApproved: boolean("admin_approved").default(false), // Must be manually approved by admin
  role: text("role").default("user").notNull(),
  permissions: json("permissions").$type<Record<string, boolean> | null>(),
  full_name: text("full_name"),
  // GitHub OAuth related fields
  githubId: text("github_id"),
  githubUsername: text("github_username"),
  avatarUrl: text("avatar_url"),
  // Password reset fields
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  /** Client dashboard trial — set on signup/OAuth for eligible accounts (skipped for admins/operators). */
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  /**
   * When true, user may use the client portal even if no invoices/quotes are linked yet (e.g. invited before first bill).
   * Otherwise eligibility is derived from linked client data.
   */
  clientPortalAccess: boolean("client_portal_access").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
  adminApproved: true,
  role: true,
  permissions: true,
  full_name: true,
  githubId: true,
  githubUsername: true,
  avatarUrl: true,
  trialStartedAt: true,
  trialEndsAt: true,
  clientPortalAccess: true,
  created_at: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/** Admin workspace focus — drives AI task plans and optional dashboard nudge ordering. */
export const ADMIN_OPERATOR_ROLE_OPTIONS = [
  "general",
  "operations",
  "growth_marketing",
  "content",
  "client_success",
  "technical",
  "leadership",
  "finance",
] as const;
export type AdminOperatorRoleSelection = (typeof ADMIN_OPERATOR_ROLE_OPTIONS)[number];

export const ADMIN_OPERATOR_ROLE_LABELS: Record<AdminOperatorRoleSelection, string> = {
  general: "General / multi-hat",
  operations: "Operations & delivery",
  growth_marketing: "Growth & marketing",
  content: "Content & creative",
  client_success: "Client success & CRM",
  technical: "Technical & integrations",
  leadership: "Leadership & strategy",
  finance: "Finance & billing",
};

/** Cached AI output for daily/weekly focus (regenerated on demand). */
export type AdminOperatorIntelligencePayload = {
  dailyTasks: Array<{ id: string; title: string; rationale?: string; href?: string | null }>;
  weeklyTasks: Array<{ id: string; title: string; rationale?: string; href?: string | null }>;
  tips: string[];
  generatedAt: string;
  source: "openai" | "fallback";
};

export const adminOperatorProfiles = pgTable("admin_operator_profiles", {
  userId: integer("user_id")
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleSelection: text("role_selection").notNull().default("general"),
  mission: text("mission"),
  vision: text("vision"),
  goals: text("goals"),
  /** Short note for AI context (e.g. current sprint, launch). */
  taskFocus: text("task_focus"),
  intelligenceJson: json("intelligence_json").$type<AdminOperatorIntelligencePayload | null>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminOperatorProfileRow = typeof adminOperatorProfiles.$inferSelect;
export type InsertAdminOperatorProfileRow = typeof adminOperatorProfiles.$inferInsert;

// Session table (used by connect-pg-simple; created by scripts/create-session-table.ts)
// Included in schema so drizzle-kit push does not propose to drop it.
export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true, precision: 6 }).notNull(),
});

// Funnel content (admin-editable copy for startup funnel pages)
export const funnelContent = pgTable("funnel_content", {
  slug: text("slug").primaryKey(),
  data: json("data").$type<Record<string, unknown>>().notNull(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type FunnelContent = typeof funnelContent.$inferSelect;
export type InsertFunnelContent = typeof funnelContent.$inferInsert;

/** Target criteria for grading (shown in results for accuracy/audits). */
export interface GradingTargetsStored {
  seo?: { metaTitleMin: number; metaTitleMax: number; metaDescMin: number; metaDescMax: number };
  design?: { heroTitleRequired: boolean; heroSubtitleRequired: boolean; heroImageRecommended: boolean; minDeliverables: number; deliverablesNeedDesc: boolean };
  copy?: { ctaButtonRequired: boolean; ctaHrefRequired: boolean; minBullets: number; heroSubtitleMinChars: number };
  personaContext?: {
    minPersonaTokenOverlapRatio: number;
    tenureBandsConsidered: string[];
    visionLevelsConsidered: string[];
  };
}

/** Measured values from content (your content vs targets). */
export interface GradingMeasuredStored {
  seo?: { metaTitleLength: number; metaDescLength: number };
  design?: { hasHeroTitle: boolean; hasHeroSubtitle: boolean; hasHeroImage: boolean; deliverableCount: number; deliverableWithDescCount: number };
  copy?: { hasCtaButton: boolean; hasCtaHref: boolean; bulletCount: number; heroSubtitleLength: number };
  personaContext?: {
    personaTokenHits: number;
    personaTokenUniverse: number;
    overlapRatio: number;
    proofLanguageHits: number;
    audienceTenureBand?: string;
    audienceVisionInvestment?: string;
    personaCount: number;
  };
}

/** Content grading result for an offer (SEO, design readiness, copy clarity, optional persona/audience context). */
export interface OfferContentGrading {
  seoScore: number;       // 0-100
  designScore: number;    // 0-100
  copyScore: number;      // 0-100
  /** IQ persona + tenure/vision-conditioned fit (when targeting was configured). */
  personaContextScore?: number;
  overallGrade: string;   // A | B | C | D | F
  gradedAt: string;       // ISO date
  feedback?: { seo?: string[]; design?: string[]; copy?: string[]; persona?: string[] };
  /** Target criteria (for diagnostics/audits). */
  targets?: GradingTargetsStored;
  /** Measured values (confirms accuracy of grading). */
  measured?: GradingMeasuredStored;
}

/** Admin-editable site offers (e.g. /offers/startup-growth-system). Sections define hero, price, deliverables, CTA, graphics. */
export const siteOffers = pgTable("site_offers", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  sections: json("sections").$type<Record<string, unknown>>().notNull(),
  /** Optional content grading (SEO, design, copy). Set by admin "Grade content" action. */
  grading: json("grading").$type<OfferContentGrading | null>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteOffer = typeof siteOffers.$inferSelect;
export type InsertSiteOffer = typeof siteOffers.$inferInsert;

/** Funnel content assets: PDF, PPTX, video, image, slideshow — for lead magnets. Admin uploads and assigns to page/section. */
export const funnelContentAssets = pgTable("funnel_content_assets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  /** pdf | pptx | video | image | slideshow */
  assetType: text("asset_type").notNull(),
  /** URL to file (e.g. /uploads/content/...) */
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type"),
  fileSizeBytes: integer("file_size_bytes"),
  /** draft | published — only published appear on live pages */
  status: text("status").notNull().default("draft"),
  /**
   * public — can appear via placements on marketing pages (still only if published).
   * registered — listed only for signed-in users at /api/user/free-offers; not exposed in public placement API.
   */
  accessLevel: text("access_level").notNull().default("public"),
  /** Optional: which lead magnet this is for (e.g. digital-growth-audit, startup-growth-kit) */
  leadMagnetSlug: text("lead_magnet_slug"),
  /** Where to show: [{ pagePath, sectionId }, ...]. pagePath e.g. /digital-growth-audit; sectionId e.g. hero, lead_magnet_download */
  placements: json("placements").$type<Array<{ pagePath: string; sectionId: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FunnelContentAsset = typeof funnelContentAssets.$inferSelect;
export type InsertFunnelContentAsset = typeof funnelContentAssets.$inferInsert;

/** Paid challenge registrations. Links to CRM contact when created. */
export const challengeRegistrations = pgTable("challenge_registrations", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id"), // FK to crm_contacts, set after CRM lead created
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  businessName: text("business_name"),
  website: text("website"),
  businessType: text("business_type"),
  source: text("source"),
  orderBumpPurchased: boolean("order_bump_purchased").default(false),
  amountCents: integer("amount_cents"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").default("joined").notNull(), // joined | active | completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChallengeRegistration = typeof challengeRegistrations.$inferSelect;
export type InsertChallengeRegistration = typeof challengeRegistrations.$inferInsert;

/** Per-day lesson completion for a challenge registration. */
export const challengeLessonProgress = pgTable(
  "challenge_lesson_progress",
  {
    id: serial("id").primaryKey(),
    registrationId: integer("registration_id").notNull().references(() => challengeRegistrations.id, { onDelete: "cascade" }),
    day: integer("day").notNull(), // 1-5
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("challenge_progress_reg_day").on(t.registrationId, t.day)]
);

export type ChallengeLessonProgress = typeof challengeLessonProgress.$inferSelect;
export type InsertChallengeLessonProgress = typeof challengeLessonProgress.$inferInsert;

/** Business goal presets: drive what reminders are generated (overdue tasks, stale leads, etc.). */
export const businessGoalPresets = pgTable("business_goal_presets", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // sales | marketing | operations | growth
  description: text("description"),
  criteria: json("criteria").$type<{ type: string; [k: string]: unknown }>().notNull(),
  roleFilter: text("role_filter").default("all"), // all | sales | marketing | operations
  priority: integer("priority").default(5).notNull(), // 1-10, higher = more urgent
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BusinessGoalPreset = typeof businessGoalPresets.$inferSelect;
export type InsertBusinessGoalPreset = typeof businessGoalPresets.$inferInsert;

/** Admin reminders: task-like nudges derived from goals and platform state; interactive (dismiss/snooze/done). */
export const adminReminders = pgTable("admin_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null = applies to all admins
  reminderKey: text("reminder_key").notNull(), // e.g. overdue_task_123, stale_lead_45
  title: text("title").notNull(),
  body: text("body"),
  priority: text("priority").default("medium").notNull(), // low | medium | high | urgent
  actionUrl: text("action_url"),
  relatedType: text("related_type"), // task | contact | deal | discovery | proposal_prep | alert
  relatedId: integer("related_id"),
  sourcePresetKey: text("source_preset_key"),
  status: text("status").default("new").notNull(), // new | dismissed | done | snoozed
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminReminder = typeof adminReminders.$inferSelect;
export type InsertAdminReminder = typeof adminReminders.$inferInsert;

// Portfolio schemas
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  category: text("category").notNull(),
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  details: text("details"),
  demoType: text("demo_type"), // Types: iframe, video, github, custom
  demoUrl: text("demo_url"), // URL for direct embed/iframe
  demoConfig: json("demo_config").$type<{
    width?: string;
    height?: string;
    allowFullscreen?: boolean;
    isResponsive?: boolean;
    showCode?: boolean;
    theme?: string;
    githubBranch?: string;
  }>(),
  repoOwner: text("repo_owner"), // GitHub username/organization
  repoName: text("repo_name"), // Repository name
  techStack: json("tech_stack").$type<string[]>(),
});

export const insertProjectSchema = createInsertSchema(projects);
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Allowed assessment status values (single source of truth for validation)
export const ASSESSMENT_STATUSES = ["pending", "reviewed", "contacted", "archived"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

// Project Assessment schema
export const projectAssessments = pgTable("project_assessments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  role: text("role"),
  assessmentData: json("assessment_data").$type<any>().notNull(),
  pricingBreakdown: json("pricing_breakdown").$type<any>(),
  status: text("status").default("pending"), // pending, reviewed, contacted, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // soft delete: set to non-null to hide; restore by setting to null
});

export const insertProjectAssessmentSchema = createInsertSchema(projectAssessments);
export type InsertProjectAssessment = z.infer<typeof insertProjectAssessmentSchema>;
export type ProjectAssessment = typeof projectAssessments.$inferSelect;

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  percentage: integer("percentage").notNull(),
  endorsement_count: integer("endorsement_count").default(0).notNull(),
});

// Skill Endorsements Table
export const skillEndorsements = pgTable("skill_endorsements", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").references(() => skills.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  comment: text("comment"),
  rating: integer("rating").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

export const insertSkillSchema = createInsertSchema(skills);
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

export const insertSkillEndorsementSchema = createInsertSchema(skillEndorsements).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
});

export const skillEndorsementFormSchema = z.object({
  skillId: z.number().positive("Skill ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
});

export type InsertSkillEndorsement = z.infer<typeof insertSkillEndorsementSchema>;
export type SkillEndorsement = typeof skillEndorsements.$inferSelect;

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  phone: text("phone"),
  company: text("company"),
  projectType: text("project_type"),
  budget: text("budget"),
  timeframe: text("timeframe"),
  newsletter: boolean("newsletter").default(false),
  /** Lead qualifying / demographics (for acquisition analytics) */
  ageRange: text("age_range"), // e.g. 18-24, 25-34, 35-44, 45-54, 55+
  gender: text("gender"),
  occupation: text("occupation"), // job role / title category
  companySize: text("company_size"), // e.g. 1-10, 11-50, 51-200, 201+
  pricingEstimate: json("pricing_estimate").$type<{
    estimatedRange: { min: number; max: number; average: number };
    marketComparison: { lowEnd: number; highEnd: number; average: number };
  } | null>(),
  createdAt: text("created_at").notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Resume Requests schema
export const resumeRequests = pgTable("resume_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  purpose: text("purpose").notNull(),
  message: text("message"),
  createdAt: text("created_at").notNull(),
  accessToken: text("access_token").notNull().unique(),
  accessed: boolean("accessed").default(false),
  accessedAt: timestamp("accessed_at"),
});

export const insertResumeRequestSchema = createInsertSchema(resumeRequests).omit({
  id: true,
  createdAt: true,
  accessToken: true,
  accessed: true,
  accessedAt: true,
});

export const resumeRequestFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  message: z.string().optional(),
});

export type InsertResumeRequest = z.infer<typeof insertResumeRequestSchema>;
export type ResumeRequest = typeof resumeRequests.$inferSelect;

// Blog schema
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image").notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  publishedAt: timestamp("published_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  authorId: integer("author_id").references(() => users.id),
  isPublished: boolean("is_published").notNull().default(false),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: json("keywords").$type<string[]>(),
  canonicalUrl: text("canonical_url"),
  // Backlinking fields
  internalLinks: json("internal_links").$type<Array<{ text: string; url: string; postId?: number }>>(),
  externalLinks: json("external_links").$type<Array<{ text: string; url: string; nofollow?: boolean }>>(),
  // Social sharing
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  twitterCard: text("twitter_card").default("summary_large_image"),
  // Authority building
  relatedPosts: json("related_posts").$type<number[]>(),
  readingTime: integer("reading_time"),
  // Analytics
  viewCount: integer("view_count").default(0),
  uniqueViewCount: integer("unique_view_count").default(0),
});

export const blogPostContributions = pgTable("blog_post_contributions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image").notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  createdAt: timestamp("created_at").notNull(),
  ipAddress: text("ip_address").notNull(),
  isReviewed: boolean("is_reviewed").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  isSpam: boolean("is_spam").notNull().default(false),
  reviewNotes: text("review_notes"),
});

export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
  ipAddress: text("ip_address").default("0.0.0.0"),
  isApproved: boolean("is_approved").notNull().default(false),
  isSpam: boolean("is_spam").notNull().default(false),
  captchaToken: text("captcha_token"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  authorId: true,
  isPublished: true,
  publishedAt: true,
}).extend({
  coverImage: z.string().optional(),
  publishedAt: z.union([z.string().datetime(), z.date(), z.string()]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  canonicalUrl: z.string().optional(),
  internalLinks: z.array(z.object({
    text: z.string(),
    url: z.string(),
    postId: z.number().optional()
  })).optional(),
  externalLinks: z.array(z.object({
    text: z.string(),
    url: z.string(),
    nofollow: z.boolean().optional()
  })).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterCard: z.string().optional(),
  relatedPosts: z.array(z.number()).optional(),
  readingTime: z.number().optional(),
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  isApproved: true,
  isSpam: true,
});

export const insertBlogPostContributionSchema = createInsertSchema(blogPostContributions).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
  isReviewed: true,
  isApproved: true,
  isSpam: true,
  reviewNotes: true,
});

export const blogCommentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  content: z.string().min(3, "Comment must be at least 3 characters"),
  captchaToken: z.string().min(1, "CAPTCHA verification is required"),
});

export const blogPostContributionFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  summary: z.string().min(20, "Summary must be at least 20 characters").max(500, "Summary cannot exceed 500 characters"),
  content: z.string().min(200, "Content must be at least 200 characters"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  authorName: z.string().min(2, "Author name is required"),
  authorEmail: z.string().email("Valid email address is required"),
  coverImage: z.string().optional().default(""), // Made optional to support AI generation
  captchaToken: z.string().min(1, "CAPTCHA verification is required"),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogPostContribution = z.infer<typeof insertBlogPostContributionSchema>;
export type BlogPostContribution = typeof blogPostContributions.$inferSelect;

// Admin internal chat (single room for all approved admins)
export const adminChatMessages = pgTable("admin_chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tracks last read message per admin for unread count / notifications
export const adminChatReadCursor = pgTable("admin_chat_read_cursor", {
  userId: integer("user_id").references(() => users.id).primaryKey(),
  lastReadMessageId: integer("last_read_message_id").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminChatMessage = typeof adminChatMessages.$inferSelect;
export type InsertAdminChatMessage = typeof adminChatMessages.$inferInsert;
export type AdminChatReadCursor = typeof adminChatReadCursor.$inferSelect;

// User activity / login audit log (admin monitoring: logins, failures, errors)
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // login_success, login_failure, logout, error, client_error
  success: boolean("success").notNull(),
  message: text("message"),
  identifier: text("identifier"), // e.g. username/email for failed login (no userId)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserActivityLogEntry = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLog.$inferInsert;

// Push notification subscriptions (for admin direct message / push to device)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull(),
  keys: json("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/** Per-admin preferences: notifications, push, reminders, role-change alerts, AI agent permission. */
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  inAppNotifications: boolean("in_app_notifications").default(true).notNull(),
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(true).notNull(),
  remindersEnabled: boolean("reminders_enabled").default(true).notNull(),
  reminderFrequency: text("reminder_frequency").default("realtime").notNull(), // realtime | hourly | daily | weekly
  notifyOnRoleChange: boolean("notify_on_role_change").default(true).notNull(),
  aiAgentCanPerformActions: boolean("ai_agent_can_perform_actions").default(false).notNull(),
  /** When true, the admin assistant shows a confirm step before navigation or reminder runs. */
  aiAgentRequireActionConfirmation: boolean("ai_agent_require_action_confirmation").default(true).notNull(),
  /**
   * When true, the app may record coarse admin navigation (paths, dwell hints) to personalize the floating mentor.
   * Does not log form fields or keystrokes. Separate from action execution.
   */
  aiMentorObserveUsage: boolean("ai_mentor_observe_usage").default(false).notNull(),
  /**
   * When true (and mentor observation is enabled), the mentor may occasionally surface a short checkpoint question
   * in the assistant panel based on usage patterns — never blocking the UI.
   */
  aiMentorProactiveCheckpoints: boolean("ai_mentor_proactive_checkpoints").default(true).notNull(),
  /**
   * Per-surface module order + visibility for admin dashboards (syncs across devices).
   * Keys: `main` (/admin/dashboard), `crm` (/admin/crm/dashboard). Shape: { [surface]: { order: string[], hidden: string[] } }
   */
  adminUiLayouts: json("admin_ui_layouts").$type<Record<string, { order: string[]; hidden: string[] }> | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = typeof adminSettings.$inferInsert;

/**
 * Internal-only per-admin memory for the admin AI mentor (habits, struggles, nudges).
 * Used only on this deployment to personalize the assistant — not sold or shared externally.
 */
export type AdminAgentMentorStateV1 = {
  v: 1;
  habits: string[];
  painPoints: string[];
  goals: string[];
  strengths: string[];
  topicsOftenAsked: string[];
  pendingMentorNudges: string[];
};

/** Aggregate route visits for mentor personalization (observation opt-in only). */
export type MentorRouteStat = {
  path: string;
  visits: number;
  lastVisitAt: string;
};

export type AdminAgentMentorStateV2 = {
  v: 2;
  habits: string[];
  painPoints: string[];
  goals: string[];
  strengths: string[];
  topicsOftenAsked: string[];
  pendingMentorNudges: string[];
  topRoutes?: MentorRouteStat[];
  /** ISO timestamp — throttles auto checkpoint prompts */
  lastCheckpointAt?: string;
  /** Short inferred signals, e.g. rapid revisits */
  workflowSignals?: string[];
};

export type AdminAgentMentorStateStored = AdminAgentMentorStateV1 | AdminAgentMentorStateV2;

export const adminAgentMentorState = pgTable("admin_agent_mentor_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  state: json("state").$type<AdminAgentMentorStateStored>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminAgentMentorStateRow = typeof adminAgentMentorState.$inferSelect;
export type InsertAdminAgentMentorStateRow = typeof adminAgentMentorState.$inferInsert;

/**
 * Per-admin notes and knowledge bases for the AI assistant and optional downstream flows.
 * Flags control whether each entry is injected into the agent, research-style tools, or message generation.
 */
export const adminAgentKnowledgeEntries = pgTable("admin_agent_knowledge_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  useInAgent: boolean("use_in_agent").default(true).notNull(),
  useInResearch: boolean("use_in_research").default(true).notNull(),
  useInMessages: boolean("use_in_messages").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminAgentKnowledgeEntryRow = typeof adminAgentKnowledgeEntries.$inferSelect;
export type InsertAdminAgentKnowledgeEntryRow = typeof adminAgentKnowledgeEntries.$inferInsert;

/** Growth diagnosis funnel: answers, scores, recommendation, and application form. */
export const growthFunnelLeads = pgTable("growth_funnel_leads", {
  id: serial("id").primaryKey(),
  answers: json("answers").$type<Record<string, string>>().notNull(),
  totalScore: integer("total_score").notNull(),
  brandScore: integer("brand_score").notNull(),
  designScore: integer("design_score").notNull(),
  systemScore: integer("system_score").notNull(),
  primaryBottleneck: text("primary_bottleneck").notNull(), // brand | design | system
  recommendation: text("recommendation").notNull(), // style_studio | macon_designs | ascendra
  name: text("name"),
  email: text("email"),
  businessName: text("business_name"),
  website: text("website"),
  monthlyRevenue: text("monthly_revenue"),
  mainChallenge: text("main_challenge"),
  timeline: text("timeline"),
  budgetRange: text("budget_range"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GrowthFunnelLead = typeof growthFunnelLeads.$inferSelect;
export type InsertGrowthFunnelLead = typeof growthFunnelLeads.$inferInsert;

/** Offer Valuation Engine access/config toggles (singleton row id=1). */
export const offerValuationSettings = pgTable("offer_valuation_settings", {
  id: integer("id").primaryKey().default(1),
  /** internal_tool | client_tool | lead_magnet | paid_tool */
  accessMode: text("access_mode").notNull().default("internal_tool"),
  clientAccessEnabled: boolean("client_access_enabled").notNull().default(false),
  publicAccessEnabled: boolean("public_access_enabled").notNull().default(false),
  /** Future-ready monetization switch. */
  paidModeEnabled: boolean("paid_mode_enabled").notNull().default(false),
  aiDefaultEnabled: boolean("ai_default_enabled").notNull().default(false),
  requireLeadCapture: boolean("require_lead_capture").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OfferValuationSettings = typeof offerValuationSettings.$inferSelect;
export type InsertOfferValuationSettings = typeof offerValuationSettings.$inferInsert;

/**
 * Ascendra OS — global access toggles (singleton id=1).
 * When public access is off, gated public /api/market/* and client lead-magnet flows stay internal-only;
 * subscription checks layer on top when you ship client auth.
 */
export const ascendraOsSettings = pgTable("ascendra_os_settings", {
  id: integer("id").primaryKey().default(1),
  /** Master switch for public/guest market tools and future client-facing OS surfaces (AMIE-related APIs, etc.). */
  publicAccessEnabled: boolean("public_access_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AscendraOsSettings = typeof ascendraOsSettings.$inferSelect;
export type InsertAscendraOsSettings = typeof ascendraOsSettings.$inferInsert;

/** Offer Valuation Engine submissions and scored outputs. */
export const offerValuations = pgTable("offer_valuations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  /** crm_contacts.id when this came from public lead capture flow. */
  leadId: integer("lead_id"),
  /** internal_tool | client_tool | lead_magnet | paid_tool */
  accessMode: text("access_mode").notNull().default("internal_tool"),
  persona: text("persona"),
  offerName: text("offer_name").notNull(),
  description: text("description").notNull(),
  dreamOutcomeScore: integer("dream_outcome_score").notNull(),
  likelihoodScore: integer("likelihood_score").notNull(),
  timeDelayScore: integer("time_delay_score").notNull(),
  effortScore: integer("effort_score").notNull(),
  /** Normalized 0-10 score from 100M value equation. */
  finalScore: real("final_score").notNull(),
  aiEnabled: boolean("ai_enabled").notNull().default(false),
  insights: json("insights").$type<Record<string, unknown>>().notNull(),
  /** First-touch ad attribution (mirrors payload + CRM when present). */
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OfferValuation = typeof offerValuations.$inferSelect;
export type InsertOfferValuation = typeof offerValuations.$inferInsert;

// Client Quotes schema (from assessments/proposals)
export const clientQuotes = pgTable("client_quotes", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => projectAssessments.id),
  userId: integer("user_id").references(() => users.id),
  quoteNumber: text("quote_number").notNull().unique(),
  title: text("title").notNull(),
  proposalData: json("proposal_data").$type<any>().notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").default("pending"), // pending, sent, accepted, rejected, expired, in_development, completed
  validUntil: timestamp("valid_until"),
  viewToken: text("view_token").unique(), // secure link for client to view/approve without login
  paymentPlan: text("payment_plan"), // "30-30-40" | "50-25-25" set when client accepts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Line item shape for invoice items (Stripe uses amount in cents, pre-tax per unit)
export type InvoiceLineItem = {
  description: string;
  amount: number;
  quantity?: number;
  /** Overrides invoice-level sale type for this line when set */
  saleType?: "service" | "product";
};

/** Saved catalog rows for quick line-item entry on new invoices */
export const invoiceLineItemPresets = pgTable("invoice_line_item_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  defaultAmountCents: integer("default_amount_cents"),
  defaultQuantity: integer("default_quantity").notNull().default(1),
  saleType: text("sale_type").notNull().default("service"), // service | product
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InvoiceLineItemPreset = typeof invoiceLineItemPresets.$inferSelect;
export type InsertInvoiceLineItemPreset = typeof invoiceLineItemPresets.$inferInsert;

// Client Invoices schema (Stripe-backed)
export const clientInvoices = pgTable("client_invoices", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => clientQuotes.id),
  userId: integer("user_id").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(), // grand total in cents (subtotal + tax)
  /** Sum of line items pre-tax */
  subtotalCents: integer("subtotal_cents"),
  taxRatePercent: real("tax_rate_percent"),
  taxAmountCents: integer("tax_amount_cents").default(0),
  /** Default sale context for line descriptions (service / product / mixed) */
  invoiceSaleType: text("invoice_sale_type").$type<"service" | "product" | "mixed" | null>(),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeCustomerId: text("stripe_customer_id"),
  recipientEmail: text("recipient_email"),
  hostInvoiceUrl: text("host_invoice_url"),
  lineItems: json("line_items").$type<InvoiceLineItem[]>(),
  lastReminderAt: timestamp("last_reminder_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client Announcements schema
export const clientAnnouncements = pgTable("client_announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("info"), // info, warning, success, update
  isActive: boolean("is_active").default(true),
  targetAudience: text("target_audience").default("all"), // all, specific_users, specific_projects
  targetUserIds: json("target_user_ids").$type<number[]>(),
  targetProjectIds: json("target_project_ids").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Client Feedback schema
export const clientFeedback = pgTable("client_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  assessmentId: integer("assessment_id").references(() => projectAssessments.id),
  quoteId: integer("quote_id").references(() => clientQuotes.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category").default("general"), // general, quote, project, invoice, support
  status: text("status").default("new"), // new, read, responded, resolved, archived
  adminResponse: text("admin_response"),
  respondedAt: timestamp("responded_at"),
  respondedBy: integer("responded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientQuoteSchema = createInsertSchema(clientQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientInvoiceSchema = createInsertSchema(clientInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientAnnouncementSchema = createInsertSchema(clientAnnouncements).omit({
  id: true,
  createdAt: true,
});

export const insertClientFeedbackSchema = createInsertSchema(clientFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClientQuote = z.infer<typeof insertClientQuoteSchema>;
export type ClientQuote = typeof clientQuotes.$inferSelect;
export type InsertClientInvoice = z.infer<typeof insertClientInvoiceSchema>;
export type ClientInvoice = typeof clientInvoices.$inferSelect;
export type InsertClientAnnouncement = z.infer<typeof insertClientAnnouncementSchema>;
export type ClientAnnouncement = typeof clientAnnouncements.$inferSelect;
export type InsertClientFeedback = z.infer<typeof insertClientFeedbackSchema>;
export type ClientFeedback = typeof clientFeedback.$inferSelect;

/** Server-side cache row for GET /api/client/growth-snapshot (short TTL; JSON validated on read). */
export const clientGrowthSnapshots = pgTable("client_growth_snapshots", {
  userId: integer("user_id")
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  snapshotJson: json("snapshot_json").$type<Record<string, unknown>>().notNull(),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});
export type ClientGrowthSnapshotRow = typeof clientGrowthSnapshots.$inferSelect;

/** Growth Diagnosis Engine: persisted audit reports (for admin and email/export). */
export const growthDiagnosisReports = pgTable("growth_diagnosis_reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(),
  url: text("url").notNull(),
  email: text("email"),
  businessType: text("business_type"),
  primaryGoal: text("primary_goal"),
  requestPayload: json("request_payload").$type<Record<string, unknown>>(),
  reportPayload: json("report_payload").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("completed"),
  pagesAnalyzed: integer("pages_analyzed").default(0),
  overallScore: integer("overall_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type GrowthDiagnosisReport = typeof growthDiagnosisReports.$inferSelect;
export type InsertGrowthDiagnosisReport = typeof growthDiagnosisReports.$inferInsert;

export * from "./growthOsSchema";
export * from "./growthIntelligenceSchema";
export * from "./internalStudioSchema";
export * from "./crmSchema";
export * from "./newsletterSchema";
export * from "./brandVaultSchema";
export * from "./communicationsSchema";
export * from "./emailHubSchema";
export * from "./paidGrowthSchema";
export * from "./schedulingSchema";
export * from "./afnSchema";
export * from "./ascendraIntelligenceSchema";
export * from "./amieSchema";
export * from "./experimentationEngineSchema";
export * from "./serviceAgreementSchema";
export * from "./behaviorIntelligenceSchema";
export * from "./agencyOsSchema";
