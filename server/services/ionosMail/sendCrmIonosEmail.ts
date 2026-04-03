import { and, eq } from "drizzle-orm";
import { db } from "@server/db";
import { users } from "@shared/schema";
import type { CrmContact } from "@shared/crmSchema";
import { storage } from "@server/storage";
import {
  displayNameForAuthorizedSender,
  resolveFromForSendAs,
  senderRowIsSendable,
  type AuthorizedSenderUser,
} from "@/lib/email/getSender";
import { resolveReplyToForLead } from "@/lib/email/getReplyTo";
import {
  getDefaultReplyToFallbackEmail,
  getOutboundAllowedDomain,
  getPrimarySenderConfig,
} from "./outboundEnv";
import { sendIonosEmail } from "./ionosSmtpService";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainBodyToEmailHtml(body: string): string {
  const t = body.replace(/\r\n/g, "\n");
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#18181b">${escapeHtml(t).replace(/\n/g, "<br/>")}</div>`;
}

async function loadAuthorizedSenderRows(): Promise<AuthorizedSenderUser[]> {
  const rows = await db
    .select({
      id: users.id,
      full_name: users.full_name,
      email: users.email,
      isEmailAuthorized: users.isEmailAuthorized,
      senderName: users.senderName,
      senderEmail: users.senderEmail,
    })
    .from(users)
    .where(and(eq(users.isEmailAuthorized, true), eq(users.adminApproved, true), eq(users.isAdmin, true)));

  const domain = getOutboundAllowedDomain();
  return rows.filter((r) => senderRowIsSendable(r, domain));
}

export async function listAuthorizedSenderRows(): Promise<AuthorizedSenderUser[]> {
  return loadAuthorizedSenderRows();
}

export function buildAuthorizedSenderMap(rows: AuthorizedSenderUser[]): Map<number, AuthorizedSenderUser> {
  return new Map(rows.map((r) => [r.id, r]));
}

export function defaultSendAsKeyForSession(
  sessionUserId: number | null,
  authorizedRows: AuthorizedSenderUser[],
): "primary" | `user:${number}` {
  const domain = getOutboundAllowedDomain();
  if (sessionUserId != null) {
    const row = authorizedRows.find((r) => r.id === sessionUserId);
    if (row && senderRowIsSendable(row, domain)) {
      return `user:${row.id}`;
    }
  }
  return "primary";
}

/**
 * Send a CRM lead email over IONOS SMTP with From + Reply-To resolution and activity log.
 */
export async function sendCrmLeadEmail(input: {
  contact: CrmContact;
  subject: string;
  bodyText: string;
  sendAsKey: string;
  sessionUserId: number | null;
}): Promise<
  | { ok: true; messageId: string; usedFrom: { name: string; email: string }; replyTo: string }
  | { ok: false; error: string }
> {
  const to = input.contact.email?.trim();
  if (!to) {
    return { ok: false, error: "Contact has no email." };
  }
  if (input.contact.doNotContact) {
    return { ok: false, error: "Do not contact is enabled for this lead." };
  }

  const primary = getPrimarySenderConfig();
  if (!primary.email) {
    return { ok: false, error: "Primary sender email is not configured (IONOS_EMAIL / ASCENDRA_PRIMARY_FROM_EMAIL)." };
  }

  const allowed = await loadAuthorizedSenderRows();
  const map = buildAuthorizedSenderMap(allowed);
  const domain = getOutboundAllowedDomain();
  const from = resolveFromForSendAs(input.sendAsKey, primary, map, domain);

  let ownerEmail: string | null | undefined;
  if (input.contact.ownerUserId) {
    const owner = await storage.getUser(input.contact.ownerUserId);
    ownerEmail = owner?.email ?? undefined;
  }
  const fallback = getDefaultReplyToFallbackEmail();
  if (!fallback) {
    return { ok: false, error: "Reply-To fallback is not configured (ADMIN_EMAIL / ASCENDRA_DEFAULT_REPLY_TO_EMAIL)." };
  }
  const { replyTo } = resolveReplyToForLead({ ownerUserEmail: ownerEmail, fallbackReplyTo: fallback });

  const html = plainBodyToEmailHtml(input.bodyText.trim() || "(empty message)");

  const result = await sendIonosEmail({
    to,
    subject: input.subject.trim(),
    html,
    text: input.bodyText.trim(),
    from,
    replyTo,
  });

  if (!result.ok) {
    return result;
  }

  try {
    await storage.createCrmActivityLog({
      contactId: input.contact.id,
      type: "email_sent",
      title: `Email sent: ${input.subject.trim().slice(0, 120)}`,
      content: input.bodyText.trim().slice(0, 2000),
      metadata: {
        messageId: result.messageId,
        fromName: from.name,
        fromEmail: from.email,
        replyTo,
        sendAsKey: input.sendAsKey,
        transport: "ionos_smtp",
      },
      createdByUserId: input.sessionUserId ?? undefined,
    });
  } catch (e) {
    console.error("[sendCrmLeadEmail] activity log failed:", e);
  }

  return { ok: true, messageId: result.messageId, usedFrom: from, replyTo };
}

/** Labels for admin UI */
export function formatSenderOptionLabel(row: AuthorizedSenderUser): string {
  const e = row.senderEmail?.trim() || "";
  return `${displayNameForAuthorizedSender(row)} (${e})`;
}
