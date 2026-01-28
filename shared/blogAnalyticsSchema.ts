import { pgTable, serial, integer, text, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { blogPosts } from "./schema";

// Blog post analytics/views tracking
export const blogPostViews = pgTable("blog_post_views", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  sessionId: text("session_id").notNull(), // Unique session identifier
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  // Scroll tracking
  maxScrollDepth: integer("max_scroll_depth").default(0), // Percentage (0-100)
  timeSpent: integer("time_spent").default(0), // Time in seconds
  readComplete: boolean("read_complete").default(false).notNull(), // Whether user scrolled to bottom
  // Engagement metrics
  scrollEvents: json("scroll_events").$type<Array<{ timestamp: number; depth: number }>>(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
});

export const insertBlogPostViewSchema = createInsertSchema(blogPostViews).omit({
  id: true,
  viewedAt: true,
  lastActivityAt: true,
});

export type InsertBlogPostView = z.infer<typeof insertBlogPostViewSchema>;
export type BlogPostView = typeof blogPostViews.$inferSelect;
