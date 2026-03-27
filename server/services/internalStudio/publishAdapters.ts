/**
 * Outbound adapters for Content Studio calendar publishing (same logs + calendar rows).
 * Facebook: Graph API. LinkedIn / X: env bearer tokens from your OAuth apps. Webhook: Buffer/Later/Make/Zapier-style receiver.
 * Brevo: notify-only transactional email (does not post to social).
 */

import { createHmac } from "node:crypto";
import { getFacebookPageCredentialsResolved } from "@server/services/contentStudioFacebookConnectService";
import { getLinkedInCredentialsResolved } from "@server/services/contentStudioLinkedInConnectService";
import {
  getThreadsCredentialsResolved,
  publishThreadsTextPost,
} from "@server/services/contentStudioThreadsConnectService";
import { getXAccessTokenResolved } from "@server/services/contentStudioXConnectService";

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

export async function hasLinkedInPublishConfig(): Promise<boolean> {
  return (await getLinkedInCredentialsResolved()) !== null;
}

export async function hasXPublishConfig(): Promise<boolean> {
  return (await getXAccessTokenResolved()) !== null;
}

export async function hasThreadsPublishConfig(): Promise<boolean> {
  return (await getThreadsCredentialsResolved()) !== null;
}

export function hasWebhookPublishConfig(): boolean {
  return webhookPublishConfig() !== null;
}

/** Optional `facebook_page:<accountId>` / `facebook:<accountId>` suffix from calendar platform targets. */
function parseFacebookAccountId(platformKey: string): string | undefined {
  const t = platformKey.trim();
  const m = t.match(/^facebook_page:(.+)$/i) ?? t.match(/^facebook:(.+)$/i);
  const id = m?.[1]?.trim();
  return id || undefined;
}

function parseLinkedInAccountId(platformKey: string): string | undefined {
  const m = platformKey.match(/^linkedin(?:_member)?:(.+)$/i);
  return m?.[1]?.trim() || undefined;
}

function parseXAccountId(platformKey: string): string | undefined {
  const m = platformKey.match(/^x:(.+)$/i) ?? platformKey.match(/^twitter:(.+)$/i);
  return m?.[1]?.trim() || undefined;
}

function parseThreadsAccountId(platformKey: string): string | undefined {
  const m = platformKey.match(/^threads:(.+)$/i);
  return m?.[1]?.trim() || undefined;
}

function contentStudioAdapterSwitchKey(platformKey: string): string {
  const t = platformKey.trim().toLowerCase();
  if (t === "facebook_page" || t.startsWith("facebook_page:") || t === "facebook" || t.startsWith("facebook:")) {
    return "facebook_page";
  }
  if (t === "linkedin" || t.startsWith("linkedin:") || t === "linkedin_member" || t.startsWith("linkedin_member:")) {
    return "linkedin";
  }
  if (t === "threads" || t.startsWith("threads:")) {
    return "threads";
  }
  if (t === "x" || t.startsWith("x:") || t === "twitter" || t.startsWith("twitter:")) {
    return "x";
  }
  return t;
}

async function publishFacebookPageFeed(
  message: string,
  link?: string,
  facebookAccountId?: string,
): Promise<AdapterPublishResult> {
  const cred = await getFacebookPageCredentialsResolved(facebookAccountId ?? null);
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

/** LinkedIn UGC Post (member or organization) — Integrations OAuth or env token + URN. */
async function publishLinkedInUgc(text: string, linkedInAccountId?: string): Promise<AdapterPublishResult> {
  const cred = await getLinkedInCredentialsResolved(linkedInAccountId ?? null);
  if (!cred) {
    return {
      ok: false,
      error:
        "LinkedIn not configured: use Integrations → Connect LinkedIn, or set LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN (urn:li:person:… or urn:li:organization:…).",
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

function xTweetMaxLength(): number {
  const raw = process.env.X_TWEET_MAX_CHARS?.trim();
  if (raw && /^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n >= 1 && n <= 25000) return n;
  }
  return 280;
}

/** X / Twitter API v2 — Integrations OAuth or env bearer token with tweet.write. */
async function publishXTweet(text: string, xAccountId?: string): Promise<AdapterPublishResult> {
  const token = await getXAccessTokenResolved(xAccountId ?? null);
  if (!token) {
    return {
      ok: false,
      error:
        "X not configured: use Integrations → Connect X, or set X_OAUTH2_ACCESS_TOKEN (or TWITTER_*). OAuth app needs tweet.write.",
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

/** Meta Threads — two-step container + publish (500 char text limit). */
async function publishThreadsAdapter(
  text: string,
  link: string | undefined,
  threadsAccountId?: string,
): Promise<AdapterPublishResult> {
  const cred = await getThreadsCredentialsResolved(threadsAccountId ?? null);
  if (!cred) {
    return {
      ok: false,
      error:
        "Threads not configured: use Integrations → Connect Threads, or set THREADS_ACCESS_TOKEN + THREADS_USER_ID.",
    };
  }
  const out = await publishThreadsTextPost(cred.threadsUserId, cred.token, text, link?.trim() || undefined);
  if (!out.ok) return out;
  return { ok: true, externalId: out.externalId, raw: out.raw };
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
  const rawKey = platformKey.trim();
  const key = contentStudioAdapterSwitchKey(rawKey);
  const fbAccountId = parseFacebookAccountId(rawKey);
  const liAccountId = parseLinkedInAccountId(rawKey);
  const xAccountId = parseXAccountId(rawKey);
  const threadsAccountId = parseThreadsAccountId(rawKey);
  const message =
    input.bodyText.trim().length > 0
      ? `${input.title.trim()}\n\n${input.bodyText.trim()}`.slice(0, 8000)
      : input.title.trim().slice(0, 8000);

  switch (key) {
    case "manual":
      return { ok: true, externalId: "manual", raw: { logged: true } };
    case "facebook_page":
      return publishFacebookPageFeed(message, input.link ?? undefined, fbAccountId);
    case "linkedin":
      return publishLinkedInUgc(message, liAccountId);
    case "x":
    case "twitter":
      return publishXTweet(message, xAccountId);
    case "threads":
      return publishThreadsAdapter(message, input.link ?? undefined, threadsAccountId);
    case "webhook_hub":
    case "hookle_webhook":
    case "buffer_webhook":
      return publishWebhookHub(rawKey, input, message);
    case "brevo_notify":
      return publishBrevoNotify({ ...input, message });
    case "blog":
    case "newsletter":
      return {
        ok: false,
        error: `${key} adapter is not wired yet — use manual, facebook_page, linkedin, threads, x, webhook_hub, brevo_notify, or blog/newsletter admin UI.`,
      };
    case "social_placeholder":
      return {
        ok: false,
        error:
          "social_placeholder is deprecated: use facebook_page, linkedin, threads, x, webhook_hub, brevo_notify, or manual.",
      };
    default:
      return { ok: false, error: `Unknown platform adapter: ${platformKey}` };
  }
}
