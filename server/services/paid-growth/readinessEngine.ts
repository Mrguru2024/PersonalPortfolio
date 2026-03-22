import type { IStorage } from "@server/storage";
import type { PpcCampaign } from "@shared/paidGrowthSchema";
import {
  PPC_READINESS_MIN_SCORE,
  type PpcPublishGates,
  isConversionTrackingConfiguredForPublish,
} from "@shared/ppcBusinessRules";

export type PpcReadinessResult = {
  overallScore: number;
  scores: Record<string, number>;
  blockers: string[];
  /** Actionable steps — includes gate failures and scoring blockers (deduped). */
  remediationChecklist: string[];
  gates: PpcPublishGates;
  /** All publish gates satisfied (hard preconditions + readiness score). */
  adReady: boolean;
  packageRecommendation: "Foundation" | "Launch" | "Revenue Engine";
};

const CATEGORIES = [
  "offer_clarity",
  "landing_readiness",
  "tracking_readiness",
  "crm_readiness",
  "follow_up_readiness",
  "proof_readiness",
  "budget_readiness",
  "creative_readiness",
  "conversion_goal_readiness",
] as const;

function scoreOffer(offerSlug: string | null | undefined, storage: IStorage): Promise<number> {
  if (!offerSlug?.trim()) return Promise.resolve(35);
  return storage.getSiteOffer(offerSlug.trim()).then((o) => (o ? 90 : 40));
}

function hasTrackingEnvScore(): number {
  const gtm = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return gtm || pixel || ga ? 85 : 45;
}

function buildRemediationFromGates(gates: PpcPublishGates): string[] {
  const lines: string[] = [];
  if (!gates.adAccountConnected) {
    lines.push("Connect a PPC ad account: create or select an active ppc_ad_accounts row for this campaign.");
  }
  if (!gates.offerLinked) {
    lines.push("Link a valid site offer (site_offers.slug) on the campaign.");
  }
  if (!gates.landingLinked) {
    lines.push("Set a concrete landing path (not “/”): funnel or public route starting with /.");
  }
  if (!gates.conversionTrackingConfigured) {
    lines.push(
      "Configure conversion tracking: set at least two of NEXT_PUBLIC_GTM_ID, NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_GA_MEASUREMENT_ID."
    );
  }
  if (!gates.crmRoutingConfigured) {
    lines.push("Configure CRM routing: set BREVO_API_KEY for lead notification and CRM-aligned delivery.");
  }
  if (!gates.commsFollowUpConfigured) {
    lines.push("Attach a valid Ascendra Communications campaign for post-capture follow-up (comm_campaign_id).");
  }
  if (!gates.readinessThresholdPassed) {
    lines.push(`Raise readiness score to at least ${PPC_READINESS_MIN_SCORE} (run checklist: offer, creative, budget, proof, UTMs).`);
  }
  return lines;
}

async function computeGates(campaign: PpcCampaign, storage: IStorage, overallScore: number): Promise<PpcPublishGates> {
  let adAccountConnected = false;
  if (campaign.ppcAdAccountId) {
    const accounts = await storage.listPpcAdAccounts();
    const acc = accounts.find((a) => a.id === campaign.ppcAdAccountId);
    adAccountConnected = !!acc && acc.status === "active";
  }

  const slug = campaign.offerSlug?.trim() ?? "";
  const offerLinked = slug ? !!(await storage.getSiteOffer(slug)) : false;

  const landing = (campaign.landingPagePath || "").trim();
  const landingLinked = landing.length > 1 && landing !== "/" && landing.startsWith("/");

  const conversionTrackingConfigured = isConversionTrackingConfiguredForPublish();

  const crmRoutingConfigured = Boolean(process.env.BREVO_API_KEY?.trim());

  let commsFollowUpConfigured = false;
  if (campaign.commCampaignId) {
    const comm = await storage.getCommCampaignById(campaign.commCampaignId);
    commsFollowUpConfigured = !!comm;
  }

  const readinessThresholdPassed = overallScore >= PPC_READINESS_MIN_SCORE;

  return {
    adAccountConnected,
    offerLinked,
    landingLinked,
    conversionTrackingConfigured,
    crmRoutingConfigured,
    commsFollowUpConfigured,
    readinessThresholdPassed,
  };
}

/**
 * PPC readiness — complements Growth Diagnosis with launch gates.
 * Publishing requires every gate in `gates` plus package path when not ad-ready (Foundation).
 */
export async function computePpcReadiness(campaign: PpcCampaign, storage: IStorage): Promise<PpcReadinessResult> {
  const scores: Record<string, number> = {} as Record<string, number>;
  const blockers: string[] = [];

  scores.offer_clarity = await scoreOffer(campaign.offerSlug, storage);
  if (scores.offer_clarity < 60) blockers.push("Link a valid site offer slug (site_offers).");

  const landing = (campaign.landingPagePath || "").trim();
  if (landing && landing !== "/") {
    const slug =
      landing
        .replace(/^\//, "")
        .split("?")[0]
        .split("/")
        .filter(Boolean)[0] ?? "";
    const funnelRow = slug ? await storage.getFunnelContent(slug) : undefined;
    scores.landing_readiness = funnelRow ? 88 : landing.startsWith("/") ? 72 : 55;
    if (!landing.startsWith("/")) blockers.push("Landing path should start with / (e.g. /launch-your-brand).");
  } else {
    scores.landing_readiness = 40;
    blockers.push("Set a concrete landing page path (funnel or site route).");
  }

  scores.tracking_readiness = hasTrackingEnvScore();
  if (scores.tracking_readiness < 70) {
    blockers.push("Configure at least one of NEXT_PUBLIC_GTM_ID, NEXT_PUBLIC_META_PIXEL_ID, or GA measurement ID.");
  }
  if (!isConversionTrackingConfiguredForPublish()) {
    blockers.push("For publish: configure at least two of GTM, Meta pixel, and GA (conversion stack).");
  }

  scores.crm_readiness = process.env.BREVO_API_KEY?.trim() ? 90 : 55;
  if (scores.crm_readiness < 70) blockers.push("BREVO_API_KEY required for CRM-aligned lead routing.");

  if (campaign.commCampaignId) {
    const comm = await storage.getCommCampaignById(campaign.commCampaignId);
    scores.follow_up_readiness = comm ? 88 : 50;
    if (!comm) blockers.push("Communications campaign ID invalid — clear or fix comm_campaign_id.");
  } else {
    scores.follow_up_readiness = 40;
    blockers.push("Attach an Ascendra Communications campaign for automated follow-up (required for publish).");
  }

  const sections = campaign.offerSlug ? (await storage.getSiteOffer(campaign.offerSlug))?.sections : null;
  const hasProof =
    sections &&
    typeof sections === "object" &&
    JSON.stringify(sections).toLowerCase().includes("testimonial");
  scores.proof_readiness = hasProof ? 82 : 62;

  scores.budget_readiness =
    campaign.budgetDailyCents != null && campaign.budgetDailyCents >= 100 ? 90 : 45;
  if (scores.budget_readiness < 70) blockers.push("Set daily budget (cents) to at least 1.00 unit for realistic pacing.");

  const copy = campaign.adCopyJson ?? {};
  const creative =
    (copy.headline?.trim() && copy.primaryText?.trim() ? 1 : 0) +
    ((campaign.creativeAssetUrls?.length ?? 0) > 0 ? 1 : 0);
  scores.creative_readiness = creative >= 2 ? 88 : creative === 1 ? 70 : 48;
  if (scores.creative_readiness < 70) blockers.push("Add ad headline + primary text and/or creative asset URLs.");

  const utm = campaign.trackingParamsJson ?? {};
  scores.conversion_goal_readiness =
    utm.utm_campaign?.trim() && utm.utm_source?.trim() && utm.utm_medium?.trim() ? 92 : 50;
  if (scores.conversion_goal_readiness < 70) {
    blockers.push("Fill utm_source, utm_medium, and utm_campaign for attribution + CRM source tagging.");
  }

  for (const k of CATEGORIES) {
    if (scores[k] == null) scores[k] = 50;
  }

  const overallScore = Math.round(
    CATEGORIES.reduce((s, k) => s + (scores[k] ?? 0), 0) / CATEGORIES.length
  );

  const gates = await computeGates(campaign, storage, overallScore);
  const allGatesPass = Object.values(gates).every(Boolean);
  const adReady = allGatesPass;

  const gateRemediation = buildRemediationFromGates(gates);
  const checklistSet = new Set<string>([...gateRemediation, ...blockers]);
  const remediationChecklist = Array.from(checklistSet);

  let packageRecommendation: PpcReadinessResult["packageRecommendation"] = "Foundation";
  if (adReady) {
    if (overallScore >= 72) packageRecommendation = "Revenue Engine";
    else if (overallScore >= PPC_READINESS_MIN_SCORE) packageRecommendation = "Launch";
    else packageRecommendation = "Foundation";
  } else {
    packageRecommendation = "Foundation";
  }

  return {
    overallScore,
    scores,
    blockers,
    remediationChecklist,
    gates,
    adReady,
    packageRecommendation,
  };
}
