/**
 * Outbound adapters for Content Studio calendar publishing (same logs + calendar rows).
 * Facebook: Graph API. LinkedIn / X: env bearer tokens from your OAuth apps. Webhook: Buffer/Later/Make/Zapier-style receiver.
 * Brevo: notify-only transactional email (does not post to social).
 */

import { createHmac } from "node:crypto";
import { getFacebookPageCredentialsResolved } from "@server/services/contentStudioFacebookConnectService";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AdapterPublishResult =
  | { ok: true; externalId?: string; raw?: unknown }
  | { ok: false; error: string };

/** Strip HTML to plain text for social APIs (best-effort). */
export function htmlToPlainText(html: string): string {
  if (!html?.trim()) return "";
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const br = noScripts.replace(/<br\s*\/?>/gi, "\n");
  const stripped = br.replace(/<[^>]+>/g, " ");
  return stripped
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** OAuth-stored Page token (Integrations) or env FACEBOOK_ACCESS_TOKEN + FACEBOOK_PAGE_ID / META_*. */
export async function hasFacebookPagePublishConfig(): Promise<boolean> {
  return (await getFacebookPageCredentialsResolved()) !== null;
}

export function hasLinkedInPublishConfig(): boolean {
  return linkedInCredentials() !== null;
}

export function hasXPublishConfig(): boolean {
  return xOAuth2Token() !== null;
}

export function hasWebhookPublishConfig(): boolean {
  return webhookPublishConfig() !== null;
}

async function publishFacebookPageFeed(message: string, link?: string): Promise<AdapterPublishResult> {
  const cred = await getFacebookPageCredentialsResolved();
  if (!cred) {
    return {
      ok: false,
      error:
        "Facebook Page not configured: use Integrations → Connect Facebook Page, or set FACEBOOK_ACCESS_TOKEN (or META_ACCESS_TOKEN) and FACEBOOK_PAGE_ID (or META_PAGE_ID). Token needs pages_manage_posts.",
    };
  }
  const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(cred.pageId)}/feed`;
  const body = new URLSearchParams();
  body.set("access_token", cred.token);
  body.set("message", message.slice(0, 8000));
  if (link?.trim()) body.set("link", link.trim().slice(0, 2000));

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText ?? "Facebook API error";
    return { ok: false, error: msg };
  }
  if (!data.id) return { ok: false, error: "Facebook returned no post id" };
  return { ok: true, externalId: data.id, raw: data };
}

function linkedInCredentials(): { token: string; authorUrn: string } | null {
  const token = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN?.trim();
  if (!token || !authorUrn) return null;
  return { token, authorUrn };
}

/** LinkedIn UGC Post (member or organization) — token from OAuth with w_member_social / w_organization_social as applicable. */
async function publishLinkedInUgc(text: string): Promise<AdapterPublishResult> {
  const cred = linkedInCredentials();
  if (!cred) {
    return {
      ok: false,
      error:
        "LinkedIn not configured: set LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN (e.g. urn:li:person:… or urn:li:organization:…). Obtain tokens via LinkedIn Developer OAuth.",
    };
  }
  const commentary = text.slice(0, 3000);
  const linkedInVersion = process.env.LINKEDIN_API_VERSION?.trim() || "202411";
  const body = {
    author: cred.authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: commentary },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cred.token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": linkedInVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string; errorDetails?: unknown };
  if (!res.ok) {
    const msg =
      typeof data.message === "string"
        ? data.message
        : res.statusText || "LinkedIn API error";
    return { ok: false, error: msg };
  }
  const id = typeof data.id === "string" ? data.id : undefined;
  return { ok: true, externalId: id ?? "linkedin", raw: data };
}

function xOAuth2Token(): string | null {
  const t =
    process.env.X_OAUTH2_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_OAUTH2_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_ACCESS_TOKEN?.trim();
  return t || null;
}

function xTweetMaxLength(): number {
  const raw = process.env.X_TWEET_MAX_CHARS?.trim();
  if (raw && /^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n >= 1 && n <= 25000) return n;
  }
  return 280;
}

/** X / Twitter API v2 — OAuth 2.0 user access token with tweet.write (from X Developer Portal). */
async function publishXTweet(text: string): Promise<AdapterPublishResult> {
  const token = xOAuth2Token();
  if (!token) {
    return {
      ok: false,
      error:
        "X not configured: set X_OAUTH2_ACCESS_TOKEN (or TWITTER_OAUTH2_ACCESS_TOKEN). Use a user access token with tweet.write from the X Developer Portal.",
    };
  }
  const max = xTweetMaxLength();
  const tweetText = text.trim().slice(0, max);
  if (!tweetText) return { ok: false, error: "Empty post text for X" };

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: { id?: string };
    errors?: { message?: string }[];
    title?: string;
    detail?: string;
  };
  if (!res.ok) {
    const msg =
      data.errors?.[0]?.message ||
      [data.title, data.detail].filter(Boolean).join(": ") ||
      res.statusText ||
      "X API error";
    return { ok: false, error: msg };
  }
  const id = data.data?.id;
  return { ok: true, externalId: id ?? "x", raw: data };
}

function webhookPublishConfig(): { url: string; secret?: string } | null {
  const url = process.env.CONTENT_STUDIO_PUBLISH_WEBHOOK_URL?.trim();
  if (!url) return null;
  const secret = process.env.CONTENT_STUDIO_PUBLISH_WEBHOOK_SECRET?.trim();
  return { url, secret: secret || undefined };
}

/** POST JSON to your automation (Make, Zapier, Buffer-style custom URL, etc.). Optional HMAC signature. */
async function publishWebhookHub(
  platformKey: string,
  input: { title: string; bodyText: string; link?: string | null },
  message: string,
): Promise<AdapterPublishResult> {
  const cfg = webhookPublishConfig();
  if (!cfg) {
    return {
      ok: false,
      error:
        "Webhook hub not configured: set CONTENT_STUDIO_PUBLISH_WEBHOOK_URL (optional CONTENT_STUDIO_PUBLISH_WEBHOOK_SECRET for X-Content-Studio-Signature: sha256=…).",
    };
  }
  const payload = {
    event: "content_studio.publish" as const,
    adapterKey: platformKey,
    title: input.title.trim(),
    bodyText: input.bodyText.trim(),
    link: input.link?.trim() ?? null,
    text: message,
    sentAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "AscendraContentStudio/1.0",
  };
  if (cfg.secret) {
    const sig = createHmac("sha256", cfg.secret).update(rawBody).digest("hex");
    headers["X-Content-Studio-Signature"] = `sha256=${sig}`;
  }

  const res = await fetch(cfg.url, { method: "POST", headers, body: rawBody });
  const text = await res.text().catch(() => "");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { body: text.slice(0, 500) };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: `Webhook returned ${res.status}: ${text.slice(0, 200)}`,
    };
  }
  return { ok: true, externalId: `webhook:${res.status}`, raw: parsed };
}

function brevoSenderEmail(): string | null {
  return (
    process.env.FROM_EMAIL?.trim() ||
    process.env.BREVO_FROM_EMAIL?.trim() ||
    null
  );
}

function brevoNotifyRecipient(): string | null {
  return (
    process.env.CONTENT_STUDIO_BREVO_NOTIFY_TO?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    null
  );
}

/** Sends a transactional email summary — notify-only; does not post to social networks. */
async function publishBrevoNotify(input: {
  title: string;
  bodyText: string;
  link?: string | null;
  message: string;
}): Promise<AdapterPublishResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const to = brevoNotifyRecipient();
  const sender = brevoSenderEmail();
  if (!apiKey) {
    return { ok: false, error: "Brevo notify: BREVO_API_KEY is not set." };
  }
  if (!to) {
    return {
      ok: false,
      error:
        "Brevo notify: set CONTENT_STUDIO_BREVO_NOTIFY_TO or ADMIN_EMAIL for the recipient, and FROM_EMAIL (verified sender).",
    };
  }
  if (!sender) {
    return { ok: false, error: "Brevo notify: set FROM_EMAIL (verified Brevo sender)." };
  }

  const subject = `[Content Studio] Scheduled publish: ${input.title.trim().slice(0, 120)}`;
  const lines = [
    `Title: ${input.title.trim()}`,
    "",
    input.bodyText.trim() || "(no body text)",
    "",
    input.link?.trim() ? `Link: ${input.link.trim()}` : "",
    "",
    "--- Full text for social ---",
    input.message,
  ].filter(Boolean);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: sender, name: process.env.FROM_NAME?.trim() || "Content Studio" },
      to: [{ email: to }],
      subject,
      textContent: lines.join("\n"),
      htmlContent: `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.message === "string" ? data.message : `Brevo API ${res.status}`,
    };
  }
  return {
    ok: true,
    externalId: data.messageId?.toString() ?? "brevo",
    raw: data,
  };
}

