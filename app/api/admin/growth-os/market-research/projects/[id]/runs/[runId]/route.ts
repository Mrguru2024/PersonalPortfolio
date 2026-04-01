import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getMarketResearchRunDetail } from "@server/services/marketResearch/marketResearchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolved = await params;
    const projectId = Number(resolved.id);
    const runId = Number(resolved.runId);
    if (!Number.isFinite(projectId) || projectId <= 0 || !Number.isFinite(runId) || runId <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const detail = await getMarketResearchRunDetail({ projectId, runId });
    if (!detail) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/admin/growth-os/market-research/projects/[id]/runs/[runId]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
