/**
 * Growth Intelligence System — types and constants.
 * Integrates with existing visitor_activity, crm_contacts, crm_deals.
 */

export const GROWTH_EXPERIMENT_STATUSES = ["draft", "running", "paused", "ended"] as const;
export type GrowthExperimentStatus = (typeof GROWTH_EXPERIMENT_STATUSES)[number];

export interface AttributionRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  leadCount: number;
  dealCount: number;
  wonCount: number;
  avgLeadScore: number | null;
}

export interface VariantResult {
  variantKey: string;
  config: Record<string, unknown> | null;
}
