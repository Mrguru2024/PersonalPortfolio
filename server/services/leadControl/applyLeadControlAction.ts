import type { IStorage } from "@server/storage";
import type { InsertCrmContact } from "@shared/crmSchema";
import type { ActivityLogType } from "@server/services/crmFoundationService";
import { logActivity } from "@server/services/crmFoundationService";
import type { CrmContact } from "@shared/crmSchema";
import { mergeLeadControlPersistedFields } from "./mergeLeadControlDerivedFields";

export type LeadControlActionPayload = {
  action:
    | "call_attempt"
    | "voicemail"
    | "email_sent"
    | "sms_sent"
    | "meeting_started"
    | "copy_contact"
    | "log_touch";
  note?: string | null;
  createdByUserId?: number | null;
};

const ACTION_TO_LOG_TYPE: Record<LeadControlActionPayload["action"], ActivityLogType> = {
  call_attempt: "lead_control_call_attempted",
  voicemail: "lead_control_voicemail_left",
  email_sent: "lead_control_email_sent",
  sms_sent: "lead_control_sms_marked",
  meeting_started: "lead_control_meeting_started",
  copy_contact: "lead_control_copy_contact",
  log_touch: "lead_control_note",
};

const ACTION_TITLES: Record<LeadControlActionPayload["action"], string> = {
  call_attempt: "Call attempt logged",
  voicemail: "Voicemail left",
  email_sent: "Email sent (logged)",
  sms_sent: "Text/SMS sent (logged)",
  meeting_started: "Meeting started / joined",
  copy_contact: "Contact details copied",
  log_touch: "Touch logged",
};

const TOUCH_ACTIONS: LeadControlActionPayload["action"][] = [
  "call_attempt",
  "voicemail",
  "email_sent",
  "sms_sent",
  "meeting_started",
  "log_touch",
];

export async function applyLeadControlAction(
  storage: IStorage,
  contactId: number,
  payload: LeadControlActionPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const contact = await storage.getCrmContactById(contactId);
  if (!contact) return { ok: false, error: "Contact not found" };

  const type = ACTION_TO_LOG_TYPE[payload.action];
  const title = ACTION_TITLES[payload.action];
  const content = payload.note?.trim() || null;

  await logActivity(storage, {
    contactId,
    type,
    title,
    content: content ?? undefined,
    metadata: { leadControlAction: payload.action },
    createdByUserId: payload.createdByUserId ?? undefined,
  });

  const patch: Partial<InsertCrmContact> = {
    lastActivityAt: new Date(),
  };

  if (TOUCH_ACTIONS.includes(payload.action) && !contact.firstResponseAt) {
    patch.firstResponseAt = new Date();
  }

  if (payload.action === "call_attempt" || payload.action === "log_touch") {
    patch.lastContactedAt = new Date();
  }

  const mergedForPriority: CrmContact = {
    ...contact,
    ...patch,
    firstResponseAt: patch.firstResponseAt ?? contact.firstResponseAt,
    lastContactedAt: patch.lastContactedAt ?? contact.lastContactedAt,
    lastActivityAt: patch.lastActivityAt ?? contact.lastActivityAt,
  };
  const orgRow = await storage.getLeadControlOrgSettings();
  const derived = mergeLeadControlPersistedFields(mergedForPriority, orgRow.config);
  patch.leadControlPriority = derived.leadControlPriority;
  patch.leadRoutingHint = derived.leadRoutingHint;

  await storage.updateCrmContact(contactId, patch);

  return { ok: true };
}
