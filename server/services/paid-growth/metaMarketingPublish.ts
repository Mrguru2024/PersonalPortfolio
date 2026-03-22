import type { PpcCampaign } from "@shared/paidGrowthSchema";
import {
  isMetaObjectiveSupportedForDashboardPublish,
  metaUnsupportedObjectiveMessage,
} from "@shared/ppcBusinessRules";

function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || "v25.0";
}

function accessToken(): string | null {
  return (
    process.env.META_SYSTEM_USER_ACCESS_TOKEN?.trim() ||
    process.env.META_ACCESS_TOKEN?.trim() ||
    process.env.FACEBOOK_ACCESS_TOKEN?.trim() ||
    null
  );
}

function defaultAdAccountId(): string | null {
  const raw = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!raw) return null;
  return raw.replace(/^act_/i, "");
}

export type MetaPublishOutcome =
  | { ok: true; campaignId: string; adSetId: string; raw: Record<string, unknown> }
  | { ok: false; error: string; details?: unknown };

function metaObjective(campaign: PpcCampaign): string {
  const o = (campaign.objective || "traffic").toLowerCase();
  if (o.includes("lead")) return "OUTCOME_LEADS";
  return "OUTCOME_TRAFFIC";
}

function optimizationGoal(campaign: PpcCampaign): string {
  const o = (campaign.objective || "traffic").toLowerCase();
  if (o.includes("lead")) return "LEAD_GENERATION";
  return "LINK_CLICKS";
}

function buildLandingUrl(campaign: PpcCampaign): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://localhost:3000";
  const path = campaign.landingPagePath.startsWith("/") ? campaign.landingPagePath : `/${campaign.landingPagePath}`;
  const u = new URL(path, base);
  const t = campaign.trackingParamsJson ?? {};
  if (t.utm_source) u.searchParams.set("utm_source", t.utm_source);
  if (t.utm_medium) u.searchParams.set("utm_medium", t.utm_medium);
  if (t.utm_campaign) u.searchParams.set("utm_campaign", t.utm_campaign);
  if (t.utm_content) u.searchParams.set("utm_content", t.utm_content);
  if (t.utm_term) u.searchParams.set("utm_term", t.utm_term);
  u.searchParams.set("ascendra_ppc", String(campaign.id));
  return u.toString();
}

/**
 * Creates a paused Meta campaign + ad set (Traffic or Leads objective).
 * Creative/ad level is intentionally minimal — extend when image/video hashes are wired to your asset library.
 */
export async function publishMetaCampaignBundle(
  campaign: PpcCampaign,
  adAccountExternalId: string
): Promise<MetaPublishOutcome> {
  if (!isMetaObjectiveSupportedForDashboardPublish(campaign.objective)) {
    return { ok: false, error: metaUnsupportedObjectiveMessage(campaign.objective) };
  }
  const token = accessToken();
  if (!token) {
    return { ok: false, error: "META_SYSTEM_USER_ACCESS_TOKEN (or META_ACCESS_TOKEN) not configured." };
  }
  const act = adAccountExternalId.replace(/^act_/i, "");
  const v = graphVersion();
  const budget = Math.max(campaign.budgetDailyCents ?? 500, 100);
  const status = campaign.publishPausedDefault !== false ? "PAUSED" : "ACTIVE";

  const cUrl = `https://graph.facebook.com/${v}/act_${act}/campaigns?access_token=${encodeURIComponent(token)}`;
  const cRes = await fetch(cUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `[Ascendra] ${campaign.name}`.slice(0, 120),
      objective: metaObjective(campaign),
      status,
      special_ad_categories: [],
    }),
  });
  const cJson = (await cRes.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!cRes.ok || !cJson.id) {
    return {
      ok: false,
      error: cJson.error?.message || `Meta campaign create failed (${cRes.status})`,
      details: cJson,
    };
  }

  const targeting = campaign.locationTargetingJson ?? {};
  const countries =
    Array.isArray((targeting as { countries?: string[] }).countries) ?
      (targeting as { countries: string[] }).countries
    : ["US"];

  const aUrl = `https://graph.facebook.com/${v}/act_${act}/adsets?access_token=${encodeURIComponent(token)}`;
  const aRes = await fetch(aUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: `[Ascendra] Ad set — ${campaign.name}`.slice(0, 120),
      campaign_id: cJson.id,
      daily_budget: budget,
      billing_event: "IMPRESSIONS",
      optimization_goal: optimizationGoal(campaign),
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      status,
      targeting: { geo_locations: { countries }, publisher_platforms: ["facebook", "instagram"] },
    }),
  });
  const aJson = (await aRes.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!aRes.ok || !aJson.id) {
    return {
      ok: false,
      error: aJson.error?.message || `Meta ad set create failed (${aRes.status})`,
      details: { campaignId: cJson.id, adSet: aJson },
    };
  }

  return {
    ok: true,
    campaignId: cJson.id,
    adSetId: aJson.id,
    raw: {
      campaign: cJson,
      adSet: aJson,
      landingUrl: buildLandingUrl(campaign),
      note:
        "Campaign + ad set created paused/active per Ascendra setting. Complete ads/creatives in Ads Manager or extend publisher with creative IDs.",
    },
  };
}

export function metaConnectionProbe(): { configured: boolean; message: string; adAccountId: string | null } {
  const token = accessToken();
  const act = defaultAdAccountId();
  if (!token) return { configured: false, message: "No Meta access token in env.", adAccountId: act };
  if (!act) return { configured: false, message: "META_AD_ACCOUNT_ID not set.", adAccountId: null };
  return { configured: true, message: "Token and ad account id present (validate with test publish).", adAccountId: act };
}
