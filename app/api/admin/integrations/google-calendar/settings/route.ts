import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { schedulingIntegrationConfigs } from "@shared/schedulingSchema";
import { getGoogleCalendarIntegrationRow } from "@server/services/googleCalendarSchedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — calendar id target (no secrets). */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const row = await getGoogleCalendarIntegrationRow();
  const cfg = (row?.configJson || {}) as { calendarId?: string };
  return NextResponse.json({ calendarId: cfg.calendarId?.trim() || "primary" });
}

/** PATCH { calendarId?: string } — which Google calendar receives Ascendra bookings (default primary). */
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const calendarId = typeof body.calendarId === "string" ? body.calendarId.trim() : "";
  if (!calendarId) {
    return NextResponse.json({ error: "calendarId required (use primary or calendar email/id)" }, { status: 400 });
  }
  const row = await getGoogleCalendarIntegrationRow();
  if (!row) {
    return NextResponse.json({ error: "Connect Google Calendar first." }, { status: 400 });
  }
  const prev = (row.configJson || {}) as Record<string, unknown>;
  await db
    .update(schedulingIntegrationConfigs)
    .set({
      configJson: { ...prev, calendarId },
      updatedAt: new Date(),
    })
    .where(eq(schedulingIntegrationConfigs.id, row.id));
  return NextResponse.json({ ok: true, calendarId });
}
