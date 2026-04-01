/**
 * Content Studio — Threads API OAuth (native Threads flow, not Facebook Login).
 * Auth window: https://threads.net/oauth/authorize — scopes threads_basic / threads_content_publish
 * are valid only there (they are not Facebook Login permissions).
 * Token exchange: graph.threads.net. Up to MAX_SOCIAL_CONNECTIONS_PER_PLATFORM profiles; encrypted tokens in DB.
 * Falls back to THREADS_ACCESS_TOKEN + THREADS_USER_ID (or META_THREADS_*) when set.
 */

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { MAX_SOCIAL_CONNECTIONS_PER_PLATFORM } from "@server/lib/contentStudioSocialConstants";
import {
  canEncryptSchedulingSecrets,
  decryptSchedulingSecret,
  encryptSchedulingSecret,
} from "@server/lib/schedulingSecrets";
import { schedulingIntegrationConfigs } from "@shared/schedulingSchema";

const PROVIDER = "content_studio_threads";
const KEY_ACCOUNTS = "accounts";
const THREADS_GRAPH = "https://graph.threads.net/v1.0";
const THREADS_OAUTH_AUTHORIZE = "https://threads.net/oauth/authorize";
const THREADS_OAUTH_TOKEN_ENDPOINT = "https://graph.threads.net/oauth/access_token";
const THREADS_LONG_LIVED_TOKEN_URL = "https://graph.threads.net/access_token";

export type ThreadsConnectedAccount = {
  accountId: string;
  threadsUserId: string;
  username: string;
  encryptedAccessToken: string;
};

type ConfigJson = { accounts?: ThreadsConnectedAccount[] };

/** Optional: reuse main Meta app for Threads Login if THREADS_APP_ID is unset. */
export function threadsOAuthClientId(): string | null {
  return process.env.THREADS_APP_ID?.trim() || process.env.FACEBOOK_APP_ID?.trim() || null;
}

export function threadsOAuthClientSecret(): string | null {
  return process.env.THREADS_APP_SECRET?.trim() || process.env.FACEBOOK_APP_SECRET?.trim() || null;
}

export function isThreadsOAuthConfigured(): boolean {
  return !!(threadsOAuthClientId() && threadsOAuthClientSecret());
}

export function getThreadsOAuthRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/integrations/social/threads/callback`;
}

export function buildThreadsAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = threadsOAuthClientId()!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["threads_basic", "threads_content_publish"].join(","),
    state,
  });
  return `${THREADS_OAUTH_AUTHORIZE}?${params.toString()}`;
}

async function getRow() {
  const [row] = await db
    .select()
    .from(schedulingIntegrationConfigs)
    .where(eq(schedulingIntegrationConfigs.provider, PROVIDER))
    .limit(1);
  return row ?? null;
}

function accountsFromConfigJson(raw: Record<string, unknown>): ThreadsConnectedAccount[] {
  const cfg = raw as ConfigJson;
  const list = cfg[KEY_ACCOUNTS];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (a): a is ThreadsConnectedAccount =>
      typeof a === "object" &&
      a !== null &&
      typeof (a as ThreadsConnectedAccount).accountId === "string" &&
      typeof (a as ThreadsConnectedAccount).threadsUserId === "string" &&
      typeof (a as ThreadsConnectedAccount).encryptedAccessToken === "string",
  );
}

export async function listThreadsConnectedAccounts(): Promise<ThreadsConnectedAccount[]> {
  const row = await getRow();
  if (!row?.enabled) return [];
  return accountsFromConfigJson((row.configJson || {}) as Record<string, unknown>).slice(
    0,
    MAX_SOCIAL_CONNECTIONS_PER_PLATFORM,
  );
}

export async function listThreadsAccountSummaries(): Promise<
  { accountId: string; threadsUserId: string; username: string }[]
> {
  const accounts = await listThreadsConnectedAccounts();
  return accounts.map((a) => ({
    accountId: a.accountId,
    threadsUserId: a.threadsUserId,
    username: a.username,
  }));
}

export async function isContentStudioThreadsOAuthConnected(): Promise<boolean> {
  return (await listThreadsConnectedAccounts()).length > 0;
}

export async function getThreadsCredentialsResolved(
  accountId?: string | null,
): Promise<{ token: string; threadsUserId: string } | null> {
  const accounts = await listThreadsConnectedAccounts();

  if (accountId?.trim()) {
    const hit = accounts.find((a) => a.accountId === accountId.trim());
    if (hit) {
      try {
        return {
          token: decryptSchedulingSecret(hit.encryptedAccessToken),
          threadsUserId: hit.threadsUserId,
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  if (accounts.length > 0) {
    const sorted = [...accounts].sort((a, b) =>
      a.username.localeCompare(b.username, undefined, { sensitivity: "base" }),
    );
    try {
      return {
        token: decryptSchedulingSecret(sorted[0].encryptedAccessToken),
        threadsUserId: sorted[0].threadsUserId,
      };
    } catch {
      /* env */
    }
  }

  const token =
    process.env.THREADS_ACCESS_TOKEN?.trim() || process.env.META_THREADS_ACCESS_TOKEN?.trim();
  const uid = process.env.THREADS_USER_ID?.trim() || process.env.META_THREADS_USER_ID?.trim();
  if (token && uid) return { token, threadsUserId: uid };
  return null;
}

export async function disconnectContentStudioThreads(accountId?: string | null): Promise<void> {
  const existing = await getRow();
  if (!existing) return;

  if (!accountId?.trim()) {
    await db
      .update(schedulingIntegrationConfigs)
      .set({ enabled: false, configJson: {}, updatedAt: new Date() })
      .where(eq(schedulingIntegrationConfigs.id, existing.id));
    return;
  }

  if (!existing.enabled) return;

  const accounts = await listThreadsConnectedAccounts();
  const next = accounts.filter((a) => a.accountId !== accountId.trim()).slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);

  if (next.length === 0) {
    await db
      .update(schedulingIntegrationConfigs)
      .set({ enabled: false, configJson: {}, updatedAt: new Date() })
      .where(eq(schedulingIntegrationConfigs.id, existing.id));
    return;
  }

  await db
    .update(schedulingIntegrationConfigs)
    .set({
      enabled: true,
      configJson: { [KEY_ACCOUNTS]: next } as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(schedulingIntegrationConfigs.id, existing.id));
}

async function exchangeCodeForShortLived(code: string, redirectUri: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientId = threadsOAuthClientId()!;
  const clientSecret = threadsOAuthClientSecret()!;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(THREADS_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error_message?: string;
    error?: { message?: string } | string;
  };
  if (!res.ok || !data.access_token) {
    const fromObj = typeof data.error === "object" && data.error && "message" in data.error ? data.error.message : null;
    const msg = data.error_message || fromObj || (typeof data.error === "string" ? data.error : null) || `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, token: data.access_token };
}

