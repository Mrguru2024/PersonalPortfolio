/**
 * AFN (Ascendra Founder Network) data access.
 * Uses shared schema and server db. Call from API routes with getSessionUser for auth.
 */
import { db } from "./db";
import {
  afnProfiles,
  afnProfileSettings,
  afnMemberTags,
  afnProfileMemberTags,
  afnDiscussionCategories,
  afnDiscussionPosts,
  afnDiscussionPostTags,
  afnDiscussionComments,
  afnDiscussionReactions,
  afnSavedPosts,
  afnCollaborationPosts,
  afnMessageThreads,
  afnMessageThreadParticipants,
  afnMessages,
  afnResources,
  afnUserResourceViews,
  afnLeadSignals,
  afnNotifications,
  afnModerationReports,
  afnConnections,
  type InsertAfnProfile,
  type InsertAfnProfileSettings,
  type InsertAfnDiscussionPost,
  type InsertAfnDiscussionComment,
  type InsertAfnDiscussionReaction,
  type InsertAfnSavedPost,
  type InsertAfnCollaborationPost,
  type InsertAfnMessageThread,
  type InsertAfnMessageThreadParticipant,
  type InsertAfnMessage,
  type InsertAfnLeadSignal,
  type InsertAfnNotification,
  type InsertAfnModerationReport,
  type InsertAfnConnection,
} from "@shared/schema";
import { eq, and, desc, sql, inArray, ne, notInArray } from "drizzle-orm";

// —— Profiles ——
export async function getAfnProfileByUserId(userId: number) {
  const [row] = await db.select().from(afnProfiles).where(eq(afnProfiles.userId, userId)).limit(1);
  return row ?? null;
}

export async function getAfnProfileByUsername(username: string) {
  const [row] = await db.select().from(afnProfiles).where(eq(afnProfiles.username, username)).limit(1);
  return row ?? null;
}

export async function getAfnProfileById(id: number) {
  const [row] = await db.select().from(afnProfiles).where(eq(afnProfiles.id, id)).limit(1);
  return row ?? null;
}

/** List profiles for member directory. If currentUserId provided, include that user's profile; otherwise only public. */
export async function getAfnProfilesForDirectory(options: { currentUserId?: number; limit?: number; industry?: string; businessStage?: string }) {
  const limit = Math.min(options.limit ?? 50, 100);
  const settingsJoin = db
    .select({
      userId: afnProfileSettings.userId,
      profileVisibility: afnProfileSettings.profileVisibility,
    })
    .from(afnProfileSettings)
    .as("s");
  const dirConditions = [eq(afnProfiles.isOnboardingComplete, true)];
  if (options.industry) dirConditions.push(eq(afnProfiles.industry, options.industry));
  if (options.businessStage) dirConditions.push(eq(afnProfiles.businessStage, options.businessStage));
  const rows = await db
    .select()
    .from(afnProfiles)
    .where(and(...dirConditions))
    .orderBy(desc(afnProfiles.updatedAt))
    .limit(limit * 2);
  if (rows.length === 0) return [];
  const userIds = rows.map((r) => r.userId);
  const settingsRows = await db
    .select()
    .from(afnProfileSettings)
    .where(inArray(afnProfileSettings.userId, userIds));
  const settingsByUser = new Map(settingsRows.map((s) => [s.userId, s]));
  const filtered = rows.filter((p) => {
    const s = settingsByUser.get(p.userId);
    if (s?.profileVisibility === "public") return true;
    if (options.currentUserId && p.userId === options.currentUserId) return true;
    return false;
  });
  return filtered.slice(0, limit);
}

/** Update only profile photo URL (does not touch other columns). */
export async function setAfnProfileAvatarUrl(userId: number, avatarUrl: string | null) {
  const now = new Date();
  const existing = await getAfnProfileByUserId(userId);
  if (existing) {
    const [updated] = await db
      .update(afnProfiles)
      .set({ avatarUrl, updatedAt: now })
      .where(eq(afnProfiles.userId, userId))
      .returning();
    return updated ?? null;
  }
  const [inserted] = await db
    .insert(afnProfiles)
    .values({ userId, avatarUrl, createdAt: now, updatedAt: now })
    .returning();
  return inserted ?? null;
}

