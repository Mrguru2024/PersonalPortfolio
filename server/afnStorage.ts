/**
 * AFN (Ascendra Founder Network) data access.
 * Uses shared schema and server db. Call from API routes with getSessionUser for auth.
 */
import { db } from "./db";
import {
  users,
  afnProfiles,
  afnProfileSettings,
  afnMemberTags,
  afnProfileMemberTags,
  afnSkillTags,
  afnProfileSkillTags,
  afnIndustryTags,
  afnProfileIndustryTags,
  afnInterestTags,
  afnProfileInterestTags,
  afnGoalTags,
  afnProfileGoalTags,
  afnChallengeTags,
  afnProfileChallengeTags,
  afnCollabPreferenceTags,
  afnProfileCollabPreferenceTags,
  afnProfileIntelligence,
  afnInvites,
  afnScoringConfig,
  afnLiveSessions,
  afnLiveProviderLogs,
  afnTimelineLiveOverrides,
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
  type InsertAfnInvite,
  type AfnProfileIntelligenceRow,
} from "@shared/schema";
import { eq, and, desc, sql, inArray, ne, notInArray, count, or, isNull, gt } from "drizzle-orm";
import { FOUNDER_TYPE_LABELS, isFounderType } from "@/lib/community/constants";

// —— Profiles ——
export async function getAfnProfileByUserId(userId: number) {
  const [row] = await db.select().from(afnProfiles).where(eq(afnProfiles.userId, userId)).limit(1);
  return row ?? null;
}

export async function getAfnProfileByUsername(username: string) {
  const [row] = await db.select().from(afnProfiles).where(eq(afnProfiles.username, username)).limit(1);
  return row ?? null;
}

export type AfnCommunitySnapshotForCrm = {
  userId: number;
  username: string;
  founderTribe: string | null;
  founderTribeLabel: string | null;
  headline: string | null;
  profileVisibility: string | null;
  publicProfilePath: string | null;
  isOnboardingComplete: boolean | null;
};

/** Resolve AFN profile context for a CRM contact email (admin-only use). Ignores profile visibility for tribe/headline. */
export async function getAfnCommunitySnapshotByEmail(
  email: string | null | undefined
): Promise<AfnCommunitySnapshotForCrm | null> {
  const normalized = email?.trim();
  if (!normalized) return null;
  const [userRow] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  if (!userRow) return null;
  const profile = await getAfnProfileByUserId(userRow.id);
  if (!profile) return null;
  const settings = await getAfnProfileSettings(userRow.id);
  const tribe = profile.founderTribe ?? null;
  let founderTribeLabel: string | null = null;
  if (tribe) {
    founderTribeLabel = isFounderType(tribe) ? FOUNDER_TYPE_LABELS[tribe] : tribe.replace(/_/g, " ");
  }
  const isPublic = settings?.profileVisibility !== "private";
  const slug = profile.username ?? userRow.username;
  return {
    userId: userRow.id,
    username: userRow.username,
    founderTribe: tribe,
    founderTribeLabel,
    headline: profile.headline ?? null,
    profileVisibility: settings?.profileVisibility ?? null,
    publicProfilePath: isPublic && slug ? `/Afn/members/${encodeURIComponent(slug)}` : null,
    isOnboardingComplete: profile.isOnboardingComplete ?? null,
  };
}

export async function getAfnProfileById(id: number) {
  const [row] = await db.select().from(afnProfiles).where(eq(afnProfiles.id, id)).limit(1);
  return row ?? null;
}

