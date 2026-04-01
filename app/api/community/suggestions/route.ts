import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnProfileByUserId,
  getAfnCandidateProfilesForSuggestions,
  getAfnProfileSettings,
  getAfnProfileNormalizedTags,
  getAfnNormalizedTagSlugsByProfileIds,
} from "@server/afnStorage";
import {
  recommendConnections,
  profileToScoringShape,
  type ConnectionSuggestion,
} from "@/lib/community/connectionAlgorithm";

export const dynamic = "force-dynamic";

/** GET /api/community/suggestions — friend/connection suggestions based on profile, business needs, topics, and focus. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Sign in to see suggestions" }, { status: 401 });
    }

    const currentUserId = Number(user.id);
    const myProfile = await getAfnProfileByUserId(currentUserId);
    if (!myProfile || !myProfile.isOnboardingComplete) {
      return NextResponse.json({
        suggestions: [],
        message: "Complete your community profile to get personalized connection suggestions.",
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10) || 12, 30);

    const candidates = await getAfnCandidateProfilesForSuggestions({
      currentUserId,
      limit: limit * 2,
      excludeConnected: true,
      excludeAlreadyMessaged: true,
    });

    if (candidates.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const candidateUserIds = candidates.map((c) => c.userId);
    const settingsRows = await Promise.all(
      candidateUserIds.map((uid) => getAfnProfileSettings(uid))
    );
    const openToCollaborateByUserId = new Map<number, boolean>();
    candidateUserIds.forEach((uid, i) => {
      openToCollaborateByUserId.set(uid, settingsRows[i]?.openToCollaborate ?? false);
    });

    const myTags = await getAfnProfileNormalizedTags(myProfile.id);
    const myShape = profileToScoringShape(myProfile, {
      skills: myTags.skills,
      industries: myTags.industries,
      interests: myTags.interests,
      goals: myTags.goals,
      challenges: myTags.challenges,
      collabPreferences: myTags.collabPreferences,
    });
    const candidateProfileIds = candidates.map((c) => c.id);
    const tagsByProfileId = await getAfnNormalizedTagSlugsByProfileIds(candidateProfileIds);
    const candidateShapes = candidates.map((c) => {
      const t = tagsByProfileId.get(c.id) ?? {
        skills: [],
        industries: [],
        interests: [],
        goals: [],
        challenges: [],
        collabPreferences: [],
      };
      return profileToScoringShape(c, {
        skills: t.skills,
        industries: t.industries,
        interests: t.interests,
        goals: t.goals,
        challenges: t.challenges,
        collabPreferences: t.collabPreferences,
      });
    });
    const suggestions = recommendConnections(myShape, candidateShapes, {
      openToCollaborateByUserId,
      maxSuggestions: limit,
      minScore: 5,
    });

    const candidateByUserId = new Map(candidates.map((c) => [c.userId, c]));
    const payload: SuggestionPayload[] = suggestions.map((s: ConnectionSuggestion) => {
      const row = candidateByUserId.get(s.profile.userId);
      return {
        id: s.profile.id,
        userId: s.profile.userId,
        displayName: row?.displayName ?? null,
        username: row?.username ?? null,
        avatarUrl: row?.avatarUrl ?? null,
        headline: s.profile.headline,
        businessStage: s.profile.businessStage,
        industry: s.profile.industry,
        founderTribe: row?.founderTribe ?? null,
        score: s.score,
        reasons: s.reasons,
      };
    });

    return NextResponse.json({ suggestions: payload });
  } catch (e) {
    console.error("GET community suggestions error:", e);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}

interface SuggestionPayload {
  id: number;
  userId: number;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  headline: string | null;
  businessStage: string | null;
  industry: string | null;
  founderTribe: string | null;
  score: number;
  reasons: string[];
}