export async function upsertAfnProfile(profile: InsertAfnProfile & { userId: number }) {
  const now = new Date();
  const existing = await getAfnProfileByUserId(profile.userId);
  if (existing) {
    const [updated] = await db
      .update(afnProfiles)
      .set({
        ...profile,
        id: undefined,
        userId: undefined,
        createdAt: undefined,
        updatedAt: now,
      } as Partial<InsertAfnProfile>)
      .where(eq(afnProfiles.userId, profile.userId))
      .returning();
    return updated!;
  }
  const [inserted] = await db.insert(afnProfiles).values({ ...profile, createdAt: now, updatedAt: now }).returning();
  return inserted!;
}

// —— Profile settings ——
export async function getAfnProfileSettings(userId: number) {
  const [row] = await db.select().from(afnProfileSettings).where(eq(afnProfileSettings.userId, userId)).limit(1);
  return row ?? null;
}

export async function upsertAfnProfileSettings(settings: InsertAfnProfileSettings & { userId: number }) {
  const now = new Date();
  const existing = await getAfnProfileSettings(settings.userId);
  if (existing) {
    const [updated] = await db
      .update(afnProfileSettings)
      .set({
        profileVisibility: settings.profileVisibility,
        messagePermission: settings.messagePermission,
        openToCollaborate: settings.openToCollaborate,
        showActivity: settings.showActivity,
        showContactLinks: settings.showContactLinks,
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        inAppNotificationsEnabled: settings.inAppNotificationsEnabled,
        updatedAt: now,
      })
      .where(eq(afnProfileSettings.userId, settings.userId))
      .returning();
    return updated!;
  }
  const [inserted] = await db.insert(afnProfileSettings).values({ ...settings, createdAt: now, updatedAt: now }).returning();
  return inserted!;
}

/** Returns true if the target user allows messages from others (server-side check). */
export function canMessageTarget(settings: { messagePermission: string; openToCollaborate: boolean } | null): boolean {
  if (!settings) return false;
  if (settings.messagePermission === "allow") return true;
  if (settings.messagePermission === "collab_only" && settings.openToCollaborate) return true;
  return false;
}

// —— Connections ——
/** User IDs that the current user is connected with (either direction). */
export async function getAfnConnectionUserIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ connectedUserId: afnConnections.connectedUserId })
    .from(afnConnections)
    .where(eq(afnConnections.userId, userId));
  const rows2 = await db
    .select({ userId: afnConnections.userId })
    .from(afnConnections)
    .where(eq(afnConnections.connectedUserId, userId));
  const ids = new Set<number>();
  rows.forEach((r) => ids.add(r.connectedUserId));
  rows2.forEach((r) => ids.add(r.userId));
  return Array.from(ids);
}

/** User IDs that the current user has at least one message thread with. */
export async function getAfnAlreadyMessagedUserIds(userId: number): Promise<number[]> {
  const myThreads = await db
    .select({ threadId: afnMessageThreadParticipants.threadId })
    .from(afnMessageThreadParticipants)
    .where(eq(afnMessageThreadParticipants.userId, userId));
  const threadIds = myThreads.map((t) => t.threadId);
  if (threadIds.length === 0) return [];
  const others = await db
    .select({ userId: afnMessageThreadParticipants.userId })
    .from(afnMessageThreadParticipants)
    .where(inArray(afnMessageThreadParticipants.threadId, threadIds));
  const ids = new Set<number>();
  others.forEach((o) => { if (o.userId !== userId) ids.add(o.userId); });
  return Array.from(ids);
}

