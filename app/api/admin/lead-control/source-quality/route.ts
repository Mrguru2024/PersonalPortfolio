import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getLeadSourceQualityStats } from "@server/services/leadControl/sourceQualityStats";

export const dynamic = "force-dynamic";

/** GET — channel rollup: volume vs high-intent rate (admin). */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const lim = searchParams.get("limit");
    const limit = lim != null && Number.isFinite(Number(lim)) ? Number(lim) : 30;
    const channels = await getLeadSourceQualityStats(limit);
    return NextResponse.json({ channels });
  } catch (e) {
    console.error("[GET lead-control/source-quality]", e);
    return NextResponse.json({ message: "Failed to load source stats" }, { status: 500 });
  }
}
