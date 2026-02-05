import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
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
  full_name: text("full_name"),
  // GitHub OAuth related fields
  githubId: text("github_id"),
  githubUsername: text("github_username"),
  avatarUrl: text("avatar_url"),
  // Password reset fields
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
  adminApproved: true,
  role: true,
  full_name: true,
  githubId: true,
  githubUsername: true,
  avatarUrl: true,
  created_at: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
}).extend({
  coverImage: z.string().optional(),
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

// Client Quotes schema (from assessments/proposals)
export const clientQuotes = pgTable("client_quotes", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => projectAssessments.id),
  userId: integer("user_id").references(() => users.id),
  quoteNumber: text("quote_number").notNull().unique(),
  title: text("title").notNull(),
  proposalData: json("proposal_data").$type<any>().notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").default("pending"), // pending, sent, accepted, rejected, expired
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Line item shape for invoice items (Stripe uses amount in cents)
export type InvoiceLineItem = { description: string; amount: number; quantity?: number };

// Client Invoices schema (Stripe-backed)
export const clientInvoices = pgTable("client_invoices", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => clientQuotes.id),
  userId: integer("user_id").references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(), // total in cents
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
