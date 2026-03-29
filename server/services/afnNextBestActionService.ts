/**
 * Next Best Action engine (Phase 4) — single primary CTA per session context.
 */
import {
  getAfnProfileByUserId,
  getAfnProfileNormalizedTags,
  countAfnConnectionsForUser,
} from "@server/afnStorage";
import { estimateProfileCompleteness } from "./afnIntelligenceService";

export type AfnNextBestAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: number;
};

export async function getAfnNextBestAction(userId: number): Promise<AfnNextBestAction> {
  const profile = await getAfnProfileByUserId(userId);
  if (!profile) {
    return {
      id: "join",
      title: "Set up your founder profile",
      description: "Join the network with a short onboarding flow.",
      href: "/community/onboarding",
      priority: 100,
    };
  }
  if (!profile.isOnboardingComplete) {
    return {
      id: "onboarding",
      title: "Finish onboarding",
      description: "A few steps so we can match you with the right people.",
      href: "/community/onboarding",
      priority: 95,
    };
  }

  const tags = await getAfnProfileNormalizedTags(profile.id);
  const tagCount =
    tags.skills.length +
    tags.industries.length +
    tags.interests.length +
    tags.goals.length +
    tags.challenges.length +
    tags.collabPreferences.length;
  const completion = estimateProfileCompleteness(profile, tagCount);

  if (completion < 55 || tagCount === 0) {
    return {
      id: "profile_depth",
      title: "Deepen your profile",
      description: "Add skills, goals, and interests so suggestions stay relevant.",
      href: "/community/profile",
      priority: 85,
    };
  }

  const connections = await countAfnConnectionsForUser(userId);
  if (connections === 0) {
    return {
      id: "network",
      title: "Meet your first connections",
      description: "Browse suggested founders aligned with your stage and focus.",
      href: "/community/home",
      priority: 80,
    };
  }

  return {
    id: "discuss",
    title: "Join a discussion",
    description: "Share a win, ask for help, or learn from peers in structured threads.",
    href: "/community/feed",
    priority: 50,
  };
}
