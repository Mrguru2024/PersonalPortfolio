import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { buildFunnelBlueprintMetrics } from "@server/services/growthEngine/funnelBlueprintMetricsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const key = req.nextUrl.searchParams.get("key")?.trim() || "startup";
  const daysRaw = req.nextUrl.searchParams.get("days");
  const days = daysRaw != null ? Number(daysRaw) : 30;
  const data = await buildFunnelBlueprintMetrics(key, Number.isFinite(days) ? days : 30);
  return NextResponse.json(data);
}
