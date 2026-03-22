import { formatInTimeZone } from "date-fns-tz";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { sendBrevoTransactional } from "@server/services/communications/brevoTransactional";
import { schedulingAppointments, schedulingBookingTypes, schedulingGlobalSettings } from "@shared/schedulingSchema";
import type { SchedulingAppointment } from "@shared/schedulingSchema";

function baseAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") || "";
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export async function buildTemplateVars(appt: SchedulingAppointment, bookingTypeName: string): Promise<Record<string, string>> {
  const [settings] = await db.select().from(schedulingGlobalSettings).where(eq(schedulingGlobalSettings.id, 1)).limit(1);
  const tz = settings?.businessTimezone || "America/New_York";
  const start = new Date(appt.startAt);
  const end = new Date(appt.endAt);
  const base = baseAppUrl();
  const manageUrl = base ? `${base}/book/manage/${appt.guestToken}` : `/book/manage/${appt.guestToken}`;
  return {
    guest_name: appt.guestName,
    guest_email: appt.guestEmail,
    booking_type: bookingTypeName,
    start_display: formatInTimeZone(start, tz, "EEEE, MMM d, yyyy h:mm a zzz"),
    end_display: formatInTimeZone(end, tz, "h:mm a zzz"),
    manage_url: manageUrl,
  };
}

const DEFAULT_CONFIRM_SUBJECT = "Your Ascendra meeting is confirmed";
const DEFAULT_CONFIRM_HTML = `<p>Hi {{guest_name}},</p>
<p>Your <strong>{{booking_type}}</strong> is confirmed for <strong>{{start_display}}</strong>.</p>
<p><a href="{{manage_url}}">View details or cancel</a></p>
<p>— Ascendra Technologies</p>`;

const DEFAULT_REMINDER_SUBJECT = "Reminder: upcoming meeting with Ascendra";
const DEFAULT_REMINDER_HTML = `<p>Hi {{guest_name}},</p>
<p>This is a friendly reminder: your <strong>{{booking_type}}</strong> starts at <strong>{{start_display}}</strong>.</p>
<p><a href="{{manage_url}}">Open your booking</a></p>`;

export async function sendBookingConfirmationEmail(appt: SchedulingAppointment): Promise<{ ok: boolean; error?: string }> {
  const [settings] = await db.select().from(schedulingGlobalSettings).where(eq(schedulingGlobalSettings.id, 1)).limit(1);
  const [bt] = await db.select().from(schedulingBookingTypes).where(eq(schedulingBookingTypes.id, appt.bookingTypeId)).limit(1);
  const vars = await buildTemplateVars(appt, bt?.name ?? "Meeting");
  const subject = interpolate(
    settings?.confirmationEmailSubject?.trim() || DEFAULT_CONFIRM_SUBJECT,
    vars,
  );
  const html = interpolate(settings?.confirmationEmailHtml?.trim() || DEFAULT_CONFIRM_HTML, vars);
  const res = await sendBrevoTransactional({
    to: appt.guestEmail,
    subject,
    htmlContent: html,
  });
  if (!res.ok) return { ok: false, error: res.error };
  await db
    .update(schedulingAppointments)
    .set({ confirmationSentAt: new Date(), updatedAt: new Date() })
    .where(eq(schedulingAppointments.id, appt.id));
  return { ok: true };
}

export async function sendBookingReminderEmail(appt: SchedulingAppointment): Promise<{ ok: boolean; error?: string }> {
  const [settings] = await db.select().from(schedulingGlobalSettings).where(eq(schedulingGlobalSettings.id, 1)).limit(1);
  const [bt] = await db.select().from(schedulingBookingTypes).where(eq(schedulingBookingTypes.id, appt.bookingTypeId)).limit(1);
  const vars = await buildTemplateVars(appt, bt?.name ?? "Meeting");
  const subject = interpolate(settings?.reminderEmailSubject?.trim() || DEFAULT_REMINDER_SUBJECT, vars);
  const html = interpolate(settings?.reminderEmailHtml?.trim() || DEFAULT_REMINDER_HTML, vars);
  const res = await sendBrevoTransactional({
    to: appt.guestEmail,
    subject,
    htmlContent: html,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
