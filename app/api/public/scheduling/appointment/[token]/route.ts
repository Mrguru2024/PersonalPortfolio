import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { getAppointmentByGuestToken, getSchedulingSettings } from "@server/services/schedulingService";
import { schedulingBookingTypes } from "@shared/schedulingSchema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const appt = await getAppointmentByGuestToken(token);
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [bt] = await db.select().from(schedulingBookingTypes).where(eq(schedulingBookingTypes.id, appt.bookingTypeId)).limit(1);
    const settings = await getSchedulingSettings();
    return NextResponse.json({
      appointment: {
        guestName: appt.guestName,
        guestEmail: appt.guestEmail,
        status: appt.status,
        startAt: appt.startAt,
        endAt: appt.endAt,
        bookingTypeName: bt?.name ?? "Meeting",
        timezone: settings.businessTimezone,
      },
    });
  } catch (e) {
    console.error("[public/scheduling/appointment]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
