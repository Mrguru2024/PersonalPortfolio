import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getSchedulingSettings, updateSchedulingSettings } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const settings = await getSchedulingSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const settings = await updateSchedulingSettings({
    businessTimezone: typeof body.businessTimezone === "string" ? body.businessTimezone : undefined,
    slotStepMinutes: typeof body.slotStepMinutes === "number" ? body.slotStepMinutes : undefined,
    minNoticeHours: typeof body.minNoticeHours === "number" ? body.minNoticeHours : undefined,
    maxDaysAhead: typeof body.maxDaysAhead === "number" ? body.maxDaysAhead : undefined,
    publicBookingEnabled: typeof body.publicBookingEnabled === "boolean" ? body.publicBookingEnabled : undefined,
    aiAssistantEnabled: typeof body.aiAssistantEnabled === "boolean" ? body.aiAssistantEnabled : undefined,
    confirmationEmailSubject: body.confirmationEmailSubject != null ? String(body.confirmationEmailSubject) : undefined,
    confirmationEmailHtml: body.confirmationEmailHtml != null ? String(body.confirmationEmailHtml) : undefined,
    reminderEmailSubject: body.reminderEmailSubject != null ? String(body.reminderEmailSubject) : undefined,
    reminderEmailHtml: body.reminderEmailHtml != null ? String(body.reminderEmailHtml) : undefined,
    reminderOffsetsMinutes: Array.isArray(body.reminderOffsetsMinutes) ? body.reminderOffsetsMinutes.map(Number) : undefined,
    cancellationPolicyHtml: body.cancellationPolicyHtml != null ? String(body.cancellationPolicyHtml) : undefined,
  });
  return NextResponse.json({ settings });
}
