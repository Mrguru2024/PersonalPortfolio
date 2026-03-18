import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { upsertAfnProfile, upsertAfnProfileSettings } from "@server/afnStorage";
import { createAfnLeadSignal } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** POST /api/community/onboarding — submit onboarding and create/update profile + settings. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const body = await req.json().catch(() => ({}));

    const profile = await upsertAfnProfile({
      userId,
      fullName: body.fullName ?? user.full_name ?? user.username,
      displayName: body.displayName ?? body.fullName ?? user.username,
      username: body.username ?? user.username,
      businessStage: body.businessStage ?? undefined,
      industry: body.industry ?? undefined,
      whatBuilding: body.whatBuilding ?? undefined,
      biggestChallenge: body.biggestChallenge ?? undefined,
      goals: body.goals ?? undefined,
      collaborationInterests: body.collaborationInterests ?? undefined,
      isOnboardingComplete: true,
      profileCompletionScore: body.profileCompletionScore ?? 70,
    });

    await upsertAfnProfileSettings({
      userId,
      profileVisibility: body.profileVisibility ?? "public",
      messagePermission: body.messagePermission ?? "none",
      openToCollaborate: body.openToCollaborate ?? false,
      showActivity: body.showActivity ?? true,
      showContactLinks: body.showContactLinks ?? true,
      emailNotificationsEnabled: body.emailNotificationsEnabled ?? true,
      inAppNotificationsEnabled: body.inAppNotificationsEnabled ?? true,
    });

    // Lead signals from onboarding
    const signals: { signalType: string; signalValue: string; source: string }[] = [];
    if (body.businessStage) {
      signals.push({ signalType: "BUSINESS_STAGE_SIGNAL", signalValue: body.businessStage, source: "onboarding" });
    }
    if (body.biggestChallenge) {
      signals.push({ signalType: "BIGGEST_CHALLENGE", signalValue: body.biggestChallenge, source: "onboarding" });
    }
    if (body.openToCollaborate) {
      signals.push({ signalType: "OPEN_TO_COLLAB", signalValue: "true", source: "onboarding" });
    }
    if (body.goals) {
      signals.push({ signalType: "SERVICE_INTENT", signalValue: String(body.goals).slice(0, 500), source: "onboarding" });
    }
    for (const s of signals) {
      await createAfnLeadSignal({ userId, ...s });
    }

    return NextResponse.json({ profile, ok: true });
  } catch (e) {
    console.error("POST community onboarding error:", e);
    return NextResponse.json({ error: "Failed to save onboarding" }, { status: 500 });
  }
}
