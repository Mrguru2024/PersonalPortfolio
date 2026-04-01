import type { IStorage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import type { LeadControlFollowUpPreset } from "@shared/leadControlFollowUp";

export function dueAtFromFollowUpPreset(preset: LeadControlFollowUpPreset): Date {
  const d = new Date();
  const days = preset === "tomorrow" ? 1 : preset === "two_days" ? 2 : 7;
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

export async function createLeadControlQuickFollowUpTask(
  storage: IStorage,
  contactId: number,
  preset: LeadControlFollowUpPreset,
  options?: { note?: string | null; createdByUserId?: number | null },
): Promise<{ ok: true; taskId: number } | { ok: false; error: string }> {
  const contact = await storage.getCrmContactById(contactId);
  if (!contact) return { ok: false, error: "Contact not found" };

  const dueAt = dueAtFromFollowUpPreset(preset);
  const label = preset === "tomorrow" ? "Tomorrow" : preset === "two_days" ? "In 2 days" : "In 1 week";
  const title = `Follow up (${label})`;

  const task = await storage.createCrmTask({
    contactId,
    relatedDealId: null,
    relatedAccountId: null,
    type: "follow_up",
    title,
    description: options?.note?.trim() || "Scheduled from Lead Control",
    priority: "medium",
    dueAt,
    completedNotes: null,
    sequenceEnrollmentId: null,
  });

  await logActivity(storage, {
    contactId,
    taskId: task.id,
    type: "task_created",
    title: "Follow-up task (Lead Control)",
    content: `${title} — due ${dueAt.toISOString()}`,
    metadata: { leadControlFollowUpPreset: preset },
    createdByUserId: options?.createdByUserId ?? undefined,
  });

  return { ok: true, taskId: task.id };
}
