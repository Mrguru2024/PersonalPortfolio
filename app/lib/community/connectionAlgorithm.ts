/**
 * User connection recommendation algorithm for community growth.
 * Suggests members based on profile data, business needs, topics, and business focus.
 */

import type { AfnProfile } from "@shared/schema";
import { BUSINESS_STAGES } from "./constants";

export interface ProfileForScoring {
  userId: number;
  id: number;
  industry: string | null;
  businessStage: string | null;
  /** AFN tribe / founder type (e.g. startup_founder). */
  founderTribe: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  goals: string | null;
  lookingFor: string | null;
  collaborationInterests: string | null;
  askMeAbout: string | null;
  whatBuilding: string | null;
  biggestChallenge: string | null;
  /** Phase 3 — normalized tag slugs from junction tables */
  skillSlugs?: string[];
  industrySlugs?: string[];
  interestSlugs?: string[];
  goalSlugs?: string[];
  challengeSlugs?: string[];
  collabPreferenceSlugs?: string[];
  [key: string]: unknown;
}

/** Normalize industry for matching (e.g. tech ↔ technology). */
const INDUSTRY_ALIASES: Record<string, string> = {
  tech: "technology",
  technology: "technology",
  saas: "software",
  software: "software",
  creative: "creative",
  services: "services",
  consulting: "consulting",
  agency: "agency",
  other: "other",
};

export interface ConnectionSuggestion {
  profile: ProfileForScoring;
  score: number;
  reasons: string[];
}

const STAGE_ORDER = BUSINESS_STAGES as unknown as string[];

function normalizeText(s: string | null | undefined): string {
  if (!s || typeof s !== "string") return "";
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): Set<string> {
  if (!text) return new Set();
  const words = text.split(/\s+/).filter((w) => w.length > 1);
  return new Set(words);
}

function tokenizePhrases(text: string, minLen = 3): Set<string> {
  if (!text) return new Set();
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
  const phrases = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    phrases.add(words[i]);
    if (i < words.length - 1) phrases.add(words[i] + " " + words[i + 1]);
  }
  return new Set([...phrases].filter((p) => p.length >= minLen));
}

function getAllTokens(p: ProfileForScoring): Set<string> {
  const combined = [
    p.goals,
    p.lookingFor,
    p.collaborationInterests,
    p.askMeAbout,
    p.whatBuilding,
    p.biggestChallenge,
    p.headline,
    p.bio,
  ]
    .filter(Boolean)
    .join(" ");
  return tokenize(normalizeText(combined));
}

/** Tokens for business focus only: whatBuilding, goals, headline (for stronger alignment signal). */
function getBusinessFocusTokens(p: ProfileForScoring): Set<string> {
  const combined = [p.whatBuilding, p.goals, p.headline].filter(Boolean).join(" ");
  return tokenize(normalizeText(combined));
}

function normalizeIndustry(s: string | null | undefined): string | null {
  if (!s || typeof s !== "string") return null;
  const key = normalizeText(s);
  return INDUSTRY_ALIASES[key] ?? key;
}

function locationOverlap(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return true;
  const naWords = na.split(/\s+/);
  const nbWords = nb.split(/\s+/);
  return naWords.some((w) => w.length > 2 && nb.includes(w)) || nbWords.some((w) => w.length > 2 && na.includes(w));
}

