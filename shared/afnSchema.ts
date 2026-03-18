/**
 * Ascendra Founder Network (AFN) — community schema.
 * All tables reference users.id via user_id / author_id / reporter_id etc.
 * Export from shared/schema.ts so Drizzle push includes them.
 */
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// —— Profiles (1:1 with users) ——
export const afnProfiles = pgTable(
  "afn_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().unique(),
    fullName: text("full_name"),
    displayName: text("display_name"),
    username: text("username").unique(),
    avatarUrl: text("avatar_url"),
    headline: text("headline"),
    bio: text("bio"),
    businessName: text("business_name"),
    businessStage: text("business_stage"),
    industry: text("industry"),
    location: text("location"),
    websiteUrl: text("website_url"),
    linkedinUrl: text("linkedin_url"),
    otherSocialUrl: text("other_social_url"),
    whatBuilding: text("what_building"),
    biggestChallenge: text("biggest_challenge"),
    goals: text("goals"),
    lookingFor: text("looking_for"),
    collaborationInterests: text("collaboration_interests"),
    askMeAbout: text("ask_me_about"),
    featuredResourceUrl: text("featured_resource_url"),
    profileCompletionScore: integer("profile_completion_score").default(0),
    isOnboardingComplete: boolean("is_onboarding_complete").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("afn_profiles_username_idx").on(t.username)]
);

export type AfnProfile = typeof afnProfiles.$inferSelect;
export type InsertAfnProfile = typeof afnProfiles.$inferInsert;

