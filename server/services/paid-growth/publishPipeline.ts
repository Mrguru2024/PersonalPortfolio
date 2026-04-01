import { storage } from "@server/storage";
import type { PpcCampaign } from "@shared/paidGrowthSchema";
import type { PpcAdReadyStatus } from "@shared/ppcBusinessRules";
import {
  GOOGLE_ADS_DASHBOARD_PUBLISH_BLOCKED,
  isMetaObjectiveSupportedForDashboardPublish,
  metaUnsupportedObjectiveMessage,
} from "@shared/ppcBusinessRules";
import { computePpcReadiness } from "./readinessEngine";
import { validateGoogleAdsOAuth, validateGoogleAdsDeveloperToken } from "./googleAdsConnection";
import { metaConnectionProbe, publishMetaCampaignBundle } from "./metaMarketingPublish";

export type PublishPipelineResult =
  | {
      ok: true;
      platformCampaignId?: string;
      platformAdSetId?: string;
      message: string;
    }
  | { ok: false; error: string; details?: unknown };

async function setLinkedAdAccountStatus(campaign: PpcCampaign, status: PpcAdReadyStatus): Promise<void> {
  if (!campaign.ppcAdAccountId) return;
  try {
    await storage.updatePpcAdAccount(campaign.ppcAdAccountId, { adReadyStatus: status });
  } catch {
    /* ignore missing account */
  }
}

/**
 * Guarded publish: hard gates, readiness, supported campaign types, then platform adapter.
 */
export async function runPpcPublishPipeline(campaignId: number): Promise<PublishPipelineResult> {
  const campaign = await storage.getPpcCampaignById(campaignId);
  if (!campaign) return { ok: false, error: "Campaign not found" };

  if (campaign.platform === "google_ads") {
    await storage.updatePpcCampaign(campaignId, {
      status: "validation_failed",
      lastSyncError: GOOGLE_ADS_DASHBOARD_PUBLISH_BLOCKED,
    });
    await setLinkedAdAccountStatus(campaign, "not_ad_ready");
    await storage.createPpcPublishLog({
      campaignId,
      platform: "google_ads",
      success: false,
      httpStatus: null,
      requestSummary: { blocked: true, reason: "dashboard_publish_unsupported" },
      responseSummary: {},
      errorMessage: GOOGLE_ADS_DASHBOARD_PUBLISH_BLOCKED,
    });
    return { ok: false, error: GOOGLE_ADS_DASHBOARD_PUBLISH_BLOCKED };
  }

  const readiness = await computePpcReadiness(campaign, storage);
  await storage.updatePpcCampaign(campaignId, {
    readinessScore: readiness.overallScore,
    readinessSnapshotJson: {
      scores: readiness.scores,
      blockers: readiness.blockers,
      gates: readiness.gates,
      remediationChecklist: readiness.remediationChecklist,
      package: readiness.packageRecommendation,
      growthRoute: readiness.growthRouteRecommendation,
      adReady: readiness.adReady,
    },
  });

  if (campaign.platform === "meta" && !isMetaObjectiveSupportedForDashboardPublish(campaign.objective)) {
    await setLinkedAdAccountStatus(campaign, "not_ad_ready");
    await storage.updatePpcCampaign(campaignId, {
      status: "validation_failed",
      lastSyncError: metaUnsupportedObjectiveMessage(campaign.objective),
    });
    return {
      ok: false,
      error: metaUnsupportedObjectiveMessage(campaign.objective),
      details: { unsupportedObjective: true },
    };
  }

  if (!readiness.adReady) {
    await setLinkedAdAccountStatus(campaign, "not_ad_ready");
    await storage.updatePpcCampaign(campaignId, {
      status: "validation_failed",
      lastSyncError: "Not ad ready — complete all publish gates and Foundation remediation.",
    });
    return {
      ok: false,
      error:
        "Publishing blocked: account is not ad-ready. Complete the remediation checklist, attach Communications follow-up, and re-run readiness.",
      details: {
        gates: readiness.gates,
        remediationChecklist: readiness.remediationChecklist,
        blockers: readiness.blockers,
        packageRecommendation: readiness.packageRecommendation,
        growthRouteRecommendation: readiness.growthRouteRecommendation,
      },
    };
  }

  let accountExternal = "";
  if (campaign.ppcAdAccountId) {
    const acc = (await storage.listPpcAdAccounts()).find((a) => a.id === campaign.ppcAdAccountId);
    if (!acc) return { ok: false, error: "Linked ad account record not found." };
    accountExternal = acc.externalAccountId;
  }

  await storage.updatePpcCampaign(campaignId, { status: "publishing", lastSyncError: null });

  if (campaign.platform === "meta") {
    const probe = metaConnectionProbe();
    const actId = accountExternal.replace(/^act_/i, "") || probe.adAccountId || "";
    if (!actId) {
      await storage.updatePpcCampaign(campaignId, { status: "sync_error", lastSyncError: "No Meta ad account id" });
      await setLinkedAdAccountStatus(campaign, "not_ad_ready");
      await storage.createPpcPublishLog({
        campaignId,
        platform: "meta",
        success: false,
        httpStatus: null,
        requestSummary: {},
        responseSummary: {},
        errorMessage: "Configure META_AD_ACCOUNT_ID or link a ppc_ad_accounts row.",
      });
      return { ok: false, error: "Meta ad account not configured." };
    }
    const result = await publishMetaCampaignBundle(campaign, actId);
    await storage.createPpcPublishLog({
      campaignId,
      platform: "meta",
      success: result.ok,
      httpStatus: result.ok ? 200 : 400,
      requestSummary: { adAccount: actId, campaignName: campaign.name },
      responseSummary: result.ok ? { raw: result.raw } : { error: result.details },
      errorMessage: result.ok ? null : result.error,
    });
    if (!result.ok) {
      await storage.updatePpcCampaign(campaignId, {
        status: "sync_error",
        lastSyncError: result.error,
        lastSyncedAt: new Date(),
      });
      await setLinkedAdAccountStatus(campaign, "not_ad_ready");
      return { ok: false, error: result.error, details: result.details };
    }
    await storage.updatePpcCampaign(campaignId, {
      status: campaign.publishPausedDefault === false ? "published" : "paused",
      platformCampaignId: result.campaignId,
      platformAdSetId: result.adSetId,
      lastSyncedAt: new Date(),
      lastSyncError: null,
    });
    await setLinkedAdAccountStatus(campaign, "ad_ready");
    return {
      ok: true,
      platformCampaignId: result.campaignId,
      platformAdSetId: result.adSetId,
      message: "Meta campaign and ad set created. Default paused unless you disabled publishPausedDefault.",
    };
  }

  return { ok: false, error: `Unsupported platform: ${campaign.platform}` };
}
