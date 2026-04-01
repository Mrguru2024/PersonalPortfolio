import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { computePpcReadiness } from "@server/services/paid-growth/readinessEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const c = await storage.getPpcCampaignById(id);
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await computePpcReadiness(c, storage);
    await storage.updatePpcCampaign(id, {
      readinessScore: result.overallScore,
      readinessSnapshotJson: {
        scores: result.scores,
        blockers: result.blockers,
        gates: result.gates,
        remediationChecklist: result.remediationChecklist,
        package: result.packageRecommendation,
        growthRoute: result.growthRouteRecommendation,
        adReady: result.adReady,
      },
    });
    if (c.ppcAdAccountId) {
      await storage
        .updatePpcAdAccount(c.ppcAdAccountId, {
          adReadyStatus: result.adReady ? "ad_ready" : "not_ad_ready",
        })
        .catch(() => {});
    }
    const saved = await storage.createPpcReadinessAssessment({
      ppcCampaignId: id,
      scoresJson: result.scores,
      blockersJson: result.blockers,
      packageRecommendation: result.packageRecommendation,
      growthRouteRecommendation: result.growthRouteRecommendation,
      overallScore: result.overallScore,
      gatesJson: result.gates,
      remediationChecklistJson: result.remediationChecklist,
      adReady: result.adReady,
    });
    return NextResponse.json({ ...result, assessmentId: saved.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Readiness failed" }, { status: 500 });
  }
}
