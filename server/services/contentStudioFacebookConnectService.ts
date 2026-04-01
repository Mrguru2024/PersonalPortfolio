/**
 * Content Studio — Facebook Page OAuth (super-user integrations).
 * Up to MAX_FACEBOOK_CONNECTIONS Pages; tokens encrypted in scheduling_integration_configs.
 * Falls back to FACEBOOK_ACCESS_TOKEN + FACEBOOK_PAGE_ID env when no OAuth rows.
 */

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { schedulingIntegrationConfigs } from "@shared/schedulingSchema";
import { MAX_SOCIAL_CONNECTIONS_PER_PLATFORM } from "@server/lib/contentStudioSocialConstants";
import {
  canEncryptSchedulingSecrets,
  decryptSchedulingSecret,
  encryptSchedulingSecret,
} from "@server/lib/schedulingSecrets";

/** HttpOnly cookie: short-lived encrypted list of Pages to choose after Meta OAuth (multi-Page accounts). */
export const FB_CS_PAGE_PICK_COOKIE = "fb_cs_page_pick";

export type FacebookPagePickEntry = {
  id: string;
  name: string;
  access_token: string;
};

export function serializeFacebookPagePickCookie(pages: FacebookPagePickEntry[]): string {
  return encryptSchedulingSecret(
    JSON.stringify({ v: 1 as const, pages } satisfies { v: 1; pages: FacebookPagePickEntry[] }),
  );
}

