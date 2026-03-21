import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listMarketingPersonas } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/ascendra-intelligence/personas */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const personas = await listMarketingPersonas();
    return NextResponse.json({ personas });
  } catch (e) {
    console.error("[GET ascendra-intelligence/personas]", e);
    return NextResponse.json({ error: "Failed to list personas" }, { status: 500 });
  }
}
