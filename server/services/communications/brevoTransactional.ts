/**
 * Provider abstraction for transactional sends (Brevo-first).
 * Uses REST API to avoid duplicating @getbrevo/brevo init paths beyond EmailService.
 */

export type BrevoTransactionalResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendBrevoTransactional(input: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
  senderName?: string | null;
}): Promise<BrevoTransactionalResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.FROM_EMAIL?.trim();
  const defaultName = process.env.FROM_NAME?.trim() || "Ascendra Technologies";
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY is not set." };
  if (!fromEmail) return { ok: false, error: "FROM_EMAIL is not set (verified Brevo sender)." };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: input.senderName?.trim() || defaultName },
      to: [{ email: input.to.trim() }],
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent?.trim() || input.htmlContent.replace(/<[^>]*>/g, ""),
      replyTo: input.replyTo,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: typeof data.message === "string" ? data.message : `Brevo API ${res.status}` };
  }
  return { ok: true, messageId: data.messageId?.toString() ?? "unknown" };
}