/** Overlap score 0–1 (Jaccard-like). */
function textOverlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  a.forEach((t) => {
    if (b.has(t)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function jaccardSlugSets(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  A.forEach((s) => {
    if (B.has(s)) inter++;
  });
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function stageDistance(s1: string | null, s2: string | null): number {
  if (!s1 || !s2) return -1;
  const i1 = STAGE_ORDER.indexOf(s1);
  const i2 = STAGE_ORDER.indexOf(s2);
  if (i1 === -1 || i2 === -1) return -1;
  return Math.abs(i1 - i2);
}

/** Check if any phrase in "looking" appears in "offering" (e.g. lookingFor vs askMeAbout). */
function hasComplementaryMatch(looking: string | null, offering: string | null): boolean {
  const look = tokenizePhrases(normalizeText(looking ?? ""));
  const offer = tokenizePhrases(normalizeText(offering ?? ""));
  if (look.size === 0 || offer.size === 0) return false;
  for (const phrase of look) {
    if (phrase.length < 4) continue;
    for (const o of offer) {
      if (o.includes(phrase) || phrase.includes(o)) return true;
    }
  }
  return false;
}

/**
 * Score a single candidate against the current user's profile.
 * Returns 0–100 and human-readable reasons.
 */
export function scoreConnectionCandidate(
  me: ProfileForScoring,
  candidate: ProfileForScoring,
  candidateOpenToCollaborate?: boolean
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Industry match (strong signal for business focus) — normalized
  const myIndustry = normalizeIndustry(me.industry);
  const theirIndustry = normalizeIndustry(candidate.industry);
  const sameIndustry = myIndustry && theirIndustry && myIndustry === theirIndustry;
  if (sameIndustry) {
    score += 25;
    reasons.push("Same industry");
  }

  // Normalized tag overlap (Phase 1–3 taxonomy)
  const skillJ = jaccardSlugSets(me.skillSlugs, candidate.skillSlugs);
  const goalJ = jaccardSlugSets(me.goalSlugs, candidate.goalSlugs);
  const interestJ = jaccardSlugSets(me.interestSlugs, candidate.interestSlugs);
  const indSlugJ = jaccardSlugSets(me.industrySlugs, candidate.industrySlugs);
  if (skillJ > 0) {
    score += Math.min(14, Math.round(skillJ * 18));
    reasons.push("Shared skill tags");
  }
  if (goalJ > 0) {
    score += Math.min(16, Math.round(goalJ * 20));
    reasons.push("Aligned goal tags");
  }
  if (interestJ > 0.15) {
    score += Math.min(12, Math.round(interestJ * 14));
    reasons.push("Shared interests");
  }
  if (!sameIndustry && indSlugJ > 0) {
    score += Math.min(10, Math.round(indSlugJ * 12));
    reasons.push("Industry tag overlap");
  }

  // Business stage (peer or adjacent)
  const dist = stageDistance(me.businessStage, candidate.businessStage);
  if (dist === 0) {
    score += 15;
    reasons.push("Same business stage");
  } else if (dist === 1) {
    score += 8;
    reasons.push("Similar business stage");
  }

  // Topic overlap: goals, what they're building, challenges, bio
  const myTokens = getAllTokens(me);
  const theirTokens = getAllTokens(candidate);
  const overlap = textOverlapScore(myTokens, theirTokens);
  if (overlap > 0.15) {
    const overlapPoints = Math.min(30, Math.round(overlap * 40));
    score += overlapPoints;
    reasons.push("Aligned on goals, interests, or focus");
  }

  // Business focus overlap (whatBuilding, goals, headline) — explicit signal
  const myFocus = getBusinessFocusTokens(me);
  const theirFocus = getBusinessFocusTokens(candidate);
  if (myFocus.size > 0 && theirFocus.size > 0) {
    const focusOverlap = textOverlapScore(myFocus, theirFocus);
    if (focusOverlap > 0.2) {
      score += Math.min(12, Math.round(focusOverlap * 25));
      if (!reasons.some((r) => r.includes("goals") || r.includes("focus"))) {
        reasons.push("Similar business focus");
      }
    }
  }

  // Location affinity (optional; small bonus for local connections)
  if (locationOverlap(me.location, candidate.location)) {
    score += 5;
    reasons.push("Same or nearby location");
  }

  // Complementary: I'm looking for X, they offer/ask about X
  const lookingForMatch =
    hasComplementaryMatch(me.lookingFor, candidate.askMeAbout) ||
    hasComplementaryMatch(me.lookingFor, candidate.collaborationInterests) ||
    hasComplementaryMatch(me.biggestChallenge, candidate.askMeAbout);
  if (lookingForMatch) {
    score += 20;
    reasons.push("They can help with what you're looking for");
  }

  // Reverse: they're looking for something I can offer
  const theyNeedWhatIOffer =
    hasComplementaryMatch(candidate.lookingFor, me.askMeAbout) ||
    hasComplementaryMatch(candidate.biggestChallenge, me.askMeAbout);
  if (theyNeedWhatIOffer) {
    score += 12;
    reasons.push("You can help with what they're looking for");
  }

  // Collaboration interests overlap
  const myCollab = tokenize(normalizeText(me.collaborationInterests ?? ""));
  const theirCollab = tokenize(normalizeText(candidate.collaborationInterests ?? ""));
  if (myCollab.size > 0 && theirCollab.size > 0 && textOverlapScore(myCollab, theirCollab) > 0.2) {
    score += 10;
    reasons.push("Shared collaboration interests");
  }

  if (candidateOpenToCollaborate) {
    score += 5;
    reasons.push("Open to collaborate");
  }

  // Diversity: different industry but strong need/offer match — good for cross-industry collaboration
  if (!sameIndustry && myIndustry && theirIndustry && (reasons.some((r) => r.includes("help")) || overlap > 0.2)) {
    reasons.push("Complementary industry");
  }

  // Cap at 100
  score = Math.min(100, score);
  return { score, reasons };
}

/**
 * Rank candidate profiles for the current user.
 * Returns suggestions sorted by score descending, with reasons.
 */
export function recommendConnections(
  myProfile: ProfileForScoring,
  candidates: ProfileForScoring[],
  options?: {
    openToCollaborateByUserId?: Map<number, boolean>;
    maxSuggestions?: number;
    minScore?: number;
  }
): ConnectionSuggestion[] {
  const openMap = options?.openToCollaborateByUserId ?? new Map<number, boolean>();
  const max = options?.maxSuggestions ?? 20;
  const minScore = options?.minScore ?? 5;

  const scored: ConnectionSuggestion[] = candidates.map((profile) => {
    const { score, reasons } = scoreConnectionCandidate(
      myProfile,
      profile,
      openMap.get(profile.userId)
    );
    return { profile, score, reasons };
  });

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

export type ProfileTagSlugsForScoring = {
  skills?: string[];
  industries?: string[];
  interests?: string[];
  goals?: string[];
  challenges?: string[];
  collabPreferences?: string[];
};

/** Map DB profile row to ProfileForScoring (snake_case or camelCase). */
export function profileToScoringShape(
  row: AfnProfile | Record<string, unknown>,
  tags?: ProfileTagSlugsForScoring
): ProfileForScoring {
  const r = row as Record<string, unknown>;
  return {
    userId: Number(r.userId ?? r.user_id),
    id: Number(r.id),
    industry: (r.industry as string) ?? null,
    businessStage: (r.businessStage as string) ?? (r.business_stage as string) ?? null,
    founderTribe: (r.founderTribe as string) ?? (r.founder_tribe as string) ?? null,
    headline: (r.headline as string) ?? null,
    bio: (r.bio as string) ?? null,
    location: (r.location as string) ?? null,
    goals: (r.goals as string) ?? null,
    lookingFor: (r.lookingFor as string) ?? (r.looking_for as string) ?? null,
    collaborationInterests:
      (r.collaborationInterests as string) ?? (r.collaboration_interests as string) ?? null,
    askMeAbout: (r.askMeAbout as string) ?? (r.ask_me_about as string) ?? null,
    whatBuilding: (r.whatBuilding as string) ?? (r.what_building as string) ?? null,
    biggestChallenge: (r.biggestChallenge as string) ?? (r.biggest_challenge as string) ?? null,
    skillSlugs: tags?.skills,
    industrySlugs: tags?.industries,
    interestSlugs: tags?.interests,
    goalSlugs: tags?.goals,
    challengeSlugs: tags?.challenges,
    collabPreferenceSlugs: tags?.collabPreferences,
  };
}
