import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET — list optimization recommendations (optional ?campaignId= & statuses=open,applied) */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const statusesParam = searchParams.get("statuses");
    const statuses =
      statusesParam
        ? statusesParam.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const rows = await storage.listPpcOptimizationRecommendations(
      campaignId != null && campaignId !== "" ? Number(campaignId) : undefined,
      statuses,
    );
    return NextResponse.json({ recommendations: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list optimization items" }, { status: 500 });
  }
}
