import { getIonosFromName } from "./ionosEnv";

function shell(innerTitle: string, innerHtml: string): { html: string; text: string } {
  const brand = getIonosFromName();
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(innerTitle)}</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr><td style="padding:20px 24px;background:#18181b;color:#fafafa;font-size:15px;font-weight:600;">${escapeHtml(brand)}</td></tr>
        <tr><td style="padding:24px;font-size:15px;line-height:1.5;color:#27272a;">${innerHtml}</td></tr>
        <tr><td style="padding:16px 24px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7;">Sent from Ascendra OS · system mail</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${brand}\n\n${innerTitle}\n\n${stripTags(innerHtml)}`;
  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildTestEmailTemplate(input: { sentAtIso: string }): { subject: string; html: string; text: string } {
  const inner = `
    <p style="margin:0 0 12px;">This is a <strong>test message</strong> from Ascendra OS (IONOS SMTP).</p>
    <p style="margin:0;color:#52525b;font-size:14px;">Sent at ${escapeHtml(input.sentAtIso)}</p>
  `;
  const { html, text } = shell("SMTP test", inner);
  return { subject: `[Ascendra OS] SMTP test · ${input.sentAtIso.slice(0, 19)}`, html, text };
}

export function buildLeadNotificationTemplate(input: {
  leadName: string;
  leadEmail: string;
  summary: string;
  source?: string | null;
}): { subject: string; html: string; text: string } {
  const inner = `
    <p style="margin:0 0 8px;"><strong>New lead signal</strong></p>
    <p style="margin:0 0 4px;"><strong>Name:</strong> ${escapeHtml(input.leadName)}</p>
    <p style="margin:0 0 4px;"><strong>Email:</strong> ${escapeHtml(input.leadEmail)}</p>
    ${input.source?.trim() ? `<p style="margin:0 0 8px;"><strong>Source:</strong> ${escapeHtml(input.source.trim())}</p>` : ""}
    <p style="margin:12px 0 0;white-space:pre-wrap;">${escapeHtml(input.summary)}</p>
  `;
  const { html, text } = shell("Lead notification", inner);
  return {
    subject: `[Ascendra] Lead: ${input.leadName}`.slice(0, 200),
    html,
    text,
  };
}

export function buildBookingConfirmationTemplate(input: {
  attendeeName: string;
  attendeeEmail: string;
  whenLabel: string;
  details?: string | null;
}): { subject: string; html: string; text: string } {
  const inner = `
    <p style="margin:0 0 8px;"><strong>Booking confirmed</strong></p>
    <p style="margin:0 0 4px;"><strong>Name:</strong> ${escapeHtml(input.attendeeName)}</p>
    <p style="margin:0 0 4px;"><strong>Email:</strong> ${escapeHtml(input.attendeeEmail)}</p>
    <p style="margin:0 0 8px;"><strong>When:</strong> ${escapeHtml(input.whenLabel)}</p>
    ${input.details?.trim() ? `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(input.details.trim())}</p>` : ""}
  `;
  const { html, text } = shell("Booking confirmation", inner);
  return {
    subject: `[Ascendra] Booking confirmed — ${input.whenLabel}`.slice(0, 200),
    html,
    text,
  };
}

function safeHttpUrl(raw: string | undefined | null): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const u = new URL(raw.trim());
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
  } catch {
    /* ignore */
  }
  return undefined;
}

export function buildProposalNotificationTemplate(input: {
  recipientName: string;
  proposalLabel: string;
  link?: string | null;
}): { subject: string; html: string; text: string } {
  const safeLink = safeHttpUrl(input.link);
  const inner = `
    <p style="margin:0 0 8px;">Hello ${escapeHtml(input.recipientName)},</p>
    <p style="margin:0 0 8px;">Your proposal <strong>${escapeHtml(input.proposalLabel)}</strong> is ready.</p>
    ${
      safeLink
        ? `<p style="margin:0;"><a href="${escapeHref(safeLink)}" style="color:#2563eb;">Open proposal</a></p>`
        : ""
    }
  `;
  const { html, text } = shell("Proposal ready", inner);
  return {
    subject: `[Ascendra] Proposal: ${input.proposalLabel}`.slice(0, 200),
    html,
    text,
  };
}

function escapeHref(url: string): string {
  return escapeHtml(url).replace(/'/g, "&#39;");
}
