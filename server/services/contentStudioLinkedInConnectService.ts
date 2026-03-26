/**
 * Content Studio — LinkedIn OAuth (up to MAX_SOCIAL_CONNECTIONS_PER_PLATFORM accounts).
 * Falls back to LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN when no OAuth rows.
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

const PROVIDER = "content_studio_linkedin";
const KEY_ACCOUNTS = "accounts";
const KEY_ENC_TOKEN = "encryptedAccessToken";
const KEY_AUTHOR_URN = "authorUrn";
const KEY_LABEL = "displayLabel";

export type LinkedInConnectedAccount = {
  accountId: string;
  authorUrn: string;
  displayLabel: string;
  encryptedAccessToken: string;
};

type ConfigJson = {
  accounts?: LinkedInConnectedAccount[];
  [KEY_ENC_TOKEN]?: string;
  [KEY_AUTHOR_URN]?: string;
  [KEY_LABEL]?: string;
};

export function isLinkedInOAuthAppConfigured(): boolean {
  return !!(process.env.LINKEDIN_CLIENT_ID?.trim() && process.env.LINKEDIN_CLIENT_SECRET?.trim());
}

export function getLinkedInOAuthRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/integrations/social/linkedin/callback`;
}

export function buildLinkedInAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const scope = ["openid", "profile", "w_member_social"].join(" ");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

async function getRow() {
  const [row] = await db
    .select()
    .from(schedulingIntegrationConfigs)
    .where(eq(schedulingIntegrationConfigs.provider, PROVIDER))
    .limit(1);
  return row ?? null;
}

function accountsFromConfigJson(raw: Record<string, unknown>): LinkedInConnectedAccount[] {
  const cfg = raw as ConfigJson;
  const list = cfg[KEY_ACCOUNTS];
  if (Array.isArray(list) && list.length > 0) {
    return list.filter(
      (a): a is LinkedInConnectedAccount =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as LinkedInConnectedAccount).accountId === "string" &&
        typeof (a as LinkedInConnectedAccount).authorUrn === "string" &&
        typeof (a as LinkedInConnectedAccount).encryptedAccessToken === "string",
    );
  }
  const enc = cfg[KEY_ENC_TOKEN];
  const urn = cfg[KEY_AUTHOR_URN];
  const label = cfg[KEY_LABEL];
  if (typeof enc === "string" && enc.trim() && typeof urn === "string" && urn.trim()) {
    return [
      {
        accountId: randomUUID(),
        authorUrn: urn.trim(),
        displayLabel: typeof label === "string" && label.trim() ? label.trim() : "LinkedIn",
        encryptedAccessToken: enc,
      },
    ];
  }
  return [];
}

function normalizePersonUrn(sub: string): string {
  const s = sub.trim();
  if (s.startsWith("urn:li:")) return s;
  return `urn:li:person:${s}`;
}

export async function listLinkedInConnectedAccounts(): Promise<LinkedInConnectedAccount[]> {
  const row = await getRow();
  if (!row?.enabled) return [];
  const accounts = accountsFromConfigJson((row.configJson || {}) as Record<string, unknown>);
  if (accounts.length === 0) return [];

  const cfg = (row.configJson || {}) as ConfigJson;
  if (!Array.isArray(cfg[KEY_ACCOUNTS]) || cfg[KEY_ACCOUNTS]!.length === 0) {
    await db
      .update(schedulingIntegrationConfigs)
      .set({
        configJson: { [KEY_ACCOUNTS]: accounts } as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(schedulingIntegrationConfigs.id, row.id));
  }

  return accounts.slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);
}

export async function listLinkedInAccountSummaries(): Promise<
  { accountId: string; authorUrn: string; displayLabel: string }[]
> {
  const accounts = await listLinkedInConnectedAccounts();
  return accounts.map((a) => ({
    accountId: a.accountId,
    authorUrn: a.authorUrn,
    displayLabel: a.displayLabel,
  }));
}

export async function isContentStudioLinkedInOAuthConnected(): Promise<boolean> {
  return (await listLinkedInConnectedAccounts()).length > 0;
}

export async function getLinkedInCredentialsResolved(
  accountId?: string | null,
): Promise<{ token: string; authorUrn: string } | null> {
  const accounts = await listLinkedInConnectedAccounts();

  if (accountId?.trim()) {
    const hit = accounts.find((a) => a.accountId === accountId.trim());
    if (hit) {
      try {
        return { token: decryptSchedulingSecret(hit.encryptedAccessToken), authorUrn: hit.authorUrn };
      } catch {
        return null;
      }
    }
    return null;
  }

  if (accounts.length > 0) {
    const sorted = [...accounts].sort((a, b) =>
      a.displayLabel.localeCompare(b.displayLabel, undefined, { sensitivity: "base" }),
    );
    try {
      return {
        token: decryptSchedulingSecret(sorted[0].encryptedAccessToken),
        authorUrn: sorted[0].authorUrn,
      };
    } catch {
      /* env */
    }
  }

  const token = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN?.trim();
  if (token && authorUrn) return { token, authorUrn };
  return null;
}

export async function disconnectContentStudioLinkedIn(accountId?: string | null): Promise<void> {
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

  const accounts = await listLinkedInConnectedAccounts();
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

async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!.trim();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    const msg = data.error_description || data.error || `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, token: data.access_token };
}

async function fetchLinkedInUserMeta(accessToken: string): Promise<{ ok: true; sub: string; name: string } | { ok: false; error: string }> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { sub?: string; name?: string; message?: string };
  if (!res.ok || !data.sub) {
    return { ok: false, error: data.message || `LinkedIn userinfo ${res.status}` };
  }
  return {
    ok: true,
    sub: data.sub,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "LinkedIn member",
  };
}

export async function saveLinkedInTokensFromOAuthCode(
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET (16+ chars).",
    };
  }
  if (!isLinkedInOAuthAppConfigured()) {
    return { ok: false, error: "Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET." };
  }

  const tok = await exchangeLinkedInCode(code, redirectUri);
  if (!tok.ok) return tok;

  const meta = await fetchLinkedInUserMeta(tok.token);
  if (!meta.ok) return meta;

  const authorUrn = normalizePersonUrn(meta.sub);
  let accounts = await listLinkedInConnectedAccounts();

  if (accounts.length >= MAX_SOCIAL_CONNECTIONS_PER_PLATFORM) {
    return {
      ok: false,
      error: `Maximum ${MAX_SOCIAL_CONNECTIONS_PER_PLATFORM} LinkedIn accounts connected. Remove one first.`,
    };
  }

  if (accounts.some((a) => a.authorUrn === authorUrn)) {
    return { ok: false, error: "This LinkedIn profile is already connected." };
  }

  accounts.push({
    accountId: randomUUID(),
    authorUrn,
    displayLabel: meta.name,
    encryptedAccessToken: encryptSchedulingSecret(tok.token),
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
