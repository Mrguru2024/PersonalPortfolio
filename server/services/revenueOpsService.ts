import crypto from "crypto";
import type { CrmContact, RevenueOpsSettingsConfig } from "@shared/crmSchema";
import type { IStorage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { sendSms, isSmsConfigured } from "@server/services/smsService";

const TEMPLATE_DEFAULTS = {
  welcomeSmsTemplate:
    "Hi {{first_name}} — thanks for reaching out to Ascendra. Book a quick call: {{booking_link}}",
  missedCallSmsTemplate: "Sorry we missed your call — book here when ready: {{booking_link}}",
};

export async function getMergedRevenueOpsConfig(
  storage: IStorage
): Promise<RevenueOpsSettingsConfig & typeof TEMPLATE_DEFAULTS & { defaultBookingUrl: string }> {
  const row = await storage.getRevenueOpsSettings();
  return {
    welcomeSmsEnabled: false,
    missedCallSmsEnabled: false,
    defaultBookingUrl: "",
    ...TEMPLATE_DEFAULTS,
    ...row.config,
  };
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

/** Public redirect URL that logs a timeline event before sending the user to the real scheduler. */
export function buildTrackedBookingUrl(contactId: number, destinationUrl: string): string | null {
  const secret = process.env.REVENUE_OPS_BOOKING_LINK_SECRET?.trim();
  if (!secret || !destinationUrl.trim()) return destinationUrl.trim() || null;
  const sig = crypto.createHmac("sha256", secret).update(String(contactId)).digest("base64url");
  const token = `${contactId}.${sig}`;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const path = `/go/book/${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

export async function onNewCrmContactCreated(storage: IStorage, contact: CrmContact): Promise<void> {
  await sendWelcomeSmsIfEnabled(storage, contact).catch((e) => console.error("[revenueOps] welcome SMS", e));
}

export async function sendWelcomeSmsIfEnabled(storage: IStorage, contact: CrmContact): Promise<void> {
  const cfg = await getMergedRevenueOpsConfig(storage);
  if (!cfg.welcomeSmsEnabled || !isSmsConfigured()) return;
  if (!contact.phone || contact.doNotContact) return;

  const rawBooking = cfg.defaultBookingUrl?.trim() || "";
  const bookingLink = rawBooking ? buildTrackedBookingUrl(contact.id, rawBooking) ?? rawBooking : "";
  const first = contact.firstName?.trim() || contact.name.split(/\s+/)[0] || "there";
  const body = interpolate(cfg.welcomeSmsTemplate ?? TEMPLATE_DEFAULTS.welcomeSmsTemplate, {
    first_name: first,
    name: contact.name,
    booking_link: bookingLink,
  });

  const result = await sendSms(contact.phone, body);
  if (result.ok) {
    await logActivity(storage, {
      contactId: contact.id,
      accountId: contact.accountId ?? undefined,
      type: "revenue_ops_welcome_sms",
      title: "Welcome SMS sent",
      content: body.slice(0, 240),
      metadata: { channel: "twilio_sms", messageSid: result.messageSid },
    });
    await storage.updateCrmContact(contact.id, { lastContactedAt: new Date(), lastOutreachAt: new Date() });
  } else {
    await logActivity(storage, {
      contactId: contact.id,
      type: "revenue_ops_sms_outbound",
      title: "Welcome SMS failed",
      content: result.error ?? "unknown",
      metadata: { failed: true },
    });
  }
}

export async function handleInboundSms(
  storage: IStorage,
  from: string,
  body: string,
  messageSid: string
): Promise<void> {
  const contact = await storage.getCrmContactByPhoneDigits(from);
  if (!contact) return;
  await logActivity(storage, {
    contactId: contact.id,
    accountId: contact.accountId ?? undefined,
    type: "revenue_ops_sms_inbound",
    title: "Inbound SMS",
    content: body.slice(0, 500),
    metadata: { messageSid, from },
  });
  await storage.updateCrmContact(contact.id, {
    lastContactedAt: new Date(),
    lastActivityAt: new Date(),
    responseStatus: "replied",
  });
}

const MISSED_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"]);

export async function handleVoiceStatusCallback(
  storage: IStorage,
  params: {
    CallStatus?: string;
    From?: string;
    To?: string;
    CallSid?: string;
    Direction?: string;
  }
): Promise<void> {
  const status = (params.CallStatus ?? "").toLowerCase();
  if (!MISSED_STATUSES.has(status)) return;
  const direction = (params.Direction ?? "").toLowerCase();
  if (direction && direction !== "inbound") return;

  const from = params.From ?? "";
  if (!from) return;

  let contact = await storage.getCrmContactByPhoneDigits(from);
  if (!contact) {
    const digits = from.replace(/\D/g, "");
    if (digits.length < 10) return;
    const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;
    const localEmail = `phone-${digits.slice(-10)}@ascendra-call.local`;
    contact = await storage.createCrmContact({
      type: "lead",
      name: `Caller (${e164})`,
      email: localEmail,
      phone: e164,
      source: "inbound_call",
      status: "new",
    });
    await logActivity(storage, {
      contactId: contact.id,
      type: "lead_created",
      title: "Lead created from missed call",
      content: e164,
      metadata: { callSid: params.CallSid },
    });
  }

  await logActivity(storage, {
    contactId: contact.id,
    accountId: contact.accountId ?? undefined,
    type: "revenue_ops_missed_call",
    title: "Missed / unanswered call",
    content: `Status: ${status}`,
    metadata: { callSid: params.CallSid, to: params.To, from },
  });

  const cfg = await getMergedRevenueOpsConfig(storage);
  if (!cfg.missedCallSmsEnabled || !isSmsConfigured() || !contact.phone || contact.doNotContact) return;

  const rawBooking = cfg.defaultBookingUrl?.trim() || "";
  const bookingLink = rawBooking ? buildTrackedBookingUrl(contact.id, rawBooking) ?? rawBooking : "";
  const first = contact.firstName?.trim() || contact.name.split(/\s+/)[0] || "there";
  const msg = interpolate(cfg.missedCallSmsTemplate ?? TEMPLATE_DEFAULTS.missedCallSmsTemplate, {
    first_name: first,
    name: contact.name,
    booking_link: bookingLink,
  });

  const result = await sendSms(contact.phone, msg);
  if (result.ok) {
    await logActivity(storage, {
      contactId: contact.id,
      type: "revenue_ops_sms_outbound",
      title: "Missed-call SMS",
      content: msg.slice(0, 240),
      metadata: { callSid: params.CallSid, auto: true, messageSid: result.messageSid },
    });
    await storage.updateCrmContact(contact.id, { lastOutreachAt: new Date() });
  }
}

export async function sendManualSms(
  storage: IStorage,
  contact: CrmContact,
  body: string,
  createdByUserId?: number
): Promise<{ ok: boolean; error?: string }> {
  if (!contact.phone) return { ok: false, error: "Contact has no phone" };
  if (contact.doNotContact) return { ok: false, error: "Do not contact" };
  if (!isSmsConfigured()) return { ok: false, error: "SMS not configured" };
  const result = await sendSms(contact.phone, body);
  if (result.ok) {
    await logActivity(storage, {
      contactId: contact.id,
      accountId: contact.accountId ?? undefined,
      type: "revenue_ops_sms_outbound",
      title: "SMS sent (manual)",
      content: body.slice(0, 500),
      metadata: { messageSid: result.messageSid },
      createdByUserId,
    });
    await storage.updateCrmContact(contact.id, { lastContactedAt: new Date(), lastOutreachAt: new Date() });
  }
  return result;
}

export async function sendBookingLinkToContact(
  storage: IStorage,
  contact: CrmContact,
  opts?: { message?: string; urlOverride?: string },
  createdByUserId?: number
): Promise<{ ok: boolean; error?: string; url?: string }> {
  const cfg = await getMergedRevenueOpsConfig(storage);
  const raw = (opts?.urlOverride ?? cfg.defaultBookingUrl ?? "").trim();
  if (!raw) return { ok: false, error: "No booking URL configured" };
  const tracked = buildTrackedBookingUrl(contact.id, raw) ?? raw;
  const defaultMsg = `Here's my calendar to book a quick call: ${tracked}`;
  const body = (opts?.message?.trim() || defaultMsg).replace(/\{\{booking_link\}\}/g, tracked);
  if (!isSmsConfigured() || !contact.phone) {
    await logActivity(storage, {
      contactId: contact.id,
      type: "revenue_ops_booking_link_sent",
      title: "Booking link recorded (no SMS — missing phone or Twilio)",
      content: tracked,
      metadata: { url: tracked, smsSkipped: true },
      createdByUserId,
    });
    return { ok: true, url: tracked };
  }
  const result = await sendSms(contact.phone, body);
  if (!result.ok) return { ok: false, error: result.error };
  await logActivity(storage, {
    contactId: contact.id,
    accountId: contact.accountId ?? undefined,
    type: "revenue_ops_booking_link_sent",
    title: "Booking link sent via SMS",
    content: body.slice(0, 500),
    metadata: { url: tracked, messageSid: result.messageSid },
    createdByUserId,
  });
  await storage.updateCrmContact(contact.id, { lastOutreachAt: new Date() });
  return { ok: true, url: tracked };
}

export async function logDepositLinkSent(
  storage: IStorage,
  contactId: number,
  accountId: number | null | undefined,
  hostInvoiceUrl: string,
  invoiceId: number,
  createdByUserId?: number
): Promise<void> {
  await logActivity(storage, {
    contactId,
    accountId: accountId ?? undefined,
    type: "revenue_ops_deposit_link_sent",
    title: "Deposit / invoice link sent",
    content: hostInvoiceUrl,
    metadata: { invoiceId, hostInvoiceUrl },
    createdByUserId,
  });
}
