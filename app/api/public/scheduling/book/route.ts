import { NextRequest, NextResponse } from "next/server";
import { createBookingFromPublic } from "@server/services/schedulingService";
import { sendBookingConfirmationEmail } from "@server/services/schedulingEmailService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const bookingTypeId = typeof body.bookingTypeId === "number" ? body.bookingTypeId : parseInt(String(body.bookingTypeId), 10);
    const guestName = String(body.guestName ?? "").trim();
    const guestEmail = String(body.guestEmail ?? "").trim();
    const guestPhone = body.guestPhone != null ? String(body.guestPhone).trim() : undefined;
    const startAtIso = String(body.startAt ?? "").trim();
    const guestNotes = body.guestNotes != null ? String(body.guestNotes).trim() : undefined;

    if (!guestName || !guestEmail || !startAtIso) {
      return NextResponse.json({ error: "guestName, guestEmail, startAt required" }, { status: 400 });
    }
    if (!Number.isFinite(bookingTypeId)) {
      return NextResponse.json({ error: "bookingTypeId required" }, { status: 400 });
    }

    const result = await createBookingFromPublic({
      bookingTypeId,
      guestName,
      guestEmail,
      guestPhone,
      startAtIso,
      guestNotes,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const emailResult = await sendBookingConfirmationEmail(result.appointment);
    return NextResponse.json({
      ok: true,
      appointmentId: result.appointment.id,
      guestToken: result.appointment.guestToken,
      confirmationEmailSent: emailResult.ok,
      confirmationEmailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (e) {
    console.error("[public/scheduling/book]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
