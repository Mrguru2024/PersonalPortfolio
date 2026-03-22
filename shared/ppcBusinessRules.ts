/**
 * Ascendra Paid Growth — product rules (single source of truth for gates + thresholds).
 */

export const PPC_READINESS_MIN_SCORE = 60;

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