// —— Profile settings / privacy ——
export const afnProfileSettings = pgTable("afn_profile_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  profileVisibility: text("profile_visibility").default("public").notNull(), // public | private
  messagePermission: text("message_permission").default("none").notNull(), // none | collab_only | allow
  openToCollaborate: boolean("open_to_collaborate").default(false),
  showActivity: boolean("show_activity").default(true),
  showContactLinks: boolean("show_contact_links").default(true),
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(true),
  inAppNotificationsEnabled: boolean("in_app_notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnProfileSettings = typeof afnProfileSettings.$inferSelect;
export type InsertAfnProfileSettings = typeof afnProfileSettings.$inferInsert;

// —— Member tags (e.g. founder, freelancer) ——
export const afnMemberTags = pgTable("afn_member_tags", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export type AfnMemberTag = typeof afnMemberTags.$inferSelect;
export type InsertAfnMemberTag = typeof afnMemberTags.$inferInsert;

export const afnProfileMemberTags = pgTable("afn_profile_member_tags", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => afnProfiles.id, { onDelete: "cascade" }),
  memberTagId: integer("member_tag_id").notNull().references(() => afnMemberTags.id, { onDelete: "cascade" }),
});

export type AfnProfileMemberTag = typeof afnProfileMemberTags.$inferSelect;
export type InsertAfnProfileMemberTag = typeof afnProfileMemberTags.$inferInsert;

// —— Discussion categories ——
export const afnDiscussionCategories = pgTable("afn_discussion_categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export type AfnDiscussionCategory = typeof afnDiscussionCategories.$inferSelect;
export type InsertAfnDiscussionCategory = typeof afnDiscussionCategories.$inferInsert;

// —— Discussion posts ——
export const afnDiscussionPosts = pgTable("afn_discussion_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  categoryId: integer("category_id").notNull().references(() => afnDiscussionCategories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  body: text("body").notNull(),
  excerpt: text("excerpt"),
  status: text("status").default("published").notNull(), // draft | published | archived
  isFeatured: boolean("is_featured").default(false),
  helpfulCount: integer("helpful_count").default(0),
  commentCount: integer("comment_count").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnDiscussionPost = typeof afnDiscussionPosts.$inferSelect;
export type InsertAfnDiscussionPost = typeof afnDiscussionPosts.$inferInsert;

export const afnDiscussionPostTags = pgTable("afn_discussion_post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => afnDiscussionPosts.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
});

export type AfnDiscussionPostTag = typeof afnDiscussionPostTags.$inferSelect;
export type InsertAfnDiscussionPostTag = typeof afnDiscussionPostTags.$inferInsert;

// —— Comments ——
export const afnDiscussionComments = pgTable("afn_discussion_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => afnDiscussionPosts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull(),
  parentCommentId: integer("parent_comment_id"),
  body: text("body").notNull(),
  status: text("status").default("published").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnDiscussionComment = typeof afnDiscussionComments.$inferSelect;
export type InsertAfnDiscussionComment = typeof afnDiscussionComments.$inferInsert;

// —— Reactions (helpful/like) ——
export const afnDiscussionReactions = pgTable(
  "afn_discussion_reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull().references(() => afnDiscussionPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull(),
    reactionType: text("reaction_type").default("helpful").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("afn_reactions_post_user").on(t.postId, t.userId)]
);

export type AfnDiscussionReaction = typeof afnDiscussionReactions.$inferSelect;
export type InsertAfnDiscussionReaction = typeof afnDiscussionReactions.$inferInsert;

// —— Saved posts ——
export const afnSavedPosts = pgTable(
  "afn_saved_posts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    postId: integer("post_id").notNull().references(() => afnDiscussionPosts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("afn_saved_user_post").on(t.userId, t.postId)]
);

export type AfnSavedPost = typeof afnSavedPosts.$inferSelect;
export type InsertAfnSavedPost = typeof afnSavedPosts.$inferInsert;

// —— Collaboration posts ——
export const afnCollaborationPosts = pgTable("afn_collaboration_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  type: text("type").notNull(), // looking_for_developer | offering_services | etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open").notNull(), // open | closed
  contactPreference: text("contact_preference").default("inbox"),
  externalContactUrl: text("external_contact_url"),
  budgetRange: text("budget_range"),
  timeline: text("timeline"),
  industry: text("industry"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnCollaborationPost = typeof afnCollaborationPosts.$inferSelect;
export type InsertAfnCollaborationPost = typeof afnCollaborationPosts.$inferInsert;

// —— Private messaging ——
export const afnMessageThreads = pgTable("afn_message_threads", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull(),
  threadType: text("thread_type").default("direct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnMessageThread = typeof afnMessageThreads.$inferSelect;
export type InsertAfnMessageThread = typeof afnMessageThreads.$inferInsert;

export const afnMessageThreadParticipants = pgTable("afn_message_thread_participants", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => afnMessageThreads.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull(),
  lastReadAt: timestamp("last_read_at"),
});

export type AfnMessageThreadParticipant = typeof afnMessageThreadParticipants.$inferSelect;
export type InsertAfnMessageThreadParticipant = typeof afnMessageThreadParticipants.$inferInsert;

export const afnMessages = pgTable("afn_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => afnMessageThreads.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AfnMessage = typeof afnMessages.$inferSelect;
export type InsertAfnMessage = typeof afnMessages.$inferInsert;

// —— Resources ——
export const afnResources = pgTable("afn_resources", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").default("guide").notNull(),
  coverImageUrl: text("cover_image_url"),
  contentUrl: text("content_url"),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnResource = typeof afnResources.$inferSelect;
export type InsertAfnResource = typeof afnResources.$inferInsert;

export const afnUserResourceViews = pgTable("afn_user_resource_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  resourceId: integer("resource_id").notNull().references(() => afnResources.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export type AfnUserResourceView = typeof afnUserResourceViews.$inferSelect;
export type InsertAfnUserResourceView = typeof afnUserResourceViews.$inferInsert;

// —— Connections (for friend suggestions and "already connected" exclusion) ——
export const afnConnections = pgTable(
  "afn_connections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    connectedUserId: integer("connected_user_id").notNull(),
    status: text("status").default("accepted").notNull(), // pending | accepted
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("afn_connections_pair").on(t.userId, t.connectedUserId)]
);

export type AfnConnection = typeof afnConnections.$inferSelect;
export type InsertAfnConnection = typeof afnConnections.$inferInsert;

// —— Lead signals ——
export const afnLeadSignals = pgTable("afn_lead_signals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  signalType: text("signal_type").notNull(),
  signalValue: text("signal_value"),
  source: text("source").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AfnLeadSignal = typeof afnLeadSignals.$inferSelect;
export type InsertAfnLeadSignal = typeof afnLeadSignals.$inferInsert;

// —— Notifications ——
export const afnNotifications = pgTable("afn_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AfnNotification = typeof afnNotifications.$inferSelect;
export type InsertAfnNotification = typeof afnNotifications.$inferInsert;

// —— Moderation reports ——
export const afnModerationReports = pgTable("afn_moderation_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  targetType: text("target_type").notNull(), // post | comment | collab_post | profile
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("pending").notNull(), // pending | reviewed | resolved | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AfnModerationReport = typeof afnModerationReports.$inferSelect;
export type InsertAfnModerationReport = typeof afnModerationReports.$inferInsert;
