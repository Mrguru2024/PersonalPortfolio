import { NextRequest, NextResponse } from "next/server";
import { canAccessExperimentationEngine } from "@/lib/auth-helpers";
import { getAeeExperimentById } from "@server/services/experimentation/aeeExperimentService";
import { recommendationsFromRollups, rollupVariantMetrics } from "@server/services/experimentation/aeeInsightEngine";
import { computeAeeExperimentScore0to100 } from "@server/services/experimentation/aeeScores";
import { getPpcSnapshotJoinForExperiment } from "@server/services/experimentation/aeeChannelLinkService";

export const dynamic = "force-dynamic";

/** GET /api/admin/experiments/[id] — detail, rollups, heuristic recommendations. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const workspaceKey = searchParams.get("workspace") ?? "ascendra_main";

  try {
    const detail = await getAeeExperimentById(id, workspaceKey);
    if (!detail) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const rollups = await rollupVariantMetrics(id, workspaceKey);
    const recommendations = recommendationsFromRollups(rollups);
    const experimentScore = computeAeeExperimentScore0to100(rollups);
    const ppcSnapshotJoin = await getPpcSnapshotJoinForExperiment(id);

    return NextResponse.json({
      ...detail,
      rollups,
      recommendations,
      experimentScore,
      ppcSnapshotJoin,
    });
  } catch (e) {
    console.error("experiments get", e);
    return NextResponse.json({ message: "Failed to load experiment" }, { status: 500 });
  }
}
