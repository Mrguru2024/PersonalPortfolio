/**
 * Content Studio — X (Twitter) OAuth 2.N with PKCE, up to MAX_SOCIAL_CONNECTIONS_PER_PLATFORM accounts.
 * Falls back to X_OAUTH2_ACCESS_TOKEN / TWITTER_* env when no OAuth rows.
 */

import { createHash, randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { MAX_SOCIAL_CONNECTIONS_PER_PLATFORM } from "@server/lib/contentStudioSocialConstants";
import {
  canEncryptSchedulingSecrets,
  decryptSchedulingSecret,
  encryptSchedulingSecret,
} from "@server/lib/schedulingSecrets";
import { schedulingIntegrationConfigs } from "@shared/schedulingSchema";

const PROVIDER = "content_studio_x";
const KEY_ACCOUNTS = "accounts";

export type XConnectedAccount = {
  accountId: string;
  username: string;
  encryptedAccessToken: string;
};

type ConfigJson = { accounts?: XConnectedAccount[] };

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateXOAuthPkce(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function isXOAuthAppConfigured(): boolean {
  return !!(process.env.X_CLIENT_ID?.trim() && process.env.X_CLIENT_SECRET?.trim());
}

export function getXOAuthRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/integrations/social/x/callback`;
}

export function buildXAuthorizeUrl(state: string, redirectUri: string, codeChallenge: string): string {
  const clientId = process.env.X_CLIENT_ID!.trim();
  const scope = ["tweet.read", "tweet.write", "users.read", "offline.access"].join(" ");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

async function getRow() {
  const [row] = await db
    .select()
    .from(schedulingIntegrationConfigs)
    .where(eq(schedulingIntegrationConfigs.provider, PROVIDER))
    .limit(1);
  return row ?? null;
}

function accountsFromConfigJson(raw: Record<string, unknown>): XConnectedAccount[] {
  const cfg = raw as ConfigJson;
  const list = cfg[KEY_ACCOUNTS];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (a): a is XConnectedAccount =>
      typeof a === "object" &&
      a !== null &&
      typeof (a as XConnectedAccount).accountId === "string" &&
      typeof (a as XConnectedAccount).username === "string" &&
      typeof (a as XConnectedAccount).encryptedAccessToken === "string",
  );
}

export async function listXConnectedAccounts(): Promise<XConnectedAccount[]> {
  const row = await getRow();
  if (!row?.enabled) return [];
  return accountsFromConfigJson((row.configJson || {}) as Record<string, unknown>).slice(
    0,
    MAX_SOCIAL_CONNECTIONS_PER_PLATFORM,
  );
}

export async function listXAccountSummaries(): Promise<{ accountId: string; username: string }[]> {
  const accounts = await listXConnectedAccounts();
  return accounts.map((a) => ({ accountId: a.accountId, username: a.username }));
}

export async function isContentStudioXOAuthConnected(): Promise<boolean> {
  return (await listXConnectedAccounts()).length > 0;
}

function envXToken(): string | null {
  return (
    process.env.X_OAUTH2_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_OAUTH2_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_ACCESS_TOKEN?.trim() ||
    null
  );
}

export async function getXAccessTokenResolved(accountId?: string | null): Promise<string | null> {
  const accounts = await listXConnectedAccounts();

  if (accountId?.trim()) {
    const hit = accounts.find((a) => a.accountId === accountId.trim());
    if (hit) {
      try {
        return decryptSchedulingSecret(hit.encryptedAccessToken);
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
      return decryptSchedulingSecret(sorted[0].encryptedAccessToken);
    } catch {
      /* env */
    }
  }

  return envXToken();
}

export async function disconnectContentStudioX(accountId?: string | null): Promise<void> {
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

  const accounts = await listXConnectedAccounts();
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

async function exchangeXCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ ok: true; access_token: string } | { ok: false; error: string }> {
  const clientId = process.env.X_CLIENT_ID!.trim();
  const clientSecret = process.env.X_CLIENT_SECRET!.trim();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    const msg = data.error_description || data.error || `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, access_token: data.access_token };
}

async function fetchXUsername(accessToken: string): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const res = await fetch("https://api.twitter.com/2/users/me?user.fields=username", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: { username?: string };
    errors?: { detail?: string }[];
    title?: string;
    detail?: string;
  };
  if (!res.ok) {
    const msg =
      data.errors?.[0]?.detail || [data.title, data.detail].filter(Boolean).join(": ") || `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  const u = data.data?.username;
  if (!u) return { ok: false, error: "X did not return username" };
  return { ok: true, username: u };
}

export async function saveXTokensFromOAuthCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET (16+ chars).",
    };
  }
  if (!isXOAuthAppConfigured()) {
    return { ok: false, error: "Set X_CLIENT_ID and X_CLIENT_SECRET." };
  }

  const tok = await exchangeXCode(code, redirectUri, codeVerifier);
  if (!tok.ok) return tok;

  const user = await fetchXUsername(tok.access_token);
  if (!user.ok) return user;

  let accounts = await listXConnectedAccounts();
  if (accounts.length >= MAX_SOCIAL_CONNECTIONS_PER_PLATFORM) {
    return {
      ok: false,
      error: `Maximum ${MAX_SOCIAL_CONNECTIONS_PER_PLATFORM} X accounts connected. Remove one first.`,
    };
  }

  const unameLower = user.username.toLowerCase();
  if (accounts.some((a) => a.username.toLowerCase() === unameLower)) {
    return { ok: false, error: "This X account is already connected." };
  }

  accounts.push({
    accountId: randomUUID(),
    username: user.username,
    encryptedAccessToken: encryptSchedulingSecret(tok.access_token),
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
