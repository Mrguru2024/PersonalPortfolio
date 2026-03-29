/**
 * Timeline Live access tiers (Phase 10): compute from intelligence + moderation; admin overrides in storage.
 */
import type { AfnProfile, AfnProfileIntelligenceRow } from "@shared/schema";
import {
  getAfnProfileByUserId,
  getActiveTimelineLiveOverride,
  hasActiveTimelineLiveOverride,
  countPendingModerationReportsAgainstUser,
  getAfnProfileIntelligenceByUserId,
} from "@server/afnStorage";
import { db } from "@server/db";
import { afnProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  isTimelineLiveAccessLevel,
  type TimelineLiveAccessLevel,
  TIMELINE_LIVE_ACCESS_LEVELS,
} from "@/lib/community/constants";

export function timelineLiveRank(level: string): number {
  const i = TIMELINE_LIVE_ACCESS_LEVELS.indexOf(level as TimelineLiveAccessLevel);
  return i >= 0 ? i : 0;
}

export function canHostTimelineLiveAccess(level: string): boolean {
  return timelineLiveRank(level) >= timelineLiveRank("active");
}

/**
 * Automatic tier only — `featured` is reserved for admin override.
 * - viewer: baseline
 * - active: onboarded + reasonable activation or contribution
 * - trusted: higher trust/contribution + clean moderation tail
 */
export function computeTimelineLiveAccessLevel(
  profile: AfnProfile,
  intelligence: AfnProfileIntelligenceRow | null,
  pendingReportsAgainstUser: number
): TimelineLiveAccessLevel {
  const activation = intelligence?.activationScore ?? 0;
  const trust = intelligence?.trustScore ?? 0;
  const contribution = intelligence?.contributionScore ?? 0;
  const onboarded = !!profile.isOnboardingComplete;

  if (!onboarded || pendingReportsAgainstUser >= 3) {
    return "viewer";
  }

  let level: TimelineLiveAccessLevel = "viewer";

  if (activation >= 35 || contribution >= 22) {
    level = "active";
  }

  if (
    trust >= 52 &&
    contribution >= 18 &&
    pendingReportsAgainstUser === 0 &&
    activation >= 42 &&
    (contribution >= 28 || trust >= 62)
  ) {
    level = "trusted";
  }

  return level;
}

export async function getEffectiveTimelineLiveAccess(userId: number): Promise<{
  level: TimelineLiveAccessLevel;
  source: "override" | "profile";
  overrideExpiresAt: string | null;
  storedProfileLevel: TimelineLiveAccessLevel;
}> {
  const override = await getActiveTimelineLiveOverride(userId);
  const profile = await getAfnProfileByUserId(userId);
  const storedRaw = profile?.timelineLiveAccessLevel ?? "viewer";
  const storedProfileLevel = isTimelineLiveAccessLevel(storedRaw) ? storedRaw : "viewer";
  if (override) {
    const ol = override.accessLevel;
    const level = isTimelineLiveAccessLevel(ol) ? ol : storedProfileLevel;
    return {
      level,
      source: "override",
      overrideExpiresAt: override.expiresAt ? override.expiresAt.toISOString() : null,
      storedProfileLevel,
    };
  }
  return {
    level: storedProfileLevel,
    source: "profile",
    overrideExpiresAt: null,
    storedProfileLevel,
  };
}

/** Persists computed tier on `afn_profiles` when no active admin override. */
export async function applyComputedTimelineLiveAccess(userId: number): Promise<void> {
  if (await hasActiveTimelineLiveOverride(userId)) return;
  const profile = await getAfnProfileByUserId(userId);
  if (!profile) return;
  const intelligence = await getAfnProfileIntelligenceByUserId(userId);
  const pending = await countPendingModerationReportsAgainstUser(userId);
  const level = computeTimelineLiveAccessLevel(profile, intelligence, pending);
  await db
    .update(afnProfiles)
    .set({ timelineLiveAccessLevel: level, updatedAt: new Date() })
    .where(eq(afnProfiles.userId, userId));
}
