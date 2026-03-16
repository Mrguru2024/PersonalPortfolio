/**
 * Rule-based lead scoring: add points for behavioral events, persist history, update lifecycle stage.
 * Used after form submit, audit complete, calculator complete, booking, etc.
 */

import type { LeadTrackingEventType } from "@shared/leadTrackingTypes";
import type { IStorage } from "@server/storage";

/** Points awarded per event type. Adjust in code for tuning. */
export const SCORING_RULES: Partial<Record<LeadTrackingEventType | string, number>> = {
  page_view: 0, // no points for generic page view (or use only for specific pages below)
  cta_click: 2,
  lead_magnet_download: 15,
  pricing_view: 15,
  calculator_start: 2,
  calculator_complete: 20,
  audit_tool_start: 2,
  audit_tool_complete: 20,
  form_start: 0,
  form_abandon: 0,
  form_submit: 25,
  form_completed: 25,
  form_started: 0,
  booking_click: 20,
  booking_complete: 50,
  video_play: 3,
  section_engagement: 2,
  return_visit: 10,
  tool_used: 5,
};

/** Service page path pattern: viewing a service page adds points. */
const SERVICE_PAGE_POINTS = 5;
const MULTIPLE_SERVICE_PAGES_BONUS = 10;

export const LIFECYCLE_STAGES = ["cold", "warm", "qualified", "sales_ready"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/** Score bands for lifecycle (inclusive min, exclusive max except sales_ready). */
export function scoreToLifecycleStage(score: number): LifecycleStage {
  if (score >= 80) return "sales_ready";
  if (score >= 50) return "qualified";
  if (score >= 25) return "warm";
  return "cold";
}

/** Map lifecycle to intent level for backward compatibility with CRM. */
export function lifecycleToIntentLevel(stage: LifecycleStage): string {
  const map: Record<LifecycleStage, string> = {
    cold: "low_intent",
    warm: "moderate_intent",
    qualified: "high_intent",
    sales_ready: "hot_lead",
  };
  return map[stage];
}

/** Stage 2: Suggested lead score from stored profile (engagement + qualification completeness). For display or batch recalc. */
export function computeSuggestedLeadScore(signals: {
  currentLeadScore?: number | null;
  hasPrimaryPainPoint?: boolean;
  hasBudgetRange?: boolean;
  hasExpectedCloseAt?: boolean;
  hasServiceInterest?: boolean;
  hasAccount?: boolean;
  hasResearch?: boolean;
  pipelineStage?: string | null;
}): number {
  let score = signals.currentLeadScore ?? 0;
  if (signals.hasPrimaryPainPoint) score += 5;
  if (signals.hasBudgetRange) score += 5;
  if (signals.hasExpectedCloseAt) score += 5;
  if (signals.hasServiceInterest) score += 3;
  if (signals.hasAccount) score += 2;
  if (signals.hasResearch) score += 8;
  const stage = signals.pipelineStage ?? "";
  if (["qualified", "proposal_ready", "negotiation"].includes(stage)) score += 10;
  else if (["follow_up", "researching"].includes(stage)) score += 5;
  return Math.min(100, Math.max(0, score));
}

export interface AddScoreResult {
  leadId: number;
  previousScore: number;
  newScore: number;
  pointsDelta: number;
  lifecycleStage: LifecycleStage;
  intentLevel: string;
}

/**
 * Apply points for a single event type, persist score event, update contact.
 * Returns the result; does not throw (logs and returns no-op if storage fails).
 */
export async function addScoreFromEvent(
  storage: IStorage,
  leadId: number,
  eventType: string,
  metadata?: { page?: string; component?: string }
): Promise<AddScoreResult | null> {
  const points = SCORING_RULES[eventType] ?? 0;
  if (points === 0 && eventType !== "page_view") {
    // Optional: still update lastActivityAt
    const contact = await storage.getCrmContactById(leadId);
    if (contact) {
      await storage.updateCrmContact(leadId, { lastActivityAt: new Date() });
    }
    return null;
  }

  let extraPoints = 0;
  if (eventType === "page_view" && metadata?.page) {
    if (/\/services(\/|$)/.test(metadata.page) || /\/service\//.test(metadata.page)) {
      extraPoints = SERVICE_PAGE_POINTS;
      // Optional: check if they've viewed multiple service pages and add bonus (would need activity lookup)
    }
  }

  const totalDelta = points + extraPoints;
  if (totalDelta === 0) return null;

  const contact = await storage.getCrmContactById(leadId);
  if (!contact) return null;

  const previousScore = contact.leadScore ?? 0;
  const newScore = Math.min(100, Math.max(0, previousScore + totalDelta));
  const lifecycleStage = scoreToLifecycleStage(newScore);
  const intentLevel = lifecycleToIntentLevel(lifecycleStage);

  try {
    await storage.createLeadScoreEvent({
      leadId,
      previousScore,
      newScore,
      pointsDelta: totalDelta,
      reason: eventType,
      metadata: metadata ?? undefined,
    });
    await storage.updateCrmContact(leadId, {
      leadScore: newScore,
      intentLevel,
      lifecycleStage,
      lastActivityAt: new Date(),
    });
    return {
      leadId,
      previousScore,
      newScore,
      pointsDelta: totalDelta,
      lifecycleStage,
      intentLevel,
    };
  } catch (e) {
    console.error("Lead scoring error:", e);
    return null;
  }
}

/**
 * Apply multiple service page views: +5 per service page, +10 if multiple. Call when you have
 * aggregated count of service page views for the lead.
 */
export async function addScoreForServicePagesViewed(
  storage: IStorage,
  leadId: number,
  servicePageViewCount: number
): Promise<AddScoreResult | null> {
  if (servicePageViewCount <= 0) return null;
  const points = servicePageViewCount * SERVICE_PAGE_POINTS + (servicePageViewCount > 1 ? MULTIPLE_SERVICE_PAGES_BONUS : 0);
  const contact = await storage.getCrmContactById(leadId);
  if (!contact) return null;
  const previousScore = contact.leadScore ?? 0;
  const newScore = Math.min(100, Math.max(0, previousScore + points));
  const lifecycleStage = scoreToLifecycleStage(newScore);
  const intentLevel = lifecycleToIntentLevel(lifecycleStage);
  try {
    await storage.createLeadScoreEvent({
      leadId,
      previousScore,
      newScore,
      pointsDelta: points,
      reason: "service_pages_viewed",
      metadata: { servicePageViewCount },
    });
    await storage.updateCrmContact(leadId, {
      leadScore: newScore,
      intentLevel,
      lifecycleStage,
      lastActivityAt: new Date(),
    });
    return { leadId, previousScore, newScore, pointsDelta: points, lifecycleStage, intentLevel };
  } catch (e) {
    console.error("Lead scoring error (service pages):", e);
    return null;
  }
}
