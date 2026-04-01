import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { leadQualityGuidanceFromRows } from "@server/services/paid-growth/paidGrowthRecommendations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaigns = await storage.listPpcCampaigns();
    const active = campaigns.filter((c) => c.status === "published" || c.status === "paused" || c.status === "publishing");
    let spendHint = 0;
    let impressionsSum = 0;
    let clicksSum = 0;
    let ctrWeightedNum = 0;
    let ctrWeightedDen = 0;
    let cpcSamples: number[] = [];

    for (const c of campaigns) {
      const snaps = await storage.listPpcPerformanceSnapshots(c.id, 3);
      for (const s of snaps) {
        spendHint += s.spendCents ?? 0;
        impressionsSum += s.impressions ?? 0;
        clicksSum += s.clicks ?? 0;
        if (s.ctr != null && (s.impressions ?? 0) > 0) {
          ctrWeightedNum += s.ctr * (s.impressions ?? 0);
          ctrWeightedDen += s.impressions ?? 0;
        }
        if (s.cpcCents != null && s.cpcCents > 0) cpcSamples.push(s.cpcCents);
      }
    }

    const leadsQ = await storage.listPpcLeadQuality(60);
    const qualified = leadsQ.filter((l) => l.leadValid && !l.spamFlag).length;
    const booked = leadsQ.filter((l) => l.bookedCall).length;
    const sold = leadsQ.filter((l) => l.sold).length;
    const cpqlCents = qualified > 0 && spendHint > 0 ? Math.round(spendHint / qualified) : null;
    const leadToOppRate = qualified > 0 ? sold / qualified : null;

    const last30 = leadsQ.filter((l) => {
      const t = new Date(l.updatedAt).getTime();
      return Date.now() - t < 30 * 86400000;
    });
    const prev30 = leadsQ.filter((l) => {
      const t = new Date(l.updatedAt).getTime();
      const age = Date.now() - t;
      return age >= 30 * 86400000 && age < 60 * 86400000;
    });
    const avgFit = (arr: typeof leadsQ) => {
      const withFit = arr.filter((x) => x.fitScore != null);
      if (withFit.length === 0) return null;
      return withFit.reduce((s, x) => s + (x.fitScore ?? 0), 0) / withFit.length;
    };
    const qualityTrend =
      avgFit(last30) != null && avgFit(prev30) != null ?
        (avgFit(last30)! > avgFit(prev30)! ? "up" : avgFit(last30)! < avgFit(prev30)! ? "down" : "flat")
      : null;

    const syncIssues = campaigns.filter((c) => c.status === "sync_error" || c.lastSyncError).slice(0, 8);
    const optimizationHints = leadQualityGuidanceFromRows(leadsQ);
    const persistedOptimization = await storage.listPpcOptimizationRecommendations(undefined, ["open"]);

    const avgCtr = ctrWeightedDen > 0 ? ctrWeightedNum / ctrWeightedDen : null;
    const avgCpcCents =
      cpcSamples.length > 0 ?
        Math.round(cpcSamples.reduce((a, b) => a + b, 0) / cpcSamples.length)
      : null;

    return NextResponse.json({
      primary: {
        qualifiedLeads: qualified,
        bookedCalls: booked,
        costPerQualifiedLeadCents: cpqlCents,
        leadToOpportunityRate: leadToOppRate,
        leadQualityTrend: qualityTrend,
      },
      secondary: {
        impressions: impressionsSum,
        clicks: clicksSum,
        ctr: avgCtr,
        cpcCents: avgCpcCents,
      },
      totals: {
        campaigns: campaigns.length,
        activeCampaigns: active.length,
        spendCentsSample: spendHint,
        leadQualityRows: leadsQ.length,
      },
      optimizationHints,
      persistedOptimization: persistedOptimization.slice(0, 30),
      recentCampaigns: campaigns.slice(0, 12),
      syncIssues,
      recentLeadQuality: leadsQ.slice(0, 15),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Dashboard failed" }, { status: 500 });
  }
}
