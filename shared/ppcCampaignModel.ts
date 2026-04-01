/**
 * Ascendra modular PPC engine — campaign archetypes drive defaults for tracking, funnel posture, and attribution windows.
 * Persist `campaign_model` on `ppc_campaigns`; derive behavior via `getPpcEngineModuleConfig`.
 */

export const PPC_CAMPAIGN_MODELS = [
  "LOCAL_SERVICE",
  "APPOINTMENT_BASED",
  "LEAD_GEN_FUNNEL",
  "ECOMMERCE",
  "SAAS",
] as const;

export type CampaignModel = (typeof PPC_CAMPAIGN_MODELS)[number];

export const DEFAULT_PPC_CAMPAIGN_MODEL: CampaignModel = "LEAD_GEN_FUNNEL";

/** How we expect the visitor path to behave for creative + landing alignment. */
export type PpcFunnelType = "call-first" | "multi-step" | "single-lander" | "transaction-focused";

/** Attribution / optimization horizon — rules engine and future adapters use this (not a third-party API flag). */
export type PpcAttributionMode = "fast-cycle" | "delayed" | "blended";

export type PpcEngineModuleConfig = {
  campaignModel: CampaignModel;
  enableCallTracking: boolean;
  funnelType: PpcFunnelType;
  attribution: PpcAttributionMode;
  /** Hint for rules engine: snapshot lookback (days) when classifying spend vs outcomes. */
  optimizationLookbackDays: number;
  /** Admin-facing one-liner. */
  label: string;
  adminSummary: string;
};

const MODEL_META: Record<
  CampaignModel,
  Omit<PpcEngineModuleConfig, "campaignModel"> & { label: string; adminSummary: string }
> = {
  LOCAL_SERVICE: {
    enableCallTracking: true,
    funnelType: "call-first",
    attribution: "fast-cycle",
    optimizationLookbackDays: 21,
    label: "Local service",
    adminSummary: "Call-heavy buyers, short decision cycles. Prefer call tracking and click-to-call; attribute leads quickly.",
  },
  APPOINTMENT_BASED: {
    enableCallTracking: true,
    funnelType: "call-first",
    attribution: "fast-cycle",
    optimizationLookbackDays: 28,
    label: "Appointment-based",
    adminSummary: "Consultations and scheduled visits. Same posture as local service with slightly longer booking lag.",
  },
  LEAD_GEN_FUNNEL: {
    enableCallTracking: false,
    funnelType: "multi-step",
    attribution: "blended",
    optimizationLookbackDays: 35,
    label: "Lead gen funnel",
    adminSummary: "Form → nurture → sales. Multi-step journeys; blend first and last touch in reporting.",
  },
  ECOMMERCE: {
    enableCallTracking: false,
    funnelType: "transaction-focused",
    attribution: "delayed",
    optimizationLookbackDays: 45,
    label: "E-commerce",
    adminSummary: "Product and cart paths. Conversions often lag clicks; use longer windows before pausing on spend.",
  },
  SAAS: {
    enableCallTracking: false,
    funnelType: "multi-step",
    attribution: "delayed",
    optimizationLookbackDays: 60,
    label: "SaaS / trial",
    adminSummary: "Trials and multi-touch evaluation. Delayed attribution; avoid over-reacting to same-week CPL.",
  },
};

/** Full engine defaults for a campaign archetype. */
export function getPpcEngineModuleConfig(model: CampaignModel): PpcEngineModuleConfig {
  const m = MODEL_META[model];
  return {
    campaignModel: model,
    enableCallTracking: m.enableCallTracking,
    funnelType: m.funnelType,
    attribution: m.attribution,
    optimizationLookbackDays: m.optimizationLookbackDays,
    label: m.label,
    adminSummary: m.adminSummary,
  };
}

/** Normalize DB or API string to a known model (defaults for legacy rows). */
export function parseCampaignModel(value: string | null | undefined): CampaignModel {
  const v = (value ?? "").trim().toUpperCase();
  if ((PPC_CAMPAIGN_MODELS as readonly string[]).includes(v)) {
    return v as CampaignModel;
  }
  return DEFAULT_PPC_CAMPAIGN_MODEL;
}

/** Catalog for admin pickers and docs. */
export function listPpcCampaignModelOptions(): PpcEngineModuleConfig[] {
  return PPC_CAMPAIGN_MODELS.map((campaignModel) => getPpcEngineModuleConfig(campaignModel));
}
