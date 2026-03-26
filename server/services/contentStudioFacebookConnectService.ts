/**
 * Content Studio — Facebook Page OAuth (super-user integrations).
 * Stores page access token encrypted in scheduling_integration_configs.
 * Falls back to FACEBOOK_ACCESS_TOKEN + FACEBOOK_PAGE_ID env when not connected via UI.
 */

import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { schedulingIntegrationConfigs } from "@shared/schedulingSchema";
import {
  canEncryptSchedulingSecrets,
  decryptSchedulingSecret,
  encryptSchedulingSecret,
} from "@server/lib/schedulingSecrets";

const PROVIDER = "content_studio_facebook";
const KEY_ENC_TOKEN = "encryptedPageAccessToken";
const KEY_PAGE_ID = "pageId";
const KEY_PAGE_NAME = "pageName";

export type ContentStudioFacebookConfigJson = {
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

export async function isContentStudioFacebookOAuthConnected(): Promise<boolean> {
  const row = await getRow();
  if (!row?.enabled) return false;
  const cfg = (row.configJson || {}) as ContentStudioFacebookConfigJson;
  return typeof cfg[KEY_ENC_TOKEN] === "string" && typeof cfg[KEY_PAGE_ID] === "string";
}

/** Prefer OAuth row; else env FACEBOOK_ACCESS_TOKEN + FACEBOOK_PAGE_ID (or META_*). */
export async function getFacebookPageCredentialsResolved(): Promise<{ token: string; pageId: string } | null> {
  const row = await getRow();
  if (row?.enabled) {
    const cfg = (row.configJson || {}) as ContentStudioFacebookConfigJson;
    const enc = cfg[KEY_ENC_TOKEN];
    const pageId = cfg[KEY_PAGE_ID];
    if (typeof enc === "string" && enc.length > 0 && typeof pageId === "string" && pageId.length > 0) {
      try {
        return { token: decryptSchedulingSecret(enc), pageId };
      } catch {
        /* fall through */
      }
    }
  }
  const token = (process.env.FACEBOOK_ACCESS_TOKEN ?? process.env.META_ACCESS_TOKEN)?.trim();
  const pid = (process.env.FACEBOOK_PAGE_ID ?? process.env.META_PAGE_ID)?.trim();
  if (token && pid) return { token, pageId: pid };
  return null;
}

export async function getContentStudioFacebookDisplayInfo(): Promise<{ pageId: string; pageName: string } | null> {
  const row = await getRow();
  if (!row?.enabled) return null;
  const cfg = (row.configJson || {}) as ContentStudioFacebookConfigJson;
  const id = cfg[KEY_PAGE_ID];
  const name = cfg[KEY_PAGE_NAME];
  if (typeof id === "string" && id.length > 0) {
    return { pageId: id, pageName: typeof name === "string" && name.trim() ? name : "Facebook Page" };
  }
  return null;
}

export async function disconnectContentStudioFacebook(): Promise<void> {
  const existing = await getRow();
  if (!existing) return;
  await db
    .update(schedulingIntegrationConfigs)
    .set({
      enabled: false,
      configJson: {},
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

export async function saveFacebookPageTokensFromOAuthCode(
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET (16+ chars).",
    };
  }
  if (!isFacebookAppConfiguredForOAuth()) {
    return { ok: false, error: "FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set." };
  }
  const step1 = await exchangeCodeForUserToken(code, redirectUri);
  if (!step1.ok) return step1;
  const long = await exchangeForLongLivedUserToken(step1.token);
  if (!long.ok) return long;

  const pages = await fetchManagedPages(long.token);
  if (!pages.ok) return pages;
  if (pages.pages.length === 0) {
    return {
      ok: false,
      error:
        "No Facebook Pages found for this account. Create a Page or grant Page access to this app, then try again.",
    };
  }
  const sorted = [...pages.pages].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const page = sorted.find((p) => p.access_token && p.id) ?? sorted[0];
  if (!page?.access_token || !page.id) {
    return { ok: false, error: "Facebook returned pages without access tokens." };
  }

  const encrypted = encryptSchedulingSecret(page.access_token);
  const configJson: ContentStudioFacebookConfigJson = {
    [KEY_ENC_TOKEN]: encrypted,
    [KEY_PAGE_ID]: page.id,
    [KEY_PAGE_NAME]: page.name ?? "Facebook Page",
  };

  await db
    .insert(schedulingIntegrationConfigs)
    .values({ provider: PROVIDER, enabled: true, configJson })
    .onConflictDoUpdate({
      target: schedulingIntegrationConfigs.provider,
      set: { enabled: true, configJson, updatedAt: new Date() },
    });

  return { ok: true };
}
