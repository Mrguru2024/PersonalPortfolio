import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { compareMarketResearchRuns } from "@server/services/marketResearch/marketResearchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden", message: "Admin access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return NextResponse.json({ error: "Validation", message: "Invalid project id" }, { status: 400 });
    }

    const runIdsRaw = req.nextUrl.searchParams.getAll("runId");
    const runIds = runIdsRaw
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 2);
    const comparison = await compareMarketResearchRuns({
      projectId,
      runIds: runIds.length ? runIds : undefined,
    });
    if (!comparison) {
      return NextResponse.json(
        { error: "Not found", message: "At least two completed runs are required for comparison." },
        { status: 404 },
      );
    }

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("[GET /api/admin/growth-os/market-research/projects/[id]/compare]", error);
    return NextResponse.json({ error: "Server error", message: "Failed to compare runs" }, { status: 500 });
  }
}