export async function addAfnConnection(connection: InsertAfnConnection) {
  const [inserted] = await db.insert(afnConnections).values(connection).returning();
  return inserted!;
}

/** Candidate profiles for connection suggestions: completed, visible, excluding self and optionally connected/messaged. */
export async function getAfnCandidateProfilesForSuggestions(options: {
  currentUserId: number;
  limit?: number;
  excludeConnected?: boolean;
  excludeAlreadyMessaged?: boolean;
}) {
  const limit = Math.min(options.limit ?? 30, 100);
  const excludeConnected = options.excludeConnected !== false;
  const excludeAlreadyMessaged = options.excludeAlreadyMessaged !== false;

  let excludeUserIds: number[] = [options.currentUserId];
  if (excludeConnected) {
    const connected = await getAfnConnectionUserIds(options.currentUserId);
    excludeUserIds = [...excludeUserIds, ...connected];
  }
  if (excludeAlreadyMessaged) {
    const messaged = await getAfnAlreadyMessagedUserIds(options.currentUserId);
    excludeUserIds = [...new Set([...excludeUserIds, ...messaged])];
  }

  const settingsRows = await db.select().from(afnProfileSettings).where(eq(afnProfileSettings.profileVisibility, "public"));
  const publicUserIds = new Set(settingsRows.map((s) => s.userId));

  const conditions = [
    eq(afnProfiles.isOnboardingComplete, true),
    ne(afnProfiles.userId, options.currentUserId),
  ];
  if (excludeUserIds.length > 0) conditions.push(notInArray(afnProfiles.userId, excludeUserIds));

  const rows = await db
    .select()
    .from(afnProfiles)
    .where(and(...conditions))
    .orderBy(desc(afnProfiles.updatedAt))
    .limit(limit * 2);

  const filtered = rows.filter((p) => publicUserIds.has(p.userId) && !excludeUserIds.includes(p.userId));
  return filtered.slice(0, limit);
}

// —— Member tags ——
export async function getAfnMemberTags() {
  return db.select().from(afnMemberTags).orderBy(afnMemberTags.slug);
}

// —— Discussion categories ——
export async function getAfnDiscussionCategories(activeOnly = true) {
  const conditions = activeOnly ? [eq(afnDiscussionCategories.isActive, true)] : [];
  return db
    .select()
    .from(afnDiscussionCategories)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(afnDiscussionCategories.sortOrder, afnDiscussionCategories.slug);
}

