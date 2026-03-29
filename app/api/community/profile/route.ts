import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnProfileByUserId,
  upsertAfnProfile,
  syncAfnProfileNormalizedTags,
  type AfnNormalizedTagInput,
  getAfnProfileNormalizedTags,
  getAfnProfileIntelligenceByUserId,
} from "@server/afnStorage";
import { mergePublicProfileStyle } from "@/lib/community/publicProfileStyle";
import type { PublicProfileStyle } from "@shared/publicProfileStyle";
import { isFounderType, isPublicProfileTheme } from "@/lib/community/constants";
import {
  isCommunicationStyle,
  isContentPreference,
  isEngagementStage,
  isCommunityMaturityLevel,
  isMentorshipInterest,
  isTimelineLiveAccessLevel,
} from "@/lib/community/constants";
import { fireAndForgetAfnIntelligence } from "@server/services/afnIntelligenceService";
import { fireAndForgetAfnNudges } from "@server/services/afnNudgeService";

export const dynamic = "force-dynamic";

function tagPayloadFromBody(body: Record<string, unknown>): AfnNormalizedTagInput {
  const asSlugArray = (key: string): string[] | undefined => {
    if (!(key in body)) return undefined;
    const v = body[key];
    if (!Array.isArray(v)) return undefined;
    return v.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  };
  const out: AfnNormalizedTagInput = {};
  const s = asSlugArray("skillSlugs");
  const i = asSlugArray("industrySlugs");
  const n = asSlugArray("interestSlugs");
  const g = asSlugArray("goalSlugs");
  const c = asSlugArray("challengeSlugs");
  const cp = asSlugArray("collabPreferenceSlugs");
  if (s) out.skillSlugs = s;
  if (i) out.industrySlugs = i;
  if (n) out.interestSlugs = n;
  if (g) out.goalSlugs = g;
  if (c) out.challengeSlugs = c;
  if (cp) out.collabPreferenceSlugs = cp;
  return out;
}

