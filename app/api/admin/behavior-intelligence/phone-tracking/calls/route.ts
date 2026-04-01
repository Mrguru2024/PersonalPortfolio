import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listCallLogsForAdmin } from "@server/services/behavior/behaviorPhoneTrackingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 100;
  const sinceDaysRaw = req.nextUrl.searchParams.get("sinceDays");
  const sinceDays =
    sinceDaysRaw != null && sinceDaysRaw !== "" ? Number(sinceDaysRaw) : undefined;
  const rows = await listCallLogsForAdmin(limit, sinceDays);
  return NextResponse.json(rows);
}
