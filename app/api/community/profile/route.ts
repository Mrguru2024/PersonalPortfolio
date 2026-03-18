import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnProfileByUserId,
  upsertAfnProfile,
} from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/profile — get current user's AFN profile. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const profile = await getAfnProfileByUserId(userId);
    if (!profile) {
      return NextResponse.json({ profile: null });
    }
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("GET community profile error:", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/** PATCH /api/community/profile — update current user's AFN profile. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const body = await req.json().catch(() => ({}));
    const profile = await upsertAfnProfile({
      userId,
      fullName: body.fullName ?? undefined,
      displayName: body.displayName ?? undefined,
      username: body.username ?? user.username,
      avatarUrl: body.avatarUrl ?? undefined,
      headline: body.headline ?? undefined,
      bio: body.bio ?? undefined,
      businessName: body.businessName ?? undefined,
      businessStage: body.businessStage ?? undefined,
      industry: body.industry ?? undefined,
      location: body.location ?? undefined,
      websiteUrl: body.websiteUrl ?? undefined,
      linkedinUrl: body.linkedinUrl ?? undefined,
      otherSocialUrl: body.otherSocialUrl ?? undefined,
      whatBuilding: body.whatBuilding ?? undefined,
      biggestChallenge: body.biggestChallenge ?? undefined,
      goals: body.goals ?? undefined,
      lookingFor: body.lookingFor ?? undefined,
      collaborationInterests: body.collaborationInterests ?? undefined,
      askMeAbout: body.askMeAbout ?? undefined,
      featuredResourceUrl: body.featuredResourceUrl ?? undefined,
      profileCompletionScore: body.profileCompletionScore ?? undefined,
      isOnboardingComplete: body.isOnboardingComplete ?? undefined,
    });
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("PATCH community profile error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
