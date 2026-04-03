/**
 * Lead intelligence event types for behavioral tracking across the funnel.
 * Used by /api/track/visitor and useVisitorTracking (and any server-side tracking).
 */
export const LEAD_TRACKING_EVENT_TYPES = [
  "page_view",
  "cta_click",
  "lead_magnet_download",
  "pricing_view",
  "calculator_start",
  "calculator_complete",
  "audit_tool_start",
  "audit_tool_complete",
  "form_start",
  "form_abandon",
  "form_submit",
  "form_started", // legacy alias
  "form_completed", // legacy alias
  "booking_click",
  "booking_complete",
  "video_play",
  "section_engagement",
  "return_visit",
  "tool_used", // legacy
  /** Persona journey engine — public marketing funnel */
  "persona_journey_selected",
  "persona_journey_more_toggle",
  "persona_journey_viewed",
  "persona_journey_lead_magnet_click",
  /** Market Score free tool — AMIE preview + CRM attach */
  "market_score_complete",
  /** Urgency & Scarcity Conversion Engine — impressions and CTA engagement (metadata: urgencySurface, variantKey, …) */
  "urgency_surface_view",
  "urgency_cta_impression",
  "urgency_cta_click",
  /** Micro-commitment funnel — metadata: surfaceKey, step */
  "funnel_micro_step",
] as const;

export type LeadTrackingEventType = (typeof LEAD_TRACKING_EVENT_TYPES)[number];

/** Default event type when invalid or missing. */
export const DEFAULT_TRACKING_EVENT_TYPE: LeadTrackingEventType = "page_view";

export function isLeadTrackingEventType(s: string): s is LeadTrackingEventType {
  return (LEAD_TRACKING_EVENT_TYPES as readonly string[]).includes(s);
}