export function parseFacebookPagePickCookie(blob: string): FacebookPagePickEntry[] | null {
  try {
    const raw = decryptSchedulingSecret(blob);
    const data = JSON.parse(raw) as { v?: number; pages?: unknown };
    if (data.v !== 1 || !Array.isArray(data.pages)) return null;
    const out: FacebookPagePickEntry[] = [];
    for (const row of data.pages) {
      if (typeof row !== "object" || row === null) continue;
      const o = row as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id.trim() : "";
      const name = typeof o.name === "string" ? o.name : "Facebook Page";
      const access_token = typeof o.access_token === "string" ? o.access_token : "";
      if (id && access_token) out.push({ id, name, access_token });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

const PROVIDER = "content_studio_facebook";
/** @deprecated Use MAX_SOCIAL_CONNECTIONS_PER_PLATFORM — same numeric cap. */
export const MAX_FACEBOOK_CONNECTIONS = MAX_SOCIAL_CONNECTIONS_PER_PLATFORM;

const KEY_ACCOUNTS = "accounts";
/** Legacy flat keys (single Page) — migrated into accounts[] on read. */
const KEY_ENC_TOKEN = "encryptedPageAccessToken";
const KEY_PAGE_ID = "pageId";
const KEY_PAGE_NAME = "pageName";

export type FacebookConnectedAccount = {
  accountId: string;
  pageId: string;
  pageName: string;
  encryptedPageAccessToken: string;
};

export type ContentStudioFacebookConfigJson = {
  [KEY_ACCOUNTS]?: FacebookConnectedAccount[];
  [KEY_ENC_TOKEN]?: string;
  [KEY_PAGE_ID]?: string;
  [KEY_PAGE_NAME]?: string;
};

function graphApiOrigin(): string {
  const v = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  const ver = v.startsWith("v") ? v : `v${v}`;
  return `https://graph.facebook.com/${ver}`;
}

export function isFacebookAppConfiguredForOAuth(): boolean {
  return !!(process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_APP_SECRET?.trim());
}

export function getFacebookOAuthRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/integrations/social/facebook/callback`;
}

/** Login dialog on www.facebook.com — API version in path (e.g. v21.0). */
export function buildFacebookAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = process.env.FACEBOOK_APP_ID!.trim();
  const v = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  const ver = v.startsWith("v") ? v : `v${v}`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"].join(","),
    state,
  });
  return `https://www.facebook.com/${ver}/dialog/oauth?${params.toString()}`;
}

async function getRow() {
  const [row] = await db
    .select()
    .from(schedulingIntegrationConfigs)
    .where(eq(schedulingIntegrationConfigs.provider, PROVIDER))
    .limit(1);
  return row ?? null;
}

function accountsFromConfigJson(raw: Record<string, unknown>): FacebookConnectedAccount[] {
  const cfg = raw as ContentStudioFacebookConfigJson;
  const list = cfg[KEY_ACCOUNTS];
  if (Array.isArray(list) && list.length > 0) {
    return list.filter(
      (a): a is FacebookConnectedAccount =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as FacebookConnectedAccount).accountId === "string" &&
        typeof (a as FacebookConnectedAccount).pageId === "string" &&
        typeof (a as FacebookConnectedAccount).encryptedPageAccessToken === "string",
    );
  }
  const enc = cfg[KEY_ENC_TOKEN];
  const pageId = cfg[KEY_PAGE_ID];
  const pageName = cfg[KEY_PAGE_NAME];
  if (typeof enc === "string" && enc.trim() && typeof pageId === "string" && pageId.trim()) {
    return [
      {
        accountId: randomUUID(),
        pageId: pageId.trim(),
        pageName: typeof pageName === "string" && pageName.trim() ? pageName.trim() : "Facebook Page",
        encryptedPageAccessToken: enc,
      },
    ];
  }
  return [];
}

/** Load connected accounts; migrates legacy single-Page shape to accounts[] on disk. */
export async function listFacebookConnectedAccounts(): Promise<FacebookConnectedAccount[]> {
  const row = await getRow();
  if (!row?.enabled) return [];
  const accounts = accountsFromConfigJson((row.configJson || {}) as Record<string, unknown>);
  if (accounts.length === 0) return [];

  const cfg = (row.configJson || {}) as ContentStudioFacebookConfigJson;
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

export async function listFacebookAccountSummaries(): Promise<
  { accountId: string; pageId: string; pageName: string }[]
> {
  const accounts = await listFacebookConnectedAccounts();
  return accounts.map((a) => ({
    accountId: a.accountId,
    pageId: a.pageId,
    pageName: a.pageName,
  }));
}

export async function facebookOAuthConnectionCount(): Promise<number> {
  return (await listFacebookConnectedAccounts()).length;
}

export async function isContentStudioFacebookOAuthConnected(): Promise<boolean> {
  return (await facebookOAuthConnectionCount()) > 0;
}

/**
 * Resolve credentials for publish.
 * @param accountId Optional — from platform target `facebook_page:<accountId>`. If omitted, uses first Page by name, then env.
 */
export async function getFacebookPageCredentialsResolved(
  accountId?: string | null,
): Promise<{ token: string; pageId: string } | null> {
  const accounts = await listFacebookConnectedAccounts();

  if (accountId?.trim()) {
    const id = accountId.trim();
    const hit = accounts.find((a) => a.accountId === id);
    if (hit) {
      try {
        return { token: decryptSchedulingSecret(hit.encryptedPageAccessToken), pageId: hit.pageId };
      } catch {
        return null;
      }
    }
    return null;
  }

  if (accounts.length > 0) {
    const sorted = [...accounts].sort((a, b) =>
      (a.pageName || "").localeCompare(b.pageName || "", undefined, { sensitivity: "base" }),
    );
    const first = sorted[0];
    try {
      return {
        token: decryptSchedulingSecret(first.encryptedPageAccessToken),
        pageId: first.pageId,
      };
    } catch {
      /* fall through to env */
    }
  }

  const token = (process.env.FACEBOOK_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN)?.trim();
  const pid = (process.env.FACEBOOK_PAGE_ID ?? process.env.META_PAGE_ID)?.trim();
  if (token && pid) return { token, pageId: pid };
  return null;
}

export async function disconnectContentStudioFacebook(accountId?: string | null): Promise<void> {
  const existing = await getRow();
  if (!existing) return;

  if (!accountId?.trim()) {
    await db
      .update(schedulingIntegrationConfigs)
      .set({
        enabled: false,
        configJson: {},
        updatedAt: new Date(),
      })
      .where(eq(schedulingIntegrationConfigs.id, existing.id));
    return;
  }

  if (!existing.enabled) return;

  const id = accountId.trim();
  const accounts = await listFacebookConnectedAccounts();
  const next = accounts.filter((a) => a.accountId !== id).slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);

  if (next.length === 0) {
    await db
      .update(schedulingIntegrationConfigs)
      .set({
        enabled: false,
        configJson: {},
        updatedAt: new Date(),
      })
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

async function exchangeCodeForUserToken(code: string, redirectUri: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientId = process.env.FACEBOOK_APP_ID!.trim();
  const clientSecret = process.env.FACEBOOK_APP_SECRET!.trim();
  const url = new URL(`${graphApiOrigin()}/oauth/access_token`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string } };
  if (!res.ok) {
    const msg = typeof data.error === "object" && data.error?.message ? data.error.message : `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  if (!data.access_token) return { ok: false, error: "No access_token from Facebook" };
  return { ok: true, token: data.access_token };
}

async function exchangeForLongLivedUserToken(shortLivedUserToken: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientId = process.env.FACEBOOK_APP_ID!.trim();
  const clientSecret = process.env.FACEBOOK_APP_SECRET!.trim();
  const url = new URL(`${graphApiOrigin()}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("fb_exchange_token", shortLivedUserToken);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string } };
  if (!res.ok || !data.access_token) {
    const msg = typeof data.error === "object" && data.error?.message ? data.error.message : `HTTP ${res.status}`;
    return { ok: false, error: msg || "Long-lived exchange failed" };
  }
  return { ok: true, token: data.access_token };
}

type PageAccount = { access_token?: string; id?: string; name?: string };

async function fetchManagedPages(userAccessToken: string): Promise<{ ok: true; pages: PageAccount[] } | { ok: false; error: string }> {
  const url = new URL(`${graphApiOrigin()}/me/accounts`);
  url.searchParams.set("access_token", userAccessToken);
  url.searchParams.set("fields", "id,name,access_token");
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { data?: PageAccount[]; error?: { message?: string } };
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    return { ok: false, error: msg };
  }
  const pages = Array.isArray(data.data) ? data.data : [];
  return { ok: true, pages };
}

