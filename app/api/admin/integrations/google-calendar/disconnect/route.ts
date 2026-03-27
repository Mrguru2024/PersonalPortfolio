import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { disconnectGoogleCalendar } from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Sign in with the site owner account." }, { status: 403 });
  }
  await disconnectGoogleCalendar();
  return NextResponse.json({ ok: true });
}
