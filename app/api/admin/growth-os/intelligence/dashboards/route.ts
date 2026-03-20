import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getLeadGenerationDashboard,
  getContentPerformanceDashboard,
  getOperationalDashboard,
} from "@server/services/growthIntelligence/dashboardService";
import { getGrowthIntelligenceMode } from "@server/services/growthIntelligence/growthIntelligenceConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey") ?? "ascendra_main";
    const [leadGen, content, operational] = await Promise.all([
      getLeadGenerationDashboard(projectKey),
      getContentPerformanceDashboard(projectKey),
      getOperationalDashboard(projectKey),
    ]);
    return NextResponse.json({
      projectKey,
      intelligenceMode: getGrowthIntelligenceMode(),
      leadGeneration: leadGen,
      contentPerformance: content,
      operational,
    });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
