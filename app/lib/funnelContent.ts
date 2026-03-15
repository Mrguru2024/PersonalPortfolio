export type FunnelContentData = Record<string, unknown> | null;

export const FUNNEL_SLUGS = ["growth-kit", "website-score", "action-plan", "offer"] as const;
export type FunnelSlug = (typeof FUNNEL_SLUGS)[number];