async function exchangeLongLived(shortToken: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientSecret = threadsOAuthClientSecret()!;
  const url = new URL(THREADS_LONG_LIVED_TOKEN_URL);
  url.searchParams.set("grant_type", "th_exchange_token");
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("access_token", shortToken);
  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error_message?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    const msg = data.error_message || data.error?.message || `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, token: data.access_token };
}

async function fetchThreadsProfile(accessToken: string): Promise<
  { ok: true; id: string; username: string } | { ok: false; error: string }
> {
  const u = new URL(`${THREADS_GRAPH}/me`);
  u.searchParams.set("fields", "id,username");
  u.searchParams.set("access_token", accessToken);
  const res = await fetch(u.toString(), { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { id?: string; username?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    const msg = data.error?.message || res.statusText;
    return { ok: false, error: msg };
  }
  return {
    ok: true,
    id: data.id,
    username: typeof data.username === "string" && data.username.trim() ? data.username.trim() : data.id,
  };
}

export async function saveThreadsTokensFromOAuthCode(
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET (16+ chars).",
    };
  }
  if (!isThreadsOAuthConfigured()) {
    return {
      ok: false,
      error: "Set THREADS_APP_ID and THREADS_APP_SECRET (or FACEBOOK_APP_ID / FACEBOOK_APP_SECRET as fallback).",
    };
  }

  const s1 = await exchangeCodeForShortLived(code, redirectUri);
  if (!s1.ok) return s1;
  const long = await exchangeLongLived(s1.token);
  if (!long.ok) return long;

  const prof = await fetchThreadsProfile(long.token);
  if (!prof.ok) return prof;

  let accounts = await listThreadsConnectedAccounts();
  if (accounts.length >= MAX_SOCIAL_CONNECTIONS_PER_PLATFORM) {
    return {
      ok: false,
      error: `Maximum ${MAX_SOCIAL_CONNECTIONS_PER_PLATFORM} Threads accounts connected. Remove one first.`,
    };
  }

  if (accounts.some((a) => a.threadsUserId === prof.id)) {
    return { ok: false, error: "This Threads profile is already connected." };
  }

  accounts.push({
    accountId: randomUUID(),
    threadsUserId: prof.id,
    username: prof.username,
    encryptedAccessToken: encryptSchedulingSecret(long.token),
  });
  accounts = accounts.slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);

  await db
    .insert(schedulingIntegrationConfigs)
    .values({
      provider: PROVIDER,
      enabled: true,
      configJson: { [KEY_ACCOUNTS]: accounts } as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: schedulingIntegrationConfigs.provider,
      set: {
        enabled: true,
        configJson: { [KEY_ACCOUNTS]: accounts } as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });

  return { ok: true };
}

/** Two-step Threads publish (container + publish); waits briefly between calls. */
export async function publishThreadsTextPost(
  threadsUserId: string,
  accessToken: string,
  text: string,
  linkAttachment?: string,
): Promise<
  | { ok: true; externalId: string; raw?: unknown }
  | { ok: false; error: string }
> {
  const body = new URLSearchParams();
  body.set("media_type", "TEXT");
  body.set("text", text.trim().slice(0, 500));
  body.set("access_token", accessToken);
  if (linkAttachment?.trim()) body.set("link_attachment", linkAttachment.trim().slice(0, 2000));

  const createUrl = `${THREADS_GRAPH}/${encodeURIComponent(threadsUserId)}/threads`;
  const res1 = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data1 = (await res1.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!res1.ok || !data1.id) {
    const msg = data1.error?.message || res1.statusText || "Threads container failed";
    return { ok: false, error: msg };
  }

  await new Promise((r) => setTimeout(r, 10_000));

  const pubBody = new URLSearchParams();
  pubBody.set("creation_id", data1.id);
  pubBody.set("access_token", accessToken);
  const res2 = await fetch(`${THREADS_GRAPH}/${encodeURIComponent(threadsUserId)}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pubBody.toString(),
  });
  const data2 = (await res2.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!res2.ok || !data2.id) {
    const msg = data2.error?.message || res2.statusText || "Threads publish failed";
    return { ok: false, error: msg };
  }
  return { ok: true, externalId: data2.id, raw: data2 };
}
