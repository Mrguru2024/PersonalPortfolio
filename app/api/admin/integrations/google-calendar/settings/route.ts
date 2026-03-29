import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import {
  getGoogleCalendarSettingsForUser,
  patchGoogleCalendarSettingsForUser,
} from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — calendar id target for the signed-in admin (no secrets). */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const userId = user?.id != null ? Number(user.id) : NaN;
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Could not resolve your user id." }, { status: 401 });
  }
  const { calendarId } = await getGoogleCalendarSettingsForUser(userId);
  return NextResponse.json({ calendarId });
}

/** PATCH { calendarId?: string } — which Google calendar receives Ascendra bookings for this admin (default primary). */
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const userId = user?.id != null ? Number(user.id) : NaN;
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Could not resolve your user id." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const calendarId = typeof body.calendarId === "string" ? body.calendarId.trim() : "";
  if (!calendarId) {
    return NextResponse.json({ error: "calendarId required (use primary or calendar email/id)" }, { status: 400 });
  }
  const result = await patchGoogleCalendarSettingsForUser(userId, calendarId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, calendarId });
}