/** List profiles for member directory. If currentUserId provided, include that user's profile; otherwise only public. */
export async function getAfnProfilesForDirectory(options: {
  currentUserId?: number;
  limit?: number;
  industry?: string;
  businessStage?: string;
  founderTribe?: string;
}) {
  const limit = Math.min(options.limit ?? 50, 100);
  const dirConditions = [eq(afnProfiles.isOnboardingComplete, true)];
  if (options.industry) dirConditions.push(eq(afnProfiles.industry, options.industry));
  if (options.businessStage) dirConditions.push(eq(afnProfiles.businessStage, options.businessStage));
  if (options.founderTribe) dirConditions.push(eq(afnProfiles.founderTribe, options.founderTribe));
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

// —— Normalized profile tags (Phase 1) ——

export type AfnNormalizedTagSlugs = {
  skills: string[];
  industries: string[];
  interests: string[];
  goals: string[];
  challenges: string[];
  collabPreferences: string[];
};

export type AfnNormalizedTagInput = Partial<{
  skillSlugs: string[];
  industrySlugs: string[];
  interestSlugs: string[];
  goalSlugs: string[];
  challengeSlugs: string[];
  collabPreferenceSlugs: string[];
}>;

function emptyTagSlugs(): AfnNormalizedTagSlugs {
  return { skills: [], industries: [], interests: [], goals: [], challenges: [], collabPreferences: [] };
}

/** Replace junction rows for dimensions present in `input`. Omitted dimensions are left unchanged (backward compatible). */
export async function syncAfnProfileNormalizedTags(profileId: number, input: AfnNormalizedTagInput): Promise<void> {
  const norm = (slugs: string[] | undefined) =>
    (slugs ?? []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);

  await db.transaction(async (tx) => {
    if (input.skillSlugs !== undefined) {
      await tx.delete(afnProfileSkillTags).where(eq(afnProfileSkillTags.profileId, profileId));
      const slugs = norm(input.skillSlugs);
      if (slugs.length) {
        const rows = await tx.select({ id: afnSkillTags.id }).from(afnSkillTags).where(inArray(afnSkillTags.slug, slugs));
        if (rows.length)
          await tx.insert(afnProfileSkillTags).values(rows.map((r) => ({ profileId, skillTagId: r.id })));
      }
    }
    if (input.industrySlugs !== undefined) {
      await tx.delete(afnProfileIndustryTags).where(eq(afnProfileIndustryTags.profileId, profileId));
      const slugs = norm(input.industrySlugs);
      if (slugs.length) {
        const rows = await tx.select({ id: afnIndustryTags.id }).from(afnIndustryTags).where(inArray(afnIndustryTags.slug, slugs));
        if (rows.length)
          await tx
            .insert(afnProfileIndustryTags)
            .values(rows.map((r) => ({ profileId, industryTagId: r.id })));
      }
    }
    if (input.interestSlugs !== undefined) {
      await tx.delete(afnProfileInterestTags).where(eq(afnProfileInterestTags.profileId, profileId));
      const slugs = norm(input.interestSlugs);
      if (slugs.length) {
        const rows = await tx.select({ id: afnInterestTags.id }).from(afnInterestTags).where(inArray(afnInterestTags.slug, slugs));
        if (rows.length)
          await tx
            .insert(afnProfileInterestTags)
            .values(rows.map((r) => ({ profileId, interestTagId: r.id })));
      }
    }
    if (input.goalSlugs !== undefined) {
      await tx.delete(afnProfileGoalTags).where(eq(afnProfileGoalTags.profileId, profileId));
      const slugs = norm(input.goalSlugs);
      if (slugs.length) {
        const rows = await tx.select({ id: afnGoalTags.id }).from(afnGoalTags).where(inArray(afnGoalTags.slug, slugs));
        if (rows.length)
          await tx.insert(afnProfileGoalTags).values(rows.map((r) => ({ profileId, goalTagId: r.id })));
      }
    }
    if (input.challengeSlugs !== undefined) {
      await tx.delete(afnProfileChallengeTags).where(eq(afnProfileChallengeTags.profileId, profileId));
      const slugs = norm(input.challengeSlugs);
      if (slugs.length) {
        const rows = await tx
          .select({ id: afnChallengeTags.id })
          .from(afnChallengeTags)
          .where(inArray(afnChallengeTags.slug, slugs));
        if (rows.length)
          await tx
            .insert(afnProfileChallengeTags)
            .values(rows.map((r) => ({ profileId, challengeTagId: r.id })));
      }
    }
    if (input.collabPreferenceSlugs !== undefined) {
      await tx.delete(afnProfileCollabPreferenceTags).where(eq(afnProfileCollabPreferenceTags.profileId, profileId));
      const slugs = norm(input.collabPreferenceSlugs);
      if (slugs.length) {
        const rows = await tx
          .select({ id: afnCollabPreferenceTags.id })
          .from(afnCollabPreferenceTags)
          .where(inArray(afnCollabPreferenceTags.slug, slugs));
        if (rows.length)
          await tx.insert(afnProfileCollabPreferenceTags).values(
            rows.map((r) => ({ profileId, collabPreferenceTagId: r.id }))
          );
      }
    }
  });
}

export async function getAfnProfileNormalizedTags(profileId: number): Promise<AfnNormalizedTagSlugs> {
  const out = emptyTagSlugs();
  const [skills, industries, interests, goals, challenges, collabPrefs] = await Promise.all([
    db
      .select({ slug: afnSkillTags.slug })
      .from(afnProfileSkillTags)
      .innerJoin(afnSkillTags, eq(afnSkillTags.id, afnProfileSkillTags.skillTagId))
      .where(eq(afnProfileSkillTags.profileId, profileId)),
    db
      .select({ slug: afnIndustryTags.slug })
      .from(afnProfileIndustryTags)
      .innerJoin(afnIndustryTags, eq(afnIndustryTags.id, afnProfileIndustryTags.industryTagId))
      .where(eq(afnProfileIndustryTags.profileId, profileId)),
    db
      .select({ slug: afnInterestTags.slug })
      .from(afnProfileInterestTags)
      .innerJoin(afnInterestTags, eq(afnInterestTags.id, afnProfileInterestTags.interestTagId))
      .where(eq(afnProfileInterestTags.profileId, profileId)),
    db
      .select({ slug: afnGoalTags.slug })
      .from(afnProfileGoalTags)
      .innerJoin(afnGoalTags, eq(afnGoalTags.id, afnProfileGoalTags.goalTagId))
      .where(eq(afnProfileGoalTags.profileId, profileId)),
    db
      .select({ slug: afnChallengeTags.slug })
      .from(afnProfileChallengeTags)
      .innerJoin(afnChallengeTags, eq(afnChallengeTags.id, afnProfileChallengeTags.challengeTagId))
      .where(eq(afnProfileChallengeTags.profileId, profileId)),
    db
      .select({ slug: afnCollabPreferenceTags.slug })
      .from(afnProfileCollabPreferenceTags)
      .innerJoin(
        afnCollabPreferenceTags,
        eq(afnCollabPreferenceTags.id, afnProfileCollabPreferenceTags.collabPreferenceTagId)
      )
      .where(eq(afnProfileCollabPreferenceTags.profileId, profileId)),
  ]);
  out.skills = skills.map((r) => r.slug);
  out.industries = industries.map((r) => r.slug);
  out.interests = interests.map((r) => r.slug);
  out.goals = goals.map((r) => r.slug);
  out.challenges = challenges.map((r) => r.slug);
  out.collabPreferences = collabPrefs.map((r) => r.slug);
  return out;
}

/** Batch tag slugs for connection scoring (Phase 3). */
export async function getAfnNormalizedTagSlugsByProfileIds(
  profileIds: number[]
): Promise<Map<number, AfnNormalizedTagSlugs>> {
  const map = new Map<number, AfnNormalizedTagSlugs>();
  for (const id of profileIds) map.set(id, emptyTagSlugs());
  if (profileIds.length === 0) return map;

  const merge = (pid: number, key: keyof AfnNormalizedTagSlugs, slug: string) => {
    map.get(pid)![key].push(slug);
  };

  const skillRows = await db
    .select({ profileId: afnProfileSkillTags.profileId, slug: afnSkillTags.slug })
    .from(afnProfileSkillTags)
    .innerJoin(afnSkillTags, eq(afnSkillTags.id, afnProfileSkillTags.skillTagId))
    .where(inArray(afnProfileSkillTags.profileId, profileIds));
  for (const r of skillRows) merge(r.profileId, "skills", r.slug);

  const indRows = await db
    .select({ profileId: afnProfileIndustryTags.profileId, slug: afnIndustryTags.slug })
    .from(afnProfileIndustryTags)
    .innerJoin(afnIndustryTags, eq(afnIndustryTags.id, afnProfileIndustryTags.industryTagId))
    .where(inArray(afnProfileIndustryTags.profileId, profileIds));
  for (const r of indRows) merge(r.profileId, "industries", r.slug);

  const intRows = await db
    .select({ profileId: afnProfileInterestTags.profileId, slug: afnInterestTags.slug })
    .from(afnProfileInterestTags)
    .innerJoin(afnInterestTags, eq(afnInterestTags.id, afnProfileInterestTags.interestTagId))
    .where(inArray(afnProfileInterestTags.profileId, profileIds));
  for (const r of intRows) merge(r.profileId, "interests", r.slug);

  const goalRows = await db
    .select({ profileId: afnProfileGoalTags.profileId, slug: afnGoalTags.slug })
    .from(afnProfileGoalTags)
    .innerJoin(afnGoalTags, eq(afnGoalTags.id, afnProfileGoalTags.goalTagId))
    .where(inArray(afnProfileGoalTags.profileId, profileIds));
  for (const r of goalRows) merge(r.profileId, "goals", r.slug);

  const chRows = await db
    .select({ profileId: afnProfileChallengeTags.profileId, slug: afnChallengeTags.slug })
    .from(afnProfileChallengeTags)
    .innerJoin(afnChallengeTags, eq(afnChallengeTags.id, afnProfileChallengeTags.challengeTagId))
    .where(inArray(afnProfileChallengeTags.profileId, profileIds));
  for (const r of chRows) merge(r.profileId, "challenges", r.slug);

  const cpRows = await db
    .select({ profileId: afnProfileCollabPreferenceTags.profileId, slug: afnCollabPreferenceTags.slug })
    .from(afnProfileCollabPreferenceTags)
    .innerJoin(
      afnCollabPreferenceTags,
      eq(afnCollabPreferenceTags.id, afnProfileCollabPreferenceTags.collabPreferenceTagId)
    )
    .where(inArray(afnProfileCollabPreferenceTags.profileId, profileIds));
  for (const r of cpRows) merge(r.profileId, "collabPreferences", r.slug);

  return map;
}

export async function listAfnTagVocabulary() {
  const [skills, industries, interests, goals, challenges, collabPreferences] = await Promise.all([
    db.select().from(afnSkillTags).orderBy(afnSkillTags.label),
    db.select().from(afnIndustryTags).orderBy(afnIndustryTags.label),
    db.select().from(afnInterestTags).orderBy(afnInterestTags.label),
    db.select().from(afnGoalTags).orderBy(afnGoalTags.label),
    db.select().from(afnChallengeTags).orderBy(afnChallengeTags.label),
    db.select().from(afnCollabPreferenceTags).orderBy(afnCollabPreferenceTags.label),
  ]);
  return { skills, industries, interests, goals, challenges, collabPreferences };
}

// —— Profile intelligence (Phase 2) ——

export async function getAfnProfileIntelligenceByUserId(userId: number): Promise<AfnProfileIntelligenceRow | null> {
  const [row] = await db
    .select()
    .from(afnProfileIntelligence)
    .where(eq(afnProfileIntelligence.userId, userId))
    .limit(1);
  return row ?? null;
}

// —— Invites (Phase 7) ——

export async function createAfnInviteRow(row: InsertAfnInvite) {
  const [inserted] = await db.insert(afnInvites).values(row).returning();
  return inserted!;
}

// —— Scoring config (Phase 12) ——

const DEFAULT_SCORING_WEIGHTS: Record<string, number> = {
  industryMatch: 1,
  tagOverlap: 1,
  textOverlap: 1,
  collaboration: 1,
};

export async function getAfnScoringConfigRow(): Promise<{ id: number; weightsJson: Record<string, number>; updatedAt: Date } | null> {
  const [row] = await db.select().from(afnScoringConfig).orderBy(afnScoringConfig.id).limit(1);
  return row ?? null;
}

export async function ensureAfnScoringConfig(): Promise<{ id: number; weightsJson: Record<string, number> }> {
  const existing = await getAfnScoringConfigRow();
  if (existing) return existing;
  const [inserted] = await db
    .insert(afnScoringConfig)
    .values({ weightsJson: DEFAULT_SCORING_WEIGHTS, updatedAt: new Date() })
    .returning();
  return inserted!;
}

export async function updateAfnScoringWeights(weightsJson: Record<string, number>) {
  const row = await ensureAfnScoringConfig();
  const now = new Date();
  await db
    .update(afnScoringConfig)
    .set({ weightsJson, updatedAt: now })
    .where(eq(afnScoringConfig.id, row.id));
}

/** Connection counts (undirected). */
export async function countAfnConnectionsForUser(userId: number): Promise<number> {
  const [a] = await db
    .select({ n: count() })
    .from(afnConnections)
    .where(eq(afnConnections.userId, userId));
  const [b] = await db
    .select({ n: count() })
    .from(afnConnections)
    .where(eq(afnConnections.connectedUserId, userId));
  return Number(a?.n ?? 0) + Number(b?.n ?? 0);
}

export async function countAfnDiscussionPostsByAuthor(userId: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(afnDiscussionPosts)
    .where(eq(afnDiscussionPosts.authorId, userId));
  return Number(row?.n ?? 0);
}

export async function countAfnCollabPostsByAuthor(userId: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(afnCollaborationPosts)
    .where(eq(afnCollaborationPosts.authorId, userId));
  return Number(row?.n ?? 0);
}

export async function countAfnMessagesBySender(userId: number): Promise<number> {
  const [row] = await db.select({ n: count() }).from(afnMessages).where(eq(afnMessages.senderId, userId));
  return Number(row?.n ?? 0);
}

/** Pending moderation reports referencing this member's profile, posts, comments, or collab posts. */
export async function countPendingModerationReportsAgainstUser(userId: number): Promise<number> {
  const profile = await getAfnProfileByUserId(userId);
  if (!profile) return 0;
  const postRows = await db
    .select({ id: afnDiscussionPosts.id })
    .from(afnDiscussionPosts)
    .where(eq(afnDiscussionPosts.authorId, userId));
  const commentRows = await db
    .select({ id: afnDiscussionComments.id })
    .from(afnDiscussionComments)
    .where(eq(afnDiscussionComments.authorId, userId));
  const collabRows = await db
    .select({ id: afnCollaborationPosts.id })
    .from(afnCollaborationPosts)
    .where(eq(afnCollaborationPosts.authorId, userId));
  const pending = eq(afnModerationReports.status, "pending");
  const parts = [
    and(pending, eq(afnModerationReports.targetType, "profile"), eq(afnModerationReports.targetId, profile.id)),
  ];
  const postIds = postRows.map((r) => r.id);
  if (postIds.length) {
    parts.push(and(pending, eq(afnModerationReports.targetType, "post"), inArray(afnModerationReports.targetId, postIds)));
  }
  const commentIds = commentRows.map((r) => r.id);
  if (commentIds.length) {
    parts.push(and(pending, eq(afnModerationReports.targetType, "comment"), inArray(afnModerationReports.targetId, commentIds)));
  }
  const collabIds = collabRows.map((r) => r.id);
  if (collabIds.length) {
    parts.push(
      and(pending, eq(afnModerationReports.targetType, "collab_post"), inArray(afnModerationReports.targetId, collabIds))
    );
  }
  const whereClause = parts.length === 1 ? parts[0]! : or(...parts);
  const [row] = await db.select({ n: count() }).from(afnModerationReports).where(whereClause);
  return Number(row?.n ?? 0);
}

// —— Timeline Live sessions / overrides (Phases 9–10) ——

export async function insertAfnLiveSession(row: typeof afnLiveSessions.$inferInsert) {
  const [inserted] = await db.insert(afnLiveSessions).values(row).returning();
  return inserted!;
}

export async function insertAfnLiveProviderLog(row: typeof afnLiveProviderLogs.$inferInsert) {
  await db.insert(afnLiveProviderLogs).values(row);
}

export async function getAfnLiveSessionById(id: number) {
  const [row] = await db.select().from(afnLiveSessions).where(eq(afnLiveSessions.id, id)).limit(1);
  return row ?? null;
}

export async function getActiveTimelineLiveOverride(userId: number) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(afnTimelineLiveOverrides)
    .where(
      and(
        eq(afnTimelineLiveOverrides.userId, userId),
        or(isNull(afnTimelineLiveOverrides.expiresAt), gt(afnTimelineLiveOverrides.expiresAt, now))
      )
    )
    .limit(1);
  return row ?? null;
}

export async function upsertTimelineLiveOverride(payload: {
  userId: number;
  accessLevel: string;
  reason: string | null;
  setByAdminUserId: number;
  expiresAt: Date | null;
}) {
  const now = new Date();
  await db
    .insert(afnTimelineLiveOverrides)
    .values({
      userId: payload.userId,
      accessLevel: payload.accessLevel,
      reason: payload.reason,
      setByAdminUserId: payload.setByAdminUserId,
      expiresAt: payload.expiresAt,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: afnTimelineLiveOverrides.userId,
      set: {
        accessLevel: payload.accessLevel,
        reason: payload.reason,
        setByAdminUserId: payload.setByAdminUserId,
        expiresAt: payload.expiresAt,
        createdAt: now,
      },
    });
}

export async function deleteTimelineLiveOverride(userId: number) {
  await db.delete(afnTimelineLiveOverrides).where(eq(afnTimelineLiveOverrides.userId, userId));
}

export async function hasActiveTimelineLiveOverride(userId: number): Promise<boolean> {
  const row = await getActiveTimelineLiveOverride(userId);
  return !!row;
}
