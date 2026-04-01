/**
 * Nudge engine (Phase 6) — writes in-app notifications; rules stay small to avoid spam.
 */
import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "@server/db";
import { afnNotifications } from "@shared/schema";
import {
  getAfnProfileByUserId,
  countAfnConnectionsForUser,
  getAfnProfileIntelligenceByUserId,
} from "@server/afnStorage";

const NUDGE_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3;

async function recentNudgeOfType(userId: number, typePrefix: string): Promise<boolean> {
  const since = new Date(Date.now() - NUDGE_COOLDOWN_MS);
  const recent = await db
    .select()
    .from(afnNotifications)
    .where(and(eq(afnNotifications.userId, userId), gte(afnNotifications.createdAt, since)))
    .orderBy(desc(afnNotifications.createdAt))
    .limit(40);
  return recent.some((n) => n.type.startsWith(typePrefix));
}

/** Idempotent-ish: skips if similar nudge landed recently. */
export async function maybeEmitAfnEngagementNudges(userId: number): Promise<void> {
  const profile = await getAfnProfileByUserId(userId);
  if (!profile?.isOnboardingComplete) return;

  const connections = await countAfnConnectionsForUser(userId);
  const intel = await getAfnProfileIntelligenceByUserId(userId);

  if (connections === 0 && !(await recentNudgeOfType(userId, "nudge_network"))) {
    await db.insert(afnNotifications).values({
      userId,
      type: "nudge_network",
      title: "Ready to connect?",
      body: "Your profile is live — see founders who match your goals on your AFN home.",
      entityType: "nudge",
    });
    return;
  }

  if (intel && intel.activationScore >= 60 && !(await recentNudgeOfType(userId, "nudge_invite"))) {
    await db.insert(afnNotifications).values({
      userId,
      type: "nudge_invite",
      title: "Invite someone you trust",
      body: "Strong engagement matters more than size — invite a peer who’d value this space.",
      entityType: "nudge",
    });
  }
}

export function fireAndForgetAfnNudges(userId: number) {
  maybeEmitAfnEngagementNudges(userId).catch(() => {});
}
