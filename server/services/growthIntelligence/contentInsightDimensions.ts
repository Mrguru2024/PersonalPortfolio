export const CONTENT_INSIGHT_DIMENSION_KEYS = [
  "hook_strength",
  "clarity",
  "pain_alignment",
  "specificity",
  "cta_strength",
  "likely_engagement",
  "likely_lead_generation_value",
  "audience_fit",
  "funnel_stage_fit",
  "platform_fit",
] as const;

export type ContentInsightDimensionKey = (typeof CONTENT_INSIGHT_DIMENSION_KEYS)[number];

export const CONTENT_INSIGHT_DIMENSION_LABELS: Record<ContentInsightDimensionKey, string> = {
  hook_strength: "Hook strength",
  clarity: "Clarity",
  pain_alignment: "Pain alignment",
  specificity: "Specificity",
  cta_strength: "CTA strength",
  likely_engagement: "Likely engagement",
  likely_lead_generation_value: "Lead generation value",
  audience_fit: "Audience fit",
  funnel_stage_fit: "Funnel-stage fit",
  platform_fit: "Platform fit",
};