/**
 * Dispatch by adapter key (matches internal_platform_adapters.key and calendar platformTargets).
 */
export async function publishViaAdapter(
  platformKey: string,
  input: { title: string; bodyText: string; link?: string | null },
): Promise<AdapterPublishResult> {
  const key = platformKey.trim().toLowerCase();
  const message =
    input.bodyText.trim().length > 0
      ? `${input.title.trim()}\n\n${input.bodyText.trim()}`.slice(0, 8000)
      : input.title.trim().slice(0, 8000);

  switch (key) {
    case "manual":
      return { ok: true, externalId: "manual", raw: { logged: true } };
    case "facebook_page":
    case "facebook":
      return publishFacebookPageFeed(message, input.link ?? undefined);
    case "linkedin":
    case "linkedin_member":
      return publishLinkedInUgc(message);
    case "x":
    case "twitter":
      return publishXTweet(message);
    case "webhook_hub":
    case "hookle_webhook":
    case "buffer_webhook":
      return publishWebhookHub(key, input, message);
    case "brevo_notify":
      return publishBrevoNotify({ ...input, message });
    case "blog":
    case "newsletter":
      return {
        ok: false,
        error: `${key} adapter is not wired yet — use manual, facebook_page, linkedin, x, webhook_hub, brevo_notify, or publish from the blog/newsletter admin UI.`,
      };
    case "social_placeholder":
      return {
        ok: false,
        error:
          "social_placeholder is deprecated: use facebook_page, linkedin, x, webhook_hub, brevo_notify, or manual.",
      };
    default:
      return { ok: false, error: `Unknown platform adapter: ${platformKey}` };
  }
}
