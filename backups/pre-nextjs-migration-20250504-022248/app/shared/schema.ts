import { pgTable, serial, text, timestamp, boolean, integer, json, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * USERS
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  avatar: text("avatar"),
  bio: text("bio"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  avatar: true,
  bio: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/**
 * PROJECTS
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  demoUrl: text("demo_url"),
  githubUrl: text("github_url"),
  technologies: text("technologies").array(),
  featured: boolean("featured").default(false),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  demoType: text("demo_type").default("iframe"),
});

export const insertProjectSchema = createInsertSchema(projects);
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

/**
 * SKILLS
 */
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  // Using percentage for compatibility with database
  percentage: integer("percentage").notNull(), // 1-100
  endorsement_count: integer("endorsement_count").default(0).notNull(),
  icon: text("icon"),
  color: text("color"),
  yearsOfExperience: integer("years_of_experience"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSkillSchema = createInsertSchema(skills);
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

/**
 * CONTACTS
 */
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  ipAddress: true,
  isRead: true,
  createdAt: true,
});

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

/**
 * RESUME REQUESTS
 */
export const resumeRequests = pgTable("resume_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  reason: text("reason"),
  company: text("company"),
  token: text("token").notNull().unique(),
  accessed: boolean("accessed").default(false),
  accessedAt: timestamp("accessed_at"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResumeRequestSchema = createInsertSchema(resumeRequests).omit({
  id: true,
  token: true,
  accessed: true,
  accessedAt: true,
  ipAddress: true,
  createdAt: true,
});

export const resumeRequestFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  reason: z.string().min(10, "Please explain why you'd like to view my resume").max(500),
  company: z.string().optional(),
});

export type InsertResumeRequest = z.infer<typeof insertResumeRequestSchema>;
export type ResumeRequest = typeof resumeRequests.$inferSelect;

/**
 * BLOG POSTS
 */
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  tags: text("tags").array(),
  authorId: integer("author_id").notNull().references(() => users.id),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog post relations
export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
  comments: many(blogComments),
  contributions: many(blogPostContributions),
}));

/**
 * BLOG POST CONTRIBUTIONS
 */
export const blogPostContributions = pgTable("blog_post_contributions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contributorName: text("contributor_name").notNull(),
  contributorEmail: text("contributor_email").notNull(),
  ipAddress: text("ip_address"),
  postId: integer("post_id").references(() => blogPosts.id),
  isReviewed: boolean("is_reviewed").default(false),
  isApproved: boolean("is_approved").default(false),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  markedAsSpam: boolean("marked_as_spam").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog post contribution relations
export const blogPostContributionsRelations = relations(blogPostContributions, ({ one }) => ({
  blogPost: one(blogPosts, {
    fields: [blogPostContributions.postId],
    references: [blogPosts.id]
  }),
}));

/**
 * BLOG COMMENTS
 */
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false),
  ipAddress: text("ip_address"),
  markedAsSpam: boolean("marked_as_spam").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blog comment relations
export const blogCommentsRelations = relations(blogComments, ({ one }) => ({
  post: one(blogPosts, { fields: [blogComments.postId], references: [blogPosts.id] }),
}));

/**
 * SCHEMAS
 */
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  authorId: true,
  slug: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  isApproved: true,
  ipAddress: true,
  markedAsSpam: true,
  createdAt: true,
});

export const insertBlogPostContributionSchema = createInsertSchema(blogPostContributions).omit({
  id: true,
  ipAddress: true,
  isReviewed: true,
  isApproved: true,
  reviewNotes: true,
  reviewedAt: true,
  markedAsSpam: true,
  createdAt: true,
  updatedAt: true,
});

export const blogCommentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  content: z.string().min(3, "Comment must be at least 3 characters"),
});

export const blogPostContributionFormSchema = z.object({
  contributorName: z.string().min(2, "Name must be at least 2 characters"),
  contributorEmail: z.string().email("Please enter a valid email address"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(100, "Content must be at least 100 characters"),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogPostContribution = z.infer<typeof insertBlogPostContributionSchema>;
export type BlogPostContribution = typeof blogPostContributions.$inferSelect;