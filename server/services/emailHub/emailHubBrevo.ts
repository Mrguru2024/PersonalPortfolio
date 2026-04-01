/**
 * Brevo transactional send for Email Hub — tags + headers for webhook correlation.
 */
export type BrevoRecipient = { email: string; name?: string };

export type EmailHubBrevoSendInput = {
  to: BrevoRecipient[];
  cc?: BrevoRecipient[];
  bcc?: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender: { email: string; name: string };
  replyTo?: { email: string; name?: string };
  /** Internal DB id — echoed in headers + tags for webhooks */
  emailHubMessageId: number;
  trackingOpen?: boolean;
  trackingClick?: boolean;
};

export type EmailHubBrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendEmailHubViaBrevo(input: EmailHubBrevoSendInput): Promise<EmailHubBrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY is not set." };

  const tag = `emailhub:${input.emailHubMessageId}`;
  const headers: Record<string, string> = {
    "X-Ascendra-Email-Hub-Message-Id": String(input.emailHubMessageId),
  };

  const body: Record<string, unknown> = {
    sender: input.sender,
    to: input.to.map((x) => ({ email: x.email.trim(), ...(x.name?.trim() ? { name: x.name.trim() } : {}) })),
    subject: input.subject,
    htmlContent: input.htmlContent,
    textContent:
      input.textContent?.trim() ||
      input.htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    tags: [tag],
    headers,
  };

  if (input.cc?.length)
    body.cc = input.cc.map((x) => ({ email: x.email.trim(), ...(x.name?.trim() ? { name: x.name.trim() } : {}) }));
  if (input.bcc?.length)
    body.bcc = input.bcc.map((x) => ({ email: x.email.trim(), ...(x.name?.trim() ? { name: x.name.trim() } : {}) }));
  if (input.replyTo?.email) {
    body.replyTo = { email: input.replyTo.email.trim(), name: input.replyTo.name };
  }

  if (input.trackingOpen === false) body.trackingOpen = false;
  if (input.trackingClick === false) body.trackingClick = false;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
  if (!res.ok) {
    const raw = typeof data.message === "string" ? data.message : `Brevo API ${res.status}`;
    return { ok: false, error: raw };
  }
  return { ok: true, messageId: data.messageId?.toString() ?? "unknown" };
}
