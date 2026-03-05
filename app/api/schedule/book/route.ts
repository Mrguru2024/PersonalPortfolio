import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { db } from "@server/db";
import { consultationBookings } from "@shared/schema";
import { consultationBookingSchema } from "@shared/consultationSchema";
import {
  isConsultationSlotAvailable,
  normalizeTimeZone,
  validateConsultationSlotWindow,
} from "@server/services/consultationSchedulerService";
import { emailService } from "@server/services/emailService";
import { googleCalendarService } from "@server/services/googleCalendarService";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = consultationBookingSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors?.[0];
    return NextResponse.json(
      {
        error: "Validation error",
        message: first?.message || "Invalid booking request.",
        details: parsed.error.errors,
      },
      { status: 400 }
    );
  }

  const validated = parsed.data;
  const timezone = normalizeTimeZone(validated.timezone);
  const startUtc = DateTime.fromISO(validated.startIso, { setZone: true }).toUTC();
  if (!startUtc.isValid) {
    return NextResponse.json(
      {
        error: "Validation error",
        message: "The selected start time is invalid.",
      },
      { status: 400 }
    );
  }

  const endUtc = startUtc.plus({ minutes: validated.durationMinutes });
  const nowUtc = DateTime.utc();
  if (startUtc <= nowUtc) {
    return NextResponse.json(
      {
        error: "Validation error",
        message: "Please select a future time slot.",
      },
      { status: 400 }
    );
  }

  const normalizedStartIso = startUtc.toISO();
  if (!normalizedStartIso) {
    return NextResponse.json(
      {
        error: "Validation error",
        message: "Selected start time could not be parsed.",
      },
      { status: 400 }
    );
  }

  const windowCheck = validateConsultationSlotWindow(
    startUtc,
    validated.durationMinutes
  );
  if (!windowCheck.isValid) {
    return NextResponse.json(
      {
        error: "Invalid time selection",
        message:
          windowCheck.reason ||
          "Selected time is outside allowed scheduling window.",
      },
      { status: 400 }
    );
  }

  const isAvailable = await isConsultationSlotAvailable(
    startUtc,
    validated.durationMinutes
  );
  if (!isAvailable) {
    return NextResponse.json(
      {
        error: "Slot unavailable",
        message: "That slot is no longer available. Please choose another time.",
      },
      { status: 409 }
    );
  }

  let googleCalendarEventId: string | undefined;
  let googleCalendarEventLink: string | undefined;
  try {
    const event = await googleCalendarService.createConsultationEvent({
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      company: validated.company,
      websiteUrl: validated.websiteUrl,
      topic: validated.topic,
      notes: validated.notes,
      startUtcIso: normalizedStartIso,
      endUtcIso: endUtc.toISO(),
      timezone,
    });
    googleCalendarEventId = event.eventId;
    googleCalendarEventLink = event.eventLink;
  } catch (error) {
    console.warn("Google Calendar integration failed:", error);
  }

  try {
    const [inserted] = await db
      .insert(consultationBookings)
      .values({
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        company: validated.company || null,
        websiteUrl: validated.websiteUrl || null,
        timezone,
        topic: validated.topic,
        notes: validated.notes || null,
        scheduledAt: startUtc.toJSDate(),
        endAt: endUtc.toJSDate(),
        durationMinutes: validated.durationMinutes,
        status: "booked",
        googleCalendarEventId: googleCalendarEventId || null,
        googleCalendarEventLink: googleCalendarEventLink || null,
        updatedAt: new Date(),
      })
      .returning();

    // Admin email notification for quick action and inbox visibility.
    await emailService.sendNotification({
      type: "quote",
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone || "",
        company: validated.company || "",
        projectType: "Consultation Booking",
        budget: "N/A",
        timeframe: startUtc
          .setZone(timezone)
          .toFormat("cccc, LLL d, yyyy · h:mm a ZZZZ"),
        message: [
          "New consultation booking submitted.",
          "",
          `Topic: ${validated.topic}`,
          `Duration: ${validated.durationMinutes} minutes`,
          `Client timezone: ${timezone}`,
          `Website: ${validated.websiteUrl || "Not provided"}`,
          `Google Calendar Event: ${googleCalendarEventLink || "Not created"}`,
          "",
          "Notes:",
          validated.notes || "No additional notes.",
        ].join("\n"),
      },
    });

    return NextResponse.json({
      success: true,
      bookingId: inserted.id,
      scheduledAt: normalizedStartIso,
      endAt: endUtc.toISO(),
      timezone,
      googleCalendarEventLink: googleCalendarEventLink || null,
      message:
        "Consultation scheduled successfully. Confirmation and reminders are set.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to book consultation:", message);
    return NextResponse.json(
      {
        error: "Failed to schedule consultation",
        message: "We couldn't finalize your booking. Please try again.",
      },
      { status: 500 }
    );
  }
}
