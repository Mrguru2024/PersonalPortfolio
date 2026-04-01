/**
 * AFN Profile Intelligence Engine (Phase 2).
 * Derives scores from profile shape, tags, and light behavioral counts.
 */
import { db } from "@server/db";
import { afnProfiles, afnProfileIntelligence } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import {
  countAfnCollabPostsByAuthor,
  countAfnConnectionsForUser,
  countAfnDiscussionPostsByAuthor,
  countAfnMessagesBySender,
  getAfnProfileNormalizedTags,
  getAfnProfileSettings,
} from "@server/afnStorage";
import { applyComputedTimelineLiveAccess, getEffectiveTimelineLiveAccess } from "@server/services/afnTimelineLiveAccessService";
import { syncAfnEngagementToCrmIfLinked } from "@server/services/afnFounderCrmBridge";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Rough profile completeness 0–100 from Phase 1 fields + legacy text fields. */
export function estimateProfileCompleteness(
  profile: typeof afnProfiles.$inferSelect,
  tagCount: number
): number {
  let pts = 0;
  const add = (cond: boolean, p: number) => {
    if (cond) pts += p;
  };
  add(!!profile.headline, 8);
  add(!!profile.bio, 8);
  add(!!profile.whatBuilding, 7);
  add(!!profile.goals, 6);
  add(!!profile.businessStage, 6);
  add(!!profile.industry, 5);
  add(!!profile.founderTribe, 5);
  add(!!profile.primaryRole, 5);
  add(!!profile.timezone, 3);
  add(!!profile.communicationStyle, 3);
  add(tagCount > 0, 10);
  add(tagCount >= 3, 5);
  add(!!profile.isOnboardingComplete, 15);
  add(!!profile.lookingFor, 4);
  add(!!profile.biggestChallenge, 4);
  add(!!profile.linkedinUrl || !!profile.websiteUrl, 4);
  return clamp(pts, 0, 100);
}

export async function recomputeAfnProfileIntelligence(userId: number): Promise<void> {
  const [profile] = await db.select().from(afnProfiles).where(eq(afnProfiles.userId, userId)).limit(1);
  if (!profile) return;

  const settings = await getAfnProfileSettings(userId);
  const openBonus = settings?.openToCollaborate ? 10 : 0;

  const tags = await getAfnProfileNormalizedTags(profile.id);
  const tagCount =
    tags.skills.length +
    tags.industries.length +
    tags.interests.length +
    tags.goals.length +
    tags.challenges.length +
    tags.collabPreferences.length;

  const completion = estimateProfileCompleteness(profile, tagCount);
  const connections = await countAfnConnectionsForUser(userId);
  const posts = await countAfnDiscussionPostsByAuthor(userId);
  const collabs = await countAfnCollabPostsByAuthor(userId);
  const messages = await countAfnMessagesBySender(userId);

  const networkingScore = clamp(15 + connections * 12 + Math.min(30, posts * 4), 0, 100);
  const collaborationScore = clamp(10 + collabs * 15 + connections * 5 + openBonus, 0, 100);
  const tribeAffinityScore = clamp(
    (profile.founderTribe ? 35 : 10) + (tags.interests.length + tags.goals.length) * 6,
    0,
    100
  );
  const eventLikelihoodScore = clamp(
    (profile.eventPreferencesJson?.length ?? 0) * 12 + (profile.timezone ? 20 : 5),
    0,
    100
  );
  const mentorshipScore = clamp(
    profile.mentorshipInterest && profile.mentorshipInterest !== "none" ? 55 : 15,
    0,
    100
  );
  const projectScore = clamp((profile.projectInterest ? 40 : 15) + collabs * 10, 0, 100);
  const contributionScore = clamp(posts * 8 + Math.min(40, messages * 2), 0, 100);
  const trustScore = clamp(completion * 0.4 + connections * 10 + (posts > 0 ? 15 : 0), 0, 100);
  const consistencyScore = clamp(completion * 0.35 + Math.min(50, posts * 5 + messages * 2), 0, 100);
  const inviteScore = clamp(networkingScore * 0.35 + contributionScore * 0.35 + completion * 0.3, 0, 100);
  const churnRiskScore = clamp(
    100 -
      (profile.isOnboardingComplete ? 25 : 0) -
      completion * 0.4 -
      Math.min(30, connections * 5) -
      Math.min(20, posts * 4),
    0,
    100
  );
  const activationScore = clamp(
    (profile.isOnboardingComplete ? 40 : 10) + completion * 0.35 + Math.min(25, connections * 8),
    0,
    100
  );

  await db
    .insert(afnProfileIntelligence)
    .values({
      userId,
      collaborationScore,
      tribeAffinityScore,
      networkingScore,
      eventLikelihoodScore,
      mentorshipScore,
      projectScore,
      contributionScore,
      trustScore,
      consistencyScore,
      inviteScore,
      churnRiskScore,
      activationScore,
      computedAt: new Date(),
      version: 1,
    })
    .onConflictDoUpdate({
      target: afnProfileIntelligence.userId,
      set: {
        collaborationScore,
        tribeAffinityScore,
        networkingScore,
        eventLikelihoodScore,
        mentorshipScore,
        projectScore,
        contributionScore,
        trustScore,
        consistencyScore,
        inviteScore,
        churnRiskScore,
        activationScore,
        computedAt: new Date(),
        version: sql`${afnProfileIntelligence.version} + 1`,
      },
    });

  await db
    .update(afnProfiles)
    .set({
      inviteLikelihoodScore: Math.round(inviteScore),
      updatedAt: new Date(),
    })
    .where(eq(afnProfiles.userId, userId));

  try {
    await applyComputedTimelineLiveAccess(userId);
  } catch (e) {
    console.warn("applyComputedTimelineLiveAccess failed", e);
  }
  try {
    const live = await getEffectiveTimelineLiveAccess(userId);
    await syncAfnEngagementToCrmIfLinked({
      userId,
      onboardingComplete: profile.isOnboardingComplete,
      profileCompletionApprox: completion,
      activationScore,
      inviteLikelihood: Math.round(inviteScore),
      trustScore,
      contributionScore,
      engagementStage: profile.engagementStage,
      communityMaturityLevel: profile.communityMaturityLevel,
      timelineLiveEffective: live.level,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("syncAfnEngagementToCrmIfLinked failed", e);
  }
}

export function fireAndForgetAfnIntelligence(userId: number) {
  recomputeAfnProfileIntelligence(userId).catch(() => {});
}
