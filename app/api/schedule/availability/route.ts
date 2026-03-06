import { NextRequest, NextResponse } from "next/server";
import {
  consultationAvailabilityQuerySchema,
  DEFAULT_CONSULTATION_DURATION,
} from "@shared/consultationSchema";
import {
  getConsultationAvailability,
  normalizeTimeZone,
} from "@server/services/consultationSchedulerService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = consultationAvailabilityQuerySchema.safeParse(query);

  if (!parsed.success) {
    const first = parsed.error.errors?.[0];
    return NextResponse.json(
      {
        error: "Validation error",
        message: first?.message || "Invalid availability query parameters.",
        details: parsed.error.errors,
      },
      { status: 400 }
    );
  }

  const timezone = normalizeTimeZone(parsed.data.timezone);
  const durationMinutes =
    parsed.data.durationMinutes || DEFAULT_CONSULTATION_DURATION;

  try {
    const result = await getConsultationAvailability({
      date: parsed.data.date,
      timezone,
      durationMinutes,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch scheduling availability:", message);
    return NextResponse.json(
      {
        error: "Failed to fetch availability",
        message: "Unable to load available time slots. Please try again.",
      },
      { status: 500 }
    );
  }
}
