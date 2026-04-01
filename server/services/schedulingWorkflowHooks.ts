/**
 * Fires CRM workflow engine triggers for scheduler lifecycle events.
 */

import type { SchedulingAppointment } from "@shared/schedulingSchema";
import { storage } from "@server/storage";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";
import type { WorkflowPayload } from "@server/services/workflows/types";

export type SchedulingWorkflowTrigger =
  | "appointment_booked"
  | "appointment_cancelled"
  | "appointment_completed"
  | "appointment_no_show";

export const SCHEDULER_WORKFLOW_TRIGGER_TYPES: SchedulingWorkflowTrigger[] = [
  "appointment_booked",
  "appointment_cancelled",
  "appointment_completed",
  "appointment_no_show",
];

export async function buildAppointmentWorkflowPayload(
  appt: SchedulingAppointment,
  extras?: { bookingTypeName?: string | null },
): Promise<WorkflowPayload> {
  const bookingTypeName = extras?.bookingTypeName ?? undefined;
  if (appt.contactId != null) {
    const base = await buildPayloadFromContactId(storage, appt.contactId);
    return {
      ...base,
      appointmentId: appt.id,
      appointmentGuestName: appt.guestName,
      appointmentGuestEmail: appt.guestEmail,
      bookingTypeName,
    };
  }
  return {
    appointmentId: appt.id,
    appointmentGuestName: appt.guestName,
    appointmentGuestEmail: appt.guestEmail,
    bookingTypeName,
    formSource: appt.bookingSource ?? undefined,
  };
}

export async function fireAppointmentWorkflows(
  trigger: SchedulingWorkflowTrigger,
  appt: SchedulingAppointment,
  extras?: { bookingTypeName?: string | null },
): Promise<void> {
  try {
    const payload = await buildAppointmentWorkflowPayload(appt, extras);
    await fireWorkflows(storage, trigger, payload);
  } catch (e) {
    console.error("[scheduling] workflow fire failed", trigger, e);
  }
}
