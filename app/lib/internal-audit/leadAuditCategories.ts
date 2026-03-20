/** $100M Leads–style alignment categories (internal audit engine). */
export const LEAD_AUDIT_CATEGORY_KEYS = [
  "traffic_sources",
  "lead_capture",
  "offer_positioning",
  "lead_management",
  "content_strategy_alignment",
  "follow_up_systems",
  "analytics_growth_intelligence",
  "cta_visibility_density",
  "funnel_clarity",
  "lead_magnet_readiness",
] as const;

export type LeadAuditCategoryKey = (typeof LEAD_AUDIT_CATEGORY_KEYS)[number];

export const LEAD_AUDIT_CATEGORY_LABELS: Record<LeadAuditCategoryKey, string> = {
  traffic_sources: "Traffic sources",
  lead_capture: "Lead capture",
  offer_positioning: "Offer positioning",
  lead_management: "Lead management",
  content_strategy_alignment: "Content strategy alignment",
  follow_up_systems: "Follow-up systems",
  analytics_growth_intelligence: "Analytics & growth intelligence",
  cta_visibility_density: "CTA visibility / density",
  funnel_clarity: "Funnel clarity",
  lead_magnet_readiness: "Lead magnet readiness",
};

export type StrengthState = "strength" | "weakness" | "mixed" | "unknown";
export type ImplPriority = "p0" | "p1" | "p2" | "p3";

export interface LeadAuditRecommendationDraft {
  title: string;
  detail?: string;
  relatedPaths: string[];
  priority: ImplPriority;
}

export interface LeadAuditCategoryResult {
  categoryKey: LeadAuditCategoryKey;
  score: number;
  strengthState: StrengthState;
  whyItMatters: string;
  risk: string;
  implementationPriority: ImplPriority;
  recommendations: LeadAuditRecommendationDraft[];
}
