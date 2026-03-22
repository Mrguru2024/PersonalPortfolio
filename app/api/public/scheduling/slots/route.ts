import { NextRequest, NextResponse } from "next/server";
import { computeAvailableSlots, getSchedulingSettings } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const settings = await getSchedulingSettings();
    if (!settings.publicBookingEnabled) {
      return NextResponse.json({ error: "Booking disabled" }, { status: 403 });
    }
    const date = req.nextUrl.searchParams.get("date");
    const typeId = req.nextUrl.searchParams.get("typeId");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date=YYYY-MM-DD required" }, { status: 400 });
    }
    const tid = typeId ? parseInt(typeId, 10) : NaN;
    if (!Number.isFinite(tid)) {
      return NextResponse.json({ error: "typeId required" }, { status: 400 });
    }
    const slots = await computeAvailableSlots(date, tid);
    return NextResponse.json({ date, typeId: tid, slots });
  } catch (e) {
    console.error("[public/scheduling/slots]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
