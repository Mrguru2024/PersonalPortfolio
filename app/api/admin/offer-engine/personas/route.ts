import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listMarketingPersonas } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/offer-engine/personas — full persona rows including Offer Engine strategy layer */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const personas = await listMarketingPersonas();
    return NextResponse.json({ personas });
  } catch (e) {
    console.error("[GET offer-engine/personas]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
