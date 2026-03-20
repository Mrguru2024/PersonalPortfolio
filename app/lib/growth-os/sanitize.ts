/**
 * Growth OS — boundary helpers so internal payloads never leak to client/public routes by accident.
 * Phase 1: structural stubs + allow-lists; wire real mappers per module in later phases.
 */

import {
  DATA_VISIBILITY_TIERS,
  type DataVisibilityTier,
} from "@shared/accessScope";

export { DATA_VISIBILITY_TIERS };

/** Keys that must never appear in client_visible or public_visible exports. */
export const INTERNAL_ONLY_PAYLOAD_KEYS = [
  "rawAiReasoning",
  "aiReasoning",
  "internalNotes",
  "keywordResearch",
  "trendIntelligence",
  "crossProjectInsights",
  "scoringBreakdown",
  "internalScoring",
  "modelWeights",
  "internalRationale",
  "consolidatedInternalRationale",
  "researchProviderRaw",
  "leadScoreHistory",
  "enrichmentRaw",
  "crmAiGuidance",
] as const;

export type InternalLeakKey = (typeof INTERNAL_ONLY_PAYLOAD_KEYS)[number];

export function isForbiddenClientKey(key: string): key is InternalLeakKey {
  return (INTERNAL_ONLY_PAYLOAD_KEYS as readonly string[]).includes(key);
}

export function stripForbiddenKeys<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!isForbiddenClientKey(k)) out[k] = v;
  }
  return out;
}

/**
 * Build a minimal client-safe object from an internal record.
 * Only copies keys in allowList if present; never copies INTERNAL_ONLY_PAYLOAD_KEYS.
 */
export function pickClientSafeFields(
  source: Record<string, unknown>,
  allowList: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of allowList) {
    if (isForbiddenClientKey(key)) continue;
    if (key in source) out[key] = source[key];
  }
  return out;
}

export function isDataVisibilityTier(v: string): v is DataVisibilityTier {
  return (DATA_VISIBILITY_TIERS as readonly string[]).includes(v);
}
