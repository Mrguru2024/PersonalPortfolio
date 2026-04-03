import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import {
  buildBookingConfirmationTemplate,
  buildLeadNotificationTemplate,
  buildProposalNotificationTemplate,
  buildTestEmailTemplate,
} from "./emailTemplates";
import {
  getIonosCredentials,
  getIonosFromName,
  getIonosSmtpConfig,
  isIonosMailboxConfigured,
} from "./ionosEnv";

function createTransport() {
  const { email, password } = getIonosCredentials();
  const { host, port } = getIonosSmtpConfig();
  if (!email || !password) {
    throw new Error("IONOS_EMAIL and IONOS_PASSWORD must be set for SMTP.");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user: email, pass: password },
    requireTLS: true,
  });
}

export type IonosSendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Overrides default From (still uses IONOS SMTP auth user). */
  from?: { name: string; email: string };
  replyTo?: string | { address: string; name?: string };
  cc?: string | string[];
  bcc?: string | string[];
};

/**
 * Raw send — prefer higher-level helpers for product emails.
 */
export async function sendIonosEmail(
  input: IonosSendEmailInput,
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  if (!isIonosMailboxConfigured()) {
    return { ok: false, error: "IONOS mailbox is not configured (missing IONOS_EMAIL / IONOS_PASSWORD)." };
  }
  const { email } = getIonosCredentials();
  if (!email) {
    return { ok: false, error: "IONOS_EMAIL is not set." };
  }

  const fromName = getIonosFromName();
  const fromLine = input.from
    ? `"${input.from.name.replace(/"/g, "")}" <${input.from.email.trim()}>`
    : `"${fromName.replace(/"/g, "")}" <${email}>`;
  const mail: Mail.Options = {
    from: fromLine,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text?.trim() || input.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  };
  if (input.replyTo) {
    if (typeof input.replyTo === "string") {
      mail.replyTo = input.replyTo;
    } else {
      const name = input.replyTo.name?.trim();
      mail.replyTo = name
        ? { address: input.replyTo.address, name }
        : input.replyTo.address;
    }
  }
  if (input.cc) mail.cc = input.cc;
  if (input.bcc) mail.bcc = input.bcc;

  try {
    const transport = createTransport();
    const info = await transport.sendMail(mail);
    const messageId = typeof info.messageId === "string" ? info.messageId : String(info.messageId ?? "");
    return { ok: true, messageId: messageId || "unknown" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SMTP send failed";
    console.error("[ionosSmtp]", msg);
    return { ok: false, error: msg };
  }
}

export async function sendIonosTestEmail(toAddress?: string): Promise<
  { ok: true; messageId: string; to: string } | { ok: false; error: string }
> {
  const { email } = getIonosCredentials();
  if (!email) return { ok: false, error: "IONOS_EMAIL is not set." };
  const to = (toAddress?.trim() || email).toLowerCase();
  const tpl = buildTestEmailTemplate({ sentAtIso: new Date().toISOString() });
  const r = await sendIonosEmail({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
  if (!r.ok) return r;
  return { ok: true, messageId: r.messageId, to };
}

export async function sendIonosLeadNotificationEmail(input: {
  summary: string;
  leadName: string;
  leadEmail: string;
  source?: string | null;
  /** Optional extra ops recipients */
  bcc?: string[];
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const { email } = getIonosCredentials();
  if (!email) return { ok: false, error: "IONOS_EMAIL is not set." };
  const admin = process.env.ADMIN_EMAIL?.trim() || email;
  const tpl = buildLeadNotificationTemplate({
    leadName: input.leadName,
    leadEmail: input.leadEmail,
    summary: input.summary,
    source: input.source,
  });
  return sendIonosEmail({
    to: admin,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    replyTo: input.leadEmail,
    bcc: input.bcc?.length ? input.bcc : undefined,
  });
}

export async function sendIonosBookingConfirmationEmail(input: {
  attendeeName: string;
  attendeeEmail: string;
  whenLabel: string;
  details?: string | null;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const tpl = buildBookingConfirmationTemplate(input);
  return sendIonosEmail({
    to: input.attendeeEmail.trim(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendIonosProposalNotificationEmail(input: {
  recipientEmail: string;
  recipientName: string;
  proposalLabel: string;
  link?: string | null;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const tpl = buildProposalNotificationTemplate({
    recipientName: input.recipientName,
    proposalLabel: input.proposalLabel,
    link: input.link,
  });
  return sendIonosEmail({
    to: input.recipientEmail.trim(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}
