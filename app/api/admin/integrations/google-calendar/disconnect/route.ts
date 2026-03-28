import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { disconnectGoogleCalendar } from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  await disconnectGoogleCalendar();
  return NextResponse.json({ ok: true });
}
