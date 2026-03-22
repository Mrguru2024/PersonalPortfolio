import { eq, isNull, lte, and } from "drizzle-orm";
import { db } from "@server/db";
import { schedulingAppointments, schedulingReminderJobs } from "@shared/schedulingSchema";
import { sendBookingReminderEmail } from "@server/services/schedulingEmailService";

/** Process due reminder jobs (email). Call from cron with auth. */
export async function processDueSchedulingReminders(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  const due = await db
    .select()
    .from(schedulingReminderJobs)
    .where(and(isNull(schedulingReminderJobs.processedAt), lte(schedulingReminderJobs.runAt, now)))
    .limit(50);

  let processed = 0;
  let errors = 0;

  for (const job of due) {
    const [appt] = await db.select().from(schedulingAppointments).where(eq(schedulingAppointments.id, job.appointmentId)).limit(1);
    if (!appt || appt.status === "cancelled") {
      await db
        .update(schedulingReminderJobs)
        .set({ processedAt: now, lastError: "skipped_cancelled_or_missing" })
        .where(eq(schedulingReminderJobs.id, job.id));
      processed++;
      continue;
    }
    if (job.channel === "email") {
      const r = await sendBookingReminderEmail(appt);
      if (r.ok) {
        await db.update(schedulingReminderJobs).set({ processedAt: now, lastError: null }).where(eq(schedulingReminderJobs.id, job.id));
        processed++;
      } else {
        await db
          .update(schedulingReminderJobs)
          .set({ lastError: r.error ?? "send_failed" })
          .where(eq(schedulingReminderJobs.id, job.id));
        errors++;
      }
    } else {
      await db
        .update(schedulingReminderJobs)
        .set({ processedAt: now, lastError: "unsupported_channel" })
        .where(eq(schedulingReminderJobs.id, job.id));
      processed++;
    }
  }

  return { processed, errors };
}
