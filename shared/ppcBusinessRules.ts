/**
 * Ascendra Paid Growth — product rules (single source of truth for gates + thresholds).
 */

export const PPC_READINESS_MIN_SCORE = 60;

/** Operator-facing route from readiness (maps to UX copy in admin). */
export const PPC_GROWTH_ROUTE_RECOMMENDATIONS = [
  "needs_foundation",
  "limited_test",
  "ready_for_ppc",
  "ready_to_scale",
] as const;
export type PpcGrowthRouteRecommendation = (typeof PPC_GROWTH_ROUTE_RECOMMENDATIONS)[number];

export function growthRouteRecommendationFromReadiness(args: {
  adReady: boolean;
  overallScore: number;
}): PpcGrowthRouteRecommendation {
  const { adReady, overallScore } = args;
  if (!adReady || overallScore < PPC_READINESS_MIN_SCORE) return "needs_foundation";
  if (overallScore < 68) return "limited_test";
  if (overallScore < 82) return "ready_for_ppc";
  return "ready_to_scale";
}

export function growthRouteRecommendationLabel(route: PpcGrowthRouteRecommendation): string {
  switch (route) {
    case "needs_foundation":
      return "Needs foundation work";
    case "limited_test":
      return "Ready for limited test campaign";
    case "ready_for_ppc":
      return "Ready for PPC";
    case "ready_to_scale":
      return "Ready to scale";
    default:
      return route;
  }
}

/** Ad account lifecycle for admin surfacing (not platform OAuth state). */
export const PPC_AD_READY_STATUSES = ["not_assessed", "ad_ready", "not_ad_ready"] as const;
export type PpcAdReadyStatus = (typeof PPC_AD_READY_STATUSES)[number];

export type PpcPublishGateKey =
  | "adAccountConnected"
  | "offerLinked"
  | "landingLinked"
  | "conversionTrackingConfigured"
  | "crmRoutingConfigured"
  | "commsFollowUpConfigured"
  | "readinessThresholdPassed";

export type PpcPublishGates = Record<PpcPublishGateKey, boolean>;

const META_SUPPORTED_OBJECTIVES = new Set(["traffic", "leads"]);

export function isMetaObjectiveSupportedForDashboardPublish(objective: string | null | undefined): boolean {
  const o = (objective || "traffic").toLowerCase().trim();
  return META_SUPPORTED_OBJECTIVES.has(o);
}

export function metaUnsupportedObjectiveMessage(objective: string | null | undefined): string {
  return `Objective "${objective || "traffic"}" is not supported for Meta publish from Ascendra. Supported: traffic, leads. Other objectives are high-risk or require manual setup in Ads Manager.`;
}

export const GOOGLE_ADS_DASHBOARD_PUBLISH_BLOCKED =
  "Google Ads campaigns cannot be published from the Ascendra dashboard in this build. OAuth and developer token can be validated, but campaign creation is deferred — use the Google Ads UI or extend the Ads API integration. This workflow is intentionally blocked.";

export function conversionTrackingEnvCount(): number {
  let n = 0;
  if (process.env.NEXT_PUBLIC_GTM_ID?.trim()) n++;
  if (process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()) n++;
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) n++;
  return n;
}

/** Require at least two of GTM / Meta pixel / GA so conversion measurement is not a single point of failure. */
export function isConversionTrackingConfiguredForPublish(): boolean {
  return conversionTrackingEnvCount() >= 2;
}
