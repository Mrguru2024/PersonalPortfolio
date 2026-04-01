import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  listHeatmapPagesSummary,
  listHeatmapPointsForPage,
} from "@server/services/behavior/behaviorAdminService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const page = req.nextUrl.searchParams.get("page")?.trim();

  if (page) {
    const limit = Math.min(20_000, Math.max(100, Number(req.nextUrl.searchParams.get("limit")) || 5000));
    const points = await listHeatmapPointsForPage(page, since, limit);
    return NextResponse.json({ page, since: since.toISOString(), points });
  }

  const summaryLimit = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 50));
  const pages = await listHeatmapPagesSummary(since, summaryLimit);
  return NextResponse.json({ since: since.toISOString(), pages });
}
