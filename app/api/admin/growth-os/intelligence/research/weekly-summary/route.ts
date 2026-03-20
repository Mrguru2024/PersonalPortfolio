import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getWeeklyOpportunitySummary } from "@server/services/growthIntelligence/researchIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey") ?? "ascendra_main";
    const summary = await getWeeklyOpportunitySummary(projectKey);
    return NextResponse.json(summary);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