async function persistFacebookAccounts(accounts: FacebookConnectedAccount[]): Promise<void> {
  const next = accounts.slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);
  await db
    .insert(schedulingIntegrationConfigs)
    .values({
      provider: PROVIDER,
      enabled: true,
      configJson: { [KEY_ACCOUNTS]: next } as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: schedulingIntegrationConfigs.provider,
      set: {
        enabled: true,
        configJson: { [KEY_ACCOUNTS]: next } as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
}

async function appendNewFacebookPage(page: {
  id: string;
  name?: string;
  access_token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET (16+ chars).",
    };
  }
  if (!page.id?.trim() || !page.access_token?.trim()) {
    return { ok: false, error: "Invalid Page credentials." };
  }
  let accounts = await listFacebookConnectedAccounts();
  if (accounts.length >= MAX_SOCIAL_CONNECTIONS_PER_PLATFORM) {
    return {
      ok: false,
      error: `You already have ${MAX_SOCIAL_CONNECTIONS_PER_PLATFORM} Facebook Pages connected. Remove one before adding another.`,
    };
  }
  const pid = page.id.trim();
  if (accounts.some((a) => a.pageId === pid)) {
    return { ok: false, error: "This Page is already connected." };
  }
  accounts.push({
    accountId: randomUUID(),
    pageId: pid,
    pageName: page.name?.trim() || "Facebook Page",
    encryptedPageAccessToken: encryptSchedulingSecret(page.access_token.trim()),
  });
  await persistFacebookAccounts(accounts);
  return { ok: true };
}

export type FacebookOAuthCompleteResult =
  | { kind: "saved" }
  | { kind: "pick"; candidates: FacebookPagePickEntry[] }
  | { kind: "error"; error: string };

/** Exchange OAuth code; saves immediately when exactly one new Page is available, else returns pick list for admin UI. */
export async function completeFacebookContentStudioOAuth(
  code: string,
  redirectUri: string,
): Promise<FacebookOAuthCompleteResult> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      kind: "error",
      error: "Cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET (16+ chars).",
    };
  }
  if (!isFacebookAppConfiguredForOAuth()) {
    return { kind: "error", error: "FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set." };
  }
  const step1 = await exchangeCodeForUserToken(code, redirectUri);
  if (!step1.ok) return { kind: "error", error: step1.error };
  const long = await exchangeForLongLivedUserToken(step1.token);
  if (!long.ok) return { kind: "error", error: long.error };

  const pages = await fetchManagedPages(long.token);
  if (!pages.ok) return { kind: "error", error: pages.error };
  if (pages.pages.length === 0) {
    return {
      kind: "error",
      error:
        "No Facebook Pages found for this account. Create a Page or grant Page access to this app, then try again.",
    };
  }

  const accounts = await listFacebookConnectedAccounts();
  if (accounts.length >= MAX_SOCIAL_CONNECTIONS_PER_PLATFORM) {
    return {
      kind: "error",
      error: `You already have ${MAX_SOCIAL_CONNECTIONS_PER_PLATFORM} Facebook Pages connected. Remove one before adding another.`,
    };
  }

  const sorted = [...pages.pages]
    .filter((p) => p.access_token && p.id)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));

  const usedPageIds = new Set(accounts.map((a) => a.pageId));
  const candidates: FacebookPagePickEntry[] = sorted
    .filter((p) => p.id && p.access_token && !usedPageIds.has(String(p.id)))
    .map((p) => ({
      id: String(p.id),
      name: (p.name && String(p.name).trim()) || "Facebook Page",
      access_token: String(p.access_token),
    }));

  if (candidates.length === 0) {
    return {
      kind: "error",
      error:
        "No new Page to add — every Page returned for this login is already connected, or none have access tokens.",
    };
  }

  if (candidates.length === 1) {
    const r = await appendNewFacebookPage(candidates[0]);
    if (!r.ok) return { kind: "error", error: r.error };
    return { kind: "saved" };
  }

  return { kind: "pick", candidates };
}

/** Add one Page after admin picks from multi-Page OAuth result (cookie payload). */
export async function addFacebookConnectedPageFromPick(
  pageId: string,
  candidates: FacebookPagePickEntry[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = pageId.trim();
  const entry = candidates.find((p) => p.id === id);
  if (!entry) return { ok: false, error: "Selected Page not found in this session. Connect again." };
  return appendNewFacebookPage(entry);
}

/** @deprecated Prefer completeFacebookContentStudioOAuth (supports multi-Page picker). */
export async function saveFacebookPageTokensFromOAuthCode(
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await completeFacebookContentStudioOAuth(code, redirectUri);
  if (r.kind === "saved") return { ok: true };
  if (r.kind === "error") return { ok: false, error: r.error };
  return {
    ok: false,
    error:
      "Several Facebook Pages are available. Open Connections & email and choose which Page to use.",
  };
}
