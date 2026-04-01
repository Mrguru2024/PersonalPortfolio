import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  listBehaviorSessionsForAdmin,
  listBehaviorSessionsVisitorHub,
  listDistinctBehaviorSessionBusinessIds,
} from "@server/services/behavior/behaviorIngestService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseDays(raw: string | null, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(90, Math.floor(n));
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  if (req.nextUrl.searchParams.get("filters") === "1") {
    const businessIds = await listDistinctBehaviorSessionBusinessIds();
    return NextResponse.json({ businessIds });
  }

  const hub = req.nextUrl.searchParams.get("hub") === "1";
  if (hub) {
    const days = parseDays(req.nextUrl.searchParams.get("days"), 7);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const untilRaw = req.nextUrl.searchParams.get("until");
    const until = untilRaw ? new Date(untilRaw) : null;
    const search = req.nextUrl.searchParams.get("q")?.trim() || null;
    const onlineOnly = req.nextUrl.searchParams.get("online") === "1";
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);
    const businessIdFilter = req.nextUrl.searchParams.get("businessId")?.trim() || null;

    const payload = await listBehaviorSessionsVisitorHub({
      since,
      until: until && !Number.isNaN(until.getTime()) ? until : null,
      search,
      onlineOnly,
      limit,
      offset,
      businessId: businessIdFilter,
    });
    return NextResponse.json(payload);
  }

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50));
  const sessions = await listBehaviorSessionsForAdmin(limit);
  return NextResponse.json(sessions);
}
