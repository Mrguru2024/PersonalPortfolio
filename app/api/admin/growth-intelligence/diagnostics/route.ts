import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { buildAdminGrowthDiagnostics } from "@server/services/growthIntelligence/growthDiagnosticsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const daysRaw = req.nextUrl.searchParams.get("days");
  const days = daysRaw ? Number(daysRaw) : 7;
  const data = await buildAdminGrowthDiagnostics(Number.isFinite(days) ? days : 7);
  return NextResponse.json(data);
}
