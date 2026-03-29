import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { ensureAfnScoringConfig, getAfnScoringConfigRow, updateAfnScoringWeights } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/admin/community/scoring */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const row = await ensureAfnScoringConfig();
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET admin AFN scoring error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** PATCH /api/admin/community/scoring — body: { weights: Record<string, number> } */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const weights = body.weights;
    if (!weights || typeof weights !== "object") {
      return NextResponse.json({ error: "weights object required" }, { status: 400 });
    }
    const flat: Record<string, number> = {};
    for (const [k, v] of Object.entries(weights)) {
      if (typeof v === "number" && Number.isFinite(v)) flat[String(k).slice(0, 64)] = v;
    }
    await updateAfnScoringWeights(flat);
    const row = await getAfnScoringConfigRow();
    return NextResponse.json(row);
  } catch (e) {
    console.error("PATCH admin AFN scoring error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
