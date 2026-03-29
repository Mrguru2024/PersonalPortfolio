import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnProfileByUserId,
  getAfnProfileNormalizedTags,
  getAfnProfileIntelligenceByUserId,
  getAfnCandidateProfilesForSuggestions,
  getAfnProfileSettings,
  getAfnNormalizedTagSlugsByProfileIds,
} from "@server/afnStorage";
import { getAfnNextBestAction } from "@server/services/afnNextBestActionService";
import {
  recommendConnections,
  profileToScoringShape,
  type ProfileTagSlugsForScoring,
} from "@/lib/community/connectionAlgorithm";

export const dynamic = "force-dynamic";

/** GET /api/community/dashboard — Phase 5 adaptive home payload. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const profile = await getAfnProfileByUserId(userId);
    const nextBestAction = await getAfnNextBestAction(userId);
    let topSuggestions: unknown[] = [];
    let tags: ProfileTagSlugsForScoring | null = null;
    let intelligence = null;

    if (profile) {
      const tagRows = await getAfnProfileNormalizedTags(profile.id);
      tags = {
        skills: tagRows.skills,
        industries: tagRows.industries,
        interests: tagRows.interests,
        goals: tagRows.goals,
        challenges: tagRows.challenges,
        collabPreferences: tagRows.collabPreferences,
      };
      intelligence = await getAfnProfileIntelligenceByUserId(userId);

      if (profile.isOnboardingComplete) {
        const candidates = await getAfnCandidateProfilesForSuggestions({
          currentUserId: userId,
          limit: 16,
          excludeConnected: true,
          excludeAlreadyMessaged: true,
        });
        if (candidates.length > 0) {
          const candidateUserIds = candidates.map((c) => c.userId);
          const settingsRows = await Promise.all(candidateUserIds.map((uid) => getAfnProfileSettings(uid)));
          const openToCollaborateByUserId = new Map<number, boolean>();
          candidateUserIds.forEach((uid, i) => {
            openToCollaborateByUserId.set(uid, settingsRows[i]?.openToCollaborate ?? false);
          });
          const myShape = profileToScoringShape(profile, tags);
          const tagsById = await getAfnNormalizedTagSlugsByProfileIds(candidates.map((c) => c.id));
          const candidateShapes = candidates.map((c) => {
            const t =
              tagsById.get(c.id) ?? {
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
            maxSuggestions: 5,
            minScore: 5,
          });
          topSuggestions = suggestions.map((s) => ({
            userId: s.profile.userId,
            score: s.score,
            reasons: s.reasons,
          }));
        }
      }
    }

    return NextResponse.json({
      profile,
      tags,
      intelligence,
      nextBestAction,
      topSuggestions,
      modules: {
        tribes: { href: "/Afn/tribes", label: "Find your tribe" },
        speedNetworking: { href: "/Afn/speed-networking", label: "Speed networking" },
        projects: { href: "/Afn/projects", label: "Collaboration projects" },
      },
    });
  } catch (e) {
    console.error("GET community dashboard error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
