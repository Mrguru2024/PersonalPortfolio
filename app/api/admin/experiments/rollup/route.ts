import { NextRequest, NextResponse } from "next/server";
import { canAccessExperimentationEngine } from "@/lib/auth-helpers";
import { runAeeDailyRollup } from "@server/services/experimentation/aeeRollupService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/experiments/rollup
 * Body: { from?: ISO date, to?: ISO date, workspaceKey?: string }
 * Recomputes metrics for [from, to) UTC; defaults last 7 days.
 */
export async function POST(req: NextRequest) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const to = body.to != null ? new Date(String(body.to)) : new Date();
    const from =
      body.from != null
        ? new Date(String(body.from))
        : new Date(to.getTime() - 7 * 86_400_000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return NextResponse.json({ message: "Invalid from/to" }, { status: 400 });
    }
    const workspaceKey = typeof body.workspaceKey === "string" ? body.workspaceKey : "ascendra_main";
    const result = await runAeeDailyRollup({ workspaceKey, from, to });
    return NextResponse.json(result);
  } catch (e) {
    console.error("aee rollup", e);
    return NextResponse.json({ message: "Rollup failed" }, { status: 500 });
  }
}