/** GET /api/community/profile — profile + normalized tags + intelligence (backward compatible keys). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const profile = await getAfnProfileByUserId(userId);
    if (!profile) {
      return NextResponse.json({ profile: null, tags: null, intelligence: null });
    }
    const [tags, intelligence] = await Promise.all([
      getAfnProfileNormalizedTags(profile.id),
      getAfnProfileIntelligenceByUserId(userId),
    ]);
    return NextResponse.json({ profile, tags, intelligence });
  } catch (e) {
    console.error("GET community profile error:", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/** PATCH /api/community/profile — partial updates; only keys present in JSON are applied to tags junctions. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const body = await req.json().catch(() => ({}));
    const existingRow = await getAfnProfileByUserId(userId);

    let founderTribe: string | null | undefined = undefined;
    if ("founderTribe" in body) {
      const v = body.founderTribe;
      if (v === null || v === "") founderTribe = null;
      else if (typeof v === "string" && isFounderType(v)) founderTribe = v;
      else if (typeof v === "string") {
        return NextResponse.json({ error: "Invalid founder tribe" }, { status: 400 });
      }
    }

    let publicProfileTheme: string | undefined = undefined;
    if ("publicProfileTheme" in body && typeof body.publicProfileTheme === "string") {
      if (!isPublicProfileTheme(body.publicProfileTheme)) {
        return NextResponse.json({ error: "Invalid public profile theme" }, { status: 400 });
      }
      publicProfileTheme = body.publicProfileTheme;
    }

    const str = (k: string, max = 5000) =>
      body[k] === null ? null : typeof body[k] === "string" ? String(body[k]).slice(0, max) : undefined;

    const optStr = (k: string, max = 500) => (k in body ? str(k, max) : undefined);

    let communicationStyle: string | null | undefined = undefined;
    let contentPreference: string | null | undefined = undefined;
    let engagementStage: string | null | undefined = undefined;
    let communityMaturityLevel: string | null | undefined = undefined;
    let mentorshipInterest: string | null | undefined = undefined;
    let timelineLiveAccessLevel: string | undefined = undefined;

    if ("communicationStyle" in body) {
      const v = body.communicationStyle;
      if (v === null || v === "") communicationStyle = null;
      else if (typeof v === "string") {
        if (!isCommunicationStyle(v)) return NextResponse.json({ error: "Invalid communicationStyle" }, { status: 400 });
        communicationStyle = v;
      }
    }
    if ("contentPreference" in body) {
      const v = body.contentPreference;
      if (v === null || v === "") contentPreference = null;
      else if (typeof v === "string") {
        if (!isContentPreference(v)) return NextResponse.json({ error: "Invalid contentPreference" }, { status: 400 });
        contentPreference = v;
      }
    }
    if ("engagementStage" in body) {
      const v = body.engagementStage;
      if (v === null || v === "") engagementStage = null;
      else if (typeof v === "string") {
        if (!isEngagementStage(v)) return NextResponse.json({ error: "Invalid engagementStage" }, { status: 400 });
        engagementStage = v;
      }
    }
    if ("communityMaturityLevel" in body) {
      const v = body.communityMaturityLevel;
      if (v === null || v === "") communityMaturityLevel = null;
      else if (typeof v === "string") {
        if (!isCommunityMaturityLevel(v))
          return NextResponse.json({ error: "Invalid communityMaturityLevel" }, { status: 400 });
        communityMaturityLevel = v;
      }
    }
    if ("mentorshipInterest" in body) {
      const v = body.mentorshipInterest;
      if (v === null || v === "") mentorshipInterest = null;
      else if (typeof v === "string") {
        if (!isMentorshipInterest(v))
          return NextResponse.json({ error: "Invalid mentorshipInterest" }, { status: 400 });
        mentorshipInterest = v;
      }
    }
    if ("timelineLiveAccessLevel" in body && typeof body.timelineLiveAccessLevel === "string") {
      if (!isTimelineLiveAccessLevel(body.timelineLiveAccessLevel)) {
        return NextResponse.json({ error: "Invalid timelineLiveAccessLevel" }, { status: 400 });
      }
      timelineLiveAccessLevel = body.timelineLiveAccessLevel;
    }

    let availabilityJson: { windows?: string[]; notes?: string } | null | undefined = undefined;
    if ("availability" in body) {
      if (body.availability === null) availabilityJson = null;
      else if (typeof body.availability === "object" && body.availability) {
        const o = body.availability as Record<string, unknown>;
        availabilityJson = {
          windows: Array.isArray(o.windows) ? o.windows.map(String).slice(0, 20) : undefined,
          notes: typeof o.notes === "string" ? o.notes.slice(0, 2000) : undefined,
        };
      }
    }

    let eventPreferencesJson: string[] | null | undefined = undefined;
    if ("eventPreferences" in body) {
      if (body.eventPreferences === null) eventPreferencesJson = null;
      else if (Array.isArray(body.eventPreferences)) {
        eventPreferencesJson = (body.eventPreferences as unknown[])
          .map((x) => String(x).slice(0, 120))
          .slice(0, 24);
      }
    }

    let personalityTraitsJson: string[] | null | undefined = undefined;
    if ("personalityTraits" in body) {
      if (body.personalityTraits === null) personalityTraitsJson = null;
      else if (Array.isArray(body.personalityTraits)) {
        personalityTraitsJson = (body.personalityTraits as unknown[])
          .map((x) => String(x).slice(0, 80))
          .slice(0, 24);
      }
    }

    let publicProfileStyleJson: PublicProfileStyle | undefined = undefined;
    if ("publicProfileStyle" in body) {
      publicProfileStyleJson = mergePublicProfileStyle(
        existingRow?.publicProfileStyleJson ?? null,
        body.publicProfileStyle
      );
    }

    let inviteLikelihoodScore: number | null | undefined = undefined;
    if ("inviteLikelihoodScore" in body) {
      if (body.inviteLikelihoodScore === null) inviteLikelihoodScore = null;
      else {
        const n = Number(body.inviteLikelihoodScore);
        if (Number.isFinite(n)) inviteLikelihoodScore = Math.max(0, Math.min(100, Math.round(n)));
      }
    }

    const profile = await upsertAfnProfile({
      userId,
      fullName: body.fullName !== undefined ? optStr("fullName", 200) : undefined,
      displayName: body.displayName !== undefined ? optStr("displayName", 200) : undefined,
      username: body.username ?? user.username,
      avatarUrl: body.avatarUrl !== undefined ? optStr("avatarUrl", 2000) : undefined,
      headline: body.headline !== undefined ? optStr("headline", 500) : undefined,
      bio: body.bio !== undefined ? str("bio", 8000) : undefined,
      businessName: body.businessName !== undefined ? optStr("businessName", 200) : undefined,
      businessStage: body.businessStage !== undefined ? optStr("businessStage", 80) : undefined,
      industry: body.industry !== undefined ? optStr("industry", 120) : undefined,
      location: body.location !== undefined ? optStr("location", 200) : undefined,
      websiteUrl: body.websiteUrl !== undefined ? optStr("websiteUrl", 2000) : undefined,
      linkedinUrl: body.linkedinUrl !== undefined ? optStr("linkedinUrl", 2000) : undefined,
      otherSocialUrl: body.otherSocialUrl !== undefined ? optStr("otherSocialUrl", 2000) : undefined,
      whatBuilding: body.whatBuilding !== undefined ? str("whatBuilding", 4000) : undefined,
      biggestChallenge: body.biggestChallenge !== undefined ? str("biggestChallenge", 4000) : undefined,
      goals: body.goals !== undefined ? str("goals", 4000) : undefined,
      lookingFor: body.lookingFor !== undefined ? str("lookingFor", 4000) : undefined,
      collaborationInterests:
        body.collaborationInterests !== undefined ? str("collaborationInterests", 4000) : undefined,
      askMeAbout: body.askMeAbout !== undefined ? str("askMeAbout", 4000) : undefined,
      founderTribe,
      publicProfileTheme,
      publicProfileStyleJson,
      featuredResourceUrl: body.featuredResourceUrl !== undefined ? optStr("featuredResourceUrl", 2000) : undefined,
      profileCompletionScore:
        body.profileCompletionScore !== undefined && body.profileCompletionScore !== null
          ? Math.max(0, Math.min(100, Number(body.profileCompletionScore)))
          : undefined,
      isOnboardingComplete:
        typeof body.isOnboardingComplete === "boolean" ? body.isOnboardingComplete : undefined,
      primaryRole: body.primaryRole !== undefined ? optStr("primaryRole", 160) : undefined,
      secondaryRole: body.secondaryRole !== undefined ? optStr("secondaryRole", 160) : undefined,
      communicationStyle,
      contentPreference,
      timezone: body.timezone !== undefined ? optStr("timezone", 80) : undefined,
      availabilityJson,
      eventPreferencesJson,
      mentorshipInterest,
      projectInterest: body.projectInterest !== undefined ? optStr("projectInterest", 500) : undefined,
      tribePreference: body.tribePreference !== undefined ? optStr("tribePreference", 120) : undefined,
      personalityTraitsJson,
      engagementStage,
      communityMaturityLevel,
      timelineLiveAccessLevel,
      inviteLikelihoodScore,
    });

    const tagPatch = tagPayloadFromBody(body as Record<string, unknown>);
    if (Object.keys(tagPatch).length > 0) {
      await syncAfnProfileNormalizedTags(profile.id, tagPatch);
    }

    fireAndForgetAfnIntelligence(userId);
    fireAndForgetAfnNudges(userId);

    const tags = await getAfnProfileNormalizedTags(profile.id);
    const intelligence = await getAfnProfileIntelligenceByUserId(userId);
    return NextResponse.json({ profile, tags, intelligence });
  } catch (e) {
    console.error("PATCH community profile error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
