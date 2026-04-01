import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listGrowthPersonaOfferPricing, upsertGrowthPersonaOfferPricing } from "@server/services/growthPersonaPricingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const rows = await listGrowthPersonaOfferPricing();
    return NextResponse.json({ personaPricing: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const personaKey = String(body.personaKey ?? "").trim();
    if (!personaKey) return NextResponse.json({ error: "personaKey required" }, { status: 400 });
    const row = await upsertGrowthPersonaOfferPricing({
      personaKey,
      label: body.label != null ? String(body.label) : null,
      dfySetupMultiplier: Number(body.dfySetupMultiplier) || 1,
      dfyMonthlyMultiplier: Number(body.dfyMonthlyMultiplier) || 1,
      dwyProgramMultiplier: Number(body.dwyProgramMultiplier) || 1,
    });
    return NextResponse.json({ personaPricing: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
