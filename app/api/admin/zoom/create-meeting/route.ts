import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { createZoomMeeting, isZoomConfigured } from "@/lib/zoom";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/zoom/create-meeting
 * Body: { topic: string; startTime: string (ISO); durationMinutes: number; timezone?: string; agenda?: string; contactId?: number }
 * Creates a Zoom meeting and optionally logs it as a CRM activity for the contact.
 * Returns: { joinUrl, startUrl, meetingId, startTime, duration, activityId? }
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    if (!isZoomConfigured()) {
      return NextResponse.json(
        { error: "Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET." },
        { status: 400 }
      );
    }
    const body = await req.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "Meeting";
    const startTime = typeof body.startTime === "string" ? body.startTime : "";
    const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : 60;
    const timezone = typeof body.timezone === "string" ? body.timezone : undefined;
    const agenda = typeof body.agenda === "string" ? body.agenda : undefined;
    const contactId = typeof body.contactId === "number" ? body.contactId : null;

    if (!startTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startTime)) {
      return NextResponse.json(
        { error: "startTime is required and must be ISO 8601 (e.g. 2025-03-20T14:00:00)" },
        { status: 400 }
      );
    }

    const result = await createZoomMeeting({
      topic,
      startTime,
      durationMinutes,
      timezone,
      agenda,
    });

    let activityId: number | null = null;
    if (contactId) {
      try {
        const activity = await storage.createCrmActivity({
          contactId,
          type: "meeting",
          subject: topic,
          body: agenda ?? null,
          metadata: {
            meetingUrl: result.joinUrl,
            startUrl: result.startUrl,
            meetingId: String(result.id),
            scheduledAt: result.startTime,
          },
        });
        activityId = activity.id;
      } catch (e) {
        console.error("CRM activity create failed after Zoom meeting:", e);
      }
    }

    return NextResponse.json({
      joinUrl: result.joinUrl,
      startUrl: result.startUrl,
      meetingId: result.id,
      startTime: result.startTime,
      duration: result.duration,
      activityId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create meeting";
    console.error("Zoom create-meeting error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
