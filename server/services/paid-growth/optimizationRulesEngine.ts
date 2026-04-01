import type { IStorage } from "@server/storage";
import { getPpcEngineModuleConfig, parseCampaignModel } from "@shared/ppcCampaignModel";

/** Minimum recent spend (cents) before flagging waste when no qualified leads exist. */
const SPEND_NO_QUALIFIED_LEADS_CENTS = 5_000;

/** Minimum classified leads before evaluating spam rate. */
const MIN_LEADS_FOR_SPAM_RULE = 6;

/** Minimum impressions before low-CTR heuristic. */
const MIN_IMPRESSIONS_CTR_RULE = 800;

/**
 * Rules-based optimization sweep. Persists rows in `ppc_optimization_recommendations`.
 * Does not call external ad APIs. Safe to run from cron or admin "Refresh" action.
 */
export async function runPpcOptimizationRulesSweep(storage: IStorage): Promise<{
  rulesEvaluated: number;
  upserts: number;
}> {
  const campaigns = await storage.listPpcCampaigns();
  let upserts = 0;
  let rulesEvaluated = 0;

  for (const c of campaigns) {
    const engine = getPpcEngineModuleConfig(parseCampaignModel(c.campaignModel));
    const snapshotRows = Math.min(90, Math.max(14, engine.optimizationLookbackDays));
    const snaps = await storage.listPpcPerformanceSnapshots(c.id, snapshotRows);
    const spendCents = snaps.reduce((s, x) => s + (x.spendCents ?? 0), 0);
    const clicks = snaps.reduce((s, x) => s + (x.clicks ?? 0), 0);

    let impressionsSum = 0;
    let ctrWeightedNum = 0;
    for (const s of snaps) {
      const im = s.impressions ?? 0;
      impressionsSum += im;
      if (s.ctr != null && im > 0) {
        ctrWeightedNum += s.ctr * im;
      }
    }
    const avgCtr = impressionsSum > 0 ? ctrWeightedNum / impressionsSum : null;

    const leads = await storage.listPpcLeadQualityForCampaign(c.id, 200);
    const qualified = leads.filter((l) => l.leadValid && !l.spamFlag);
    const bookedOrSold = leads.filter((l) => l.bookedCall || l.sold);

    const activeish =
      c.status === "published" || c.status === "paused" || c.status === "approved" || c.status === "ready_for_review";

    rulesEvaluated += 1;
    if (
      activeish &&
      spendCents >= SPEND_NO_QUALIFIED_LEADS_CENTS &&
      qualified.length === 0 &&
      clicks >= 3
    ) {
      await storage.upsertPpcOptimizationRecommendation({
        campaignId: c.id,
        ruleKey: "high_spend_no_qualified_leads",
        severity: "critical",
        status: "open",
        title: "Spend without qualified leads",
        detail:
          "Recent performance snapshots show paid clicks and spend, but no qualified (non-spam) CRM leads are attributed to this campaign. Pause or narrow targeting, verify landing + form tracking, and confirm UTMs match before scaling.",
        evidenceJson: { spendCents, clicks, qualifiedCount: 0, snapshotRows: snaps.length },
      });
      upserts += 1;
    }

    rulesEvaluated += 1;
    if (qualified.length >= 8) {
      const rate = bookedOrSold.length / qualified.length;
      if (rate >= 0.35 && spendCents > 0) {
        await storage.upsertPpcOptimizationRecommendation({
          campaignId: c.id,
          ruleKey: "strong_lead_to_booking_rate",
          severity: "info",
          status: "open",
          title: "Strong lead-to-booking / win rate",
          detail:
            "A healthy share of qualified leads are booking or marked sold. Consider controlled budget expansion or duplicating the best ad group with tighter keyword themes.",
          evidenceJson: {
            qualified: qualified.length,
            bookedOrSold: bookedOrSold.length,
            rate: Math.round(rate * 100) / 100,
            spendCents,
          },
        });
        upserts += 1;
      }
    }

    rulesEvaluated += 1;
    if (leads.length >= MIN_LEADS_FOR_SPAM_RULE) {
      const spamN = leads.filter((l) => l.spamFlag).length;
      const spamRate = spamN / leads.length;
      if (spamRate > 0.18) {
        await storage.upsertPpcOptimizationRecommendation({
          campaignId: c.id,
          ruleKey: "elevated_spam_or_invalid_rate",
          severity: "warning",
          status: "open",
          title: "Elevated spam or invalid lead rate",
          detail:
            "Many PPC-attributed leads are flagged spam or invalid. Tighten form validation, exclusions, and landing promise before increasing spend.",
          evidenceJson: { spamRate: Math.round(spamRate * 100) / 100, sampleSize: leads.length },
        });
        upserts += 1;
      }
    }

    rulesEvaluated += 1;
    if (impressionsSum >= MIN_IMPRESSIONS_CTR_RULE && avgCtr != null && avgCtr < 0.008 && activeish) {
      await storage.upsertPpcOptimizationRecommendation({
        campaignId: c.id,
        ruleKey: "low_ctr_review_creative_or_keywords",
        severity: "warning",
        status: "open",
        title: "Low CTR — review creative and keyword fit",
        detail:
          "Impression-weighted CTR is soft versus typical search benchmarks. Test new headlines/value props, verify keyword intent, and confirm the landing headline matches the ad promise.",
        evidenceJson: {
          impressions: impressionsSum,
          avgCtr: Math.round(avgCtr * 10000) / 10000,
        },
      });
      upserts += 1;
    }
  }

  return { rulesEvaluated, upserts };
}
