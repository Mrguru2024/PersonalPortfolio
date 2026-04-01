import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { buildClientConversionDiagnostics } from "@server/services/growthIntelligence/growthDiagnosticsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE = "private, max-age=30, stale-while-revalidate=120";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(user.id);
  const eligible = await storage.getClientPortalEligibility(userId);
  if (!eligible) {
    return NextResponse.json({ message: "Client portal not enabled for this account" }, { status: 403 });
  }
  const daysRaw = req.nextUrl.searchParams.get("days");
  const days = daysRaw ? Number(daysRaw) : undefined;
  const data = await buildClientConversionDiagnostics(userId, {
    days: days !== undefined && Number.isFinite(days) ? days : undefined,
  });
  return NextResponse.json(data, { headers: { "Cache-Control": CACHE } });
}