// —— Discussion posts ——
export async function getAfnDiscussionPosts(filters: {
  categoryId?: number;
  authorId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(afnDiscussionPosts.status, filters.status ?? "published")];
  if (filters.categoryId != null) conditions.push(eq(afnDiscussionPosts.categoryId, filters.categoryId));
  if (filters.authorId != null) conditions.push(eq(afnDiscussionPosts.authorId, filters.authorId));
  const limit = Math.min(filters.limit ?? 20, 50);
  const offset = filters.offset ?? 0;
  return db
    .select()
    .from(afnDiscussionPosts)
    .where(and(...conditions))
    .orderBy(desc(afnDiscussionPosts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAfnDiscussionPostById(id: number) {
  const [row] = await db.select().from(afnDiscussionPosts).where(eq(afnDiscussionPosts.id, id)).limit(1);
  return row ?? null;
}

export async function createAfnDiscussionPost(post: InsertAfnDiscussionPost) {
  const now = new Date();
  const [inserted] = await db
    .insert(afnDiscussionPosts)
    .values({ ...post, createdAt: now, updatedAt: now })
    .returning();
  return inserted!;
}

export async function updateAfnDiscussionPost(id: number, updates: Partial<InsertAfnDiscussionPost>) {
  const [updated] = await db
    .update(afnDiscussionPosts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(afnDiscussionPosts.id, id))
    .returning();
  return updated ?? null;
}

export async function incrementAfnPostViewCount(postId: number) {
  await db
    .update(afnDiscussionPosts)
    .set({
      viewCount: sql`${afnDiscussionPosts.viewCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(afnDiscussionPosts.id, postId));
}

// —— Comments ——
export async function getAfnCommentsByPostId(postId: number) {
  return db
    .select()
    .from(afnDiscussionComments)
    .where(eq(afnDiscussionComments.postId, postId))
    .orderBy(afnDiscussionComments.createdAt);
}

export async function createAfnDiscussionComment(comment: InsertAfnDiscussionComment) {
  const now = new Date();
  const [inserted] = await db
    .insert(afnDiscussionComments)
    .values({ ...comment, createdAt: now, updatedAt: now })
    .returning();
  if (inserted) {
    await db
      .update(afnDiscussionPosts)
      .set({
        commentCount: sql`${afnDiscussionPosts.commentCount} + 1`,
        updatedAt: now,
      })
      .where(eq(afnDiscussionPosts.id, comment.postId));
  }
  return inserted!;
}

// —— Reactions ——
export async function toggleAfnPostReaction(postId: number, userId: number, reactionType = "helpful") {
  const existing = await db
    .select()
    .from(afnDiscussionReactions)
    .where(and(eq(afnDiscussionReactions.postId, postId), eq(afnDiscussionReactions.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(afnDiscussionReactions).where(eq(afnDiscussionReactions.id, existing[0].id));
    await db
      .update(afnDiscussionPosts)
      .set({
        helpfulCount: sql`greatest(0, ${afnDiscussionPosts.helpfulCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(afnDiscussionPosts.id, postId));
    return { added: false };
  }
  await db.insert(afnDiscussionReactions).values({ postId, userId, reactionType });
  await db
    .update(afnDiscussionPosts)
    .set({
      helpfulCount: sql`${afnDiscussionPosts.helpfulCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(afnDiscussionPosts.id, postId));
  return { added: true };
}

// —— Saved posts ——
export async function getAfnSavedPostIds(userId: number): Promise<number[]> {
  const rows = await db.select({ postId: afnSavedPosts.postId }).from(afnSavedPosts).where(eq(afnSavedPosts.userId, userId));
  return rows.map((r) => r.postId);
}

export async function toggleAfnSavedPost(userId: number, postId: number) {
  const existing = await db
    .select()
    .from(afnSavedPosts)
    .where(and(eq(afnSavedPosts.userId, userId), eq(afnSavedPosts.postId, postId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(afnSavedPosts).where(eq(afnSavedPosts.id, existing[0].id));
    return { saved: false };
  }
  await db.insert(afnSavedPosts).values({ userId, postId });
  return { saved: true };
}

// —— Collaboration posts ——
export async function getAfnCollaborationPosts(filters: { status?: string; type?: string; limit?: number }) {
  const conditions = [];
  if (filters.status) conditions.push(eq(afnCollaborationPosts.status, filters.status));
  if (filters.type) conditions.push(eq(afnCollaborationPosts.type, filters.type));
  const limit = Math.min(filters.limit ?? 20, 50);
  return db
    .select()
    .from(afnCollaborationPosts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(afnCollaborationPosts.createdAt))
    .limit(limit);
}

export async function getAfnCollaborationPostById(id: number) {
  const [row] = await db.select().from(afnCollaborationPosts).where(eq(afnCollaborationPosts.id, id)).limit(1);
  return row ?? null;
}

export async function updateAfnCollaborationPost(id: number, updates: Partial<InsertAfnCollaborationPost>) {
  const [updated] = await db
    .update(afnCollaborationPosts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(afnCollaborationPosts.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteAfnCollaborationPost(id: number) {
  await db.delete(afnCollaborationPosts).where(eq(afnCollaborationPosts.id, id));
}

export async function createAfnCollaborationPost(post: InsertAfnCollaborationPost) {
  const now = new Date();
  const [inserted] = await db.insert(afnCollaborationPosts).values({ ...post, createdAt: now, updatedAt: now }).returning();
  return inserted!;
}

// —— Messages ——
export async function getOrCreateDirectThread(userId1: number, userId2: number) {
  const myParticipations = await db
    .select({ threadId: afnMessageThreadParticipants.threadId })
    .from(afnMessageThreadParticipants)
    .where(eq(afnMessageThreadParticipants.userId, userId1));
  const threadIds = myParticipations.map((p) => p.threadId);
  if (threadIds.length > 0) {
    const otherInSame = await db
      .select({ threadId: afnMessageThreadParticipants.threadId })
      .from(afnMessageThreadParticipants)
      .where(
        and(
          inArray(afnMessageThreadParticipants.threadId, threadIds),
          eq(afnMessageThreadParticipants.userId, userId2)
        )
      )
      .limit(1);
    if (otherInSame.length > 0) {
      const [t] = await db.select().from(afnMessageThreads).where(eq(afnMessageThreads.id, otherInSame[0].threadId)).limit(1);
      return t!;
    }
  }
  const now = new Date();
  const [thread] = await db.insert(afnMessageThreads).values({ createdBy: userId1, threadType: "direct", createdAt: now, updatedAt: now }).returning();
  await db.insert(afnMessageThreadParticipants).values([
    { threadId: thread!.id, userId: userId1 },
    { threadId: thread!.id, userId: userId2 },
  ]);
  return thread!;
}

export async function getAfnUserThreads(userId: number) {
  const participantRows = await db
    .select()
    .from(afnMessageThreadParticipants)
    .where(eq(afnMessageThreadParticipants.userId, userId));
  const threadIds = participantRows.map((p) => p.threadId);
  if (threadIds.length === 0) return [];
  return db.select().from(afnMessageThreads).where(inArray(afnMessageThreads.id, threadIds)).orderBy(desc(afnMessageThreads.updatedAt));
}

export async function getAfnThreadMessages(threadId: number, limit = 50) {
  return db
    .select()
    .from(afnMessages)
    .where(eq(afnMessages.threadId, threadId))
    .orderBy(afnMessages.createdAt)
    .limit(limit);
}

export async function createAfnMessage(msg: InsertAfnMessage) {
  const [inserted] = await db.insert(afnMessages).values(msg).returning();
  await db.update(afnMessageThreads).set({ updatedAt: new Date() }).where(eq(afnMessageThreads.id, msg.threadId));
  return inserted!;
}

// —— Resources ——
export async function getAfnResources(filters: { featured?: boolean; limit?: number }) {
  const conditions = [eq(afnResources.isPublished, true)];
  if (filters.featured) conditions.push(eq(afnResources.isFeatured, true));
  const limit = Math.min(filters.limit ?? 50, 100);
  return db
    .select()
    .from(afnResources)
    .where(and(...conditions))
    .orderBy(afnResources.createdAt)
    .limit(limit);
}

export async function getAfnResourceBySlug(slug: string) {
  const [row] = await db.select().from(afnResources).where(eq(afnResources.slug, slug)).limit(1);
  return row ?? null;
}

export async function getAfnResourceById(id: number) {
  const [row] = await db.select().from(afnResources).where(eq(afnResources.id, id)).limit(1);
  return row ?? null;
}

export async function recordAfnResourceView(userId: number, resourceId: number) {
  await db.insert(afnUserResourceViews).values({ userId, resourceId });
}

// —— Lead signals ——
export async function createAfnLeadSignal(signal: InsertAfnLeadSignal) {
  const [inserted] = await db.insert(afnLeadSignals).values(signal).returning();
  return inserted!;
}

// —— Notifications ——
export async function createAfnNotification(notification: InsertAfnNotification) {
  const [inserted] = await db.insert(afnNotifications).values(notification).returning();
  return inserted!;
}

// —— Moderation ——
export async function createAfnModerationReport(report: InsertAfnModerationReport) {
  const [inserted] = await db.insert(afnModerationReports).values(report).returning();
  return inserted!;
}
