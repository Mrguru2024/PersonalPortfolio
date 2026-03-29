import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { upsertAfnProfile, upsertAfnProfileSettings, createAfnLeadSignal, syncAfnProfileNormalizedTags } from "@server/afnStorage";
import { isFounderType } from "@/lib/community/constants";
import {
  isCommunicationStyle,
  isMentorshipInterest,
} from "@/lib/community/constants";
import { fireAndForgetAfnIntelligence } from "@server/services/afnIntelligenceService";
import { fireAndForgetAfnNudges } from "@server/services/afnNudgeService";

export const dynamic = "force-dynamic";

function tagPayload(body: Record<string, unknown>) {
  const asArr = (key: string): string[] | undefined => {
    if (!(key in body) || !Array.isArray(body[key])) return undefined;
    return (body[key] as unknown[]).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  };
  const out: Parameters<typeof syncAfnProfileNormalizedTags>[1] = {};
  const s = asArr("skillSlugs");
  const i = asArr("industrySlugs");
  const n = asArr("interestSlugs");
  const g = asArr("goalSlugs");
  const c = asArr("challengeSlugs");
  const cp = asArr("collabPreferenceSlugs");
  if (s) out.skillSlugs = s;
  if (i) out.industrySlugs = i;
  if (n) out.interestSlugs = n;
  if (g) out.goalSlugs = g;
  if (c) out.challengeSlugs = c;
  if (cp) out.collabPreferenceSlugs = cp;
  return out;
}

/** POST /api/community/onboarding — submit onboarding and create/update profile + settings. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const body = await req.json().catch(() => ({}));

    const founderTribe =
      typeof body.founderType === "string" && isFounderType(body.founderType) ? body.founderType : undefined;

    let communicationStyle: string | undefined = undefined;
    if (typeof body.communicationStyle === "string") {
      if (!isCommunicationStyle(body.communicationStyle)) {
        return NextResponse.json({ error: "Invalid communicationStyle" }, { status: 400 });
      }
      communicationStyle = body.communicationStyle;
    }

    let mentorshipInterest: string | undefined = undefined;
    if (typeof body.mentorshipInterest === "string") {
      if (!isMentorshipInterest(body.mentorshipInterest)) {
        return NextResponse.json({ error: "Invalid mentorshipInterest" }, { status: 400 });
      }
      mentorshipInterest = body.mentorshipInterest;
    }

    const lookingFor = typeof body.lookingFor === "string" ? body.lookingFor.slice(0, 4000) : undefined;
    const whatYouOffer = typeof body.whatYouOffer === "string" ? body.whatYouOffer.slice(0, 4000) : undefined;

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
      lookingFor: lookingFor ?? undefined,
      askMeAbout: whatYouOffer ?? undefined,
      collaborationInterests: body.collaborationInterests ?? undefined,
      founderTribe,
      communicationStyle,
      mentorshipInterest,
      isOnboardingComplete: true,
      profileCompletionScore: body.profileCompletionScore != null ? Number(body.profileCompletionScore) : 70,
      engagementStage: "new",
      communityMaturityLevel: "observer",
    });

    const tagPatch = tagPayload(body as Record<string, unknown>);
    if (Object.keys(tagPatch).length > 0) {
      await syncAfnProfileNormalizedTags(profile.id, tagPatch);
    }

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
    if (founderTribe) {
      signals.push({ signalType: "FOUNDER_TRIBE", signalValue: founderTribe, source: "onboarding" });
    }
    if (tagPatch.skillSlugs?.length) {
      signals.push({
        signalType: "SKILL_TAGS",
        signalValue: tagPatch.skillSlugs.join(",").slice(0, 500),
        source: "onboarding",
      });
    }

    for (const s of signals) {
      await createAfnLeadSignal({ userId, ...s });
    }

    fireAndForgetAfnIntelligence(userId);
    fireAndForgetAfnNudges(userId);

    return NextResponse.json({ profile, ok: true });
  } catch (e) {
    console.error("POST community onboarding error:", e);
    return NextResponse.json({ error: "Failed to save onboarding" }, { status: 500 });
  }
}
