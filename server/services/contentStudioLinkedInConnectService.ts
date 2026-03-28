/**
 * Content Studio — LinkedIn OAuth (up to MAX_SOCIAL_CONNECTIONS_PER_PLATFORM targets per deployment).
 * One sign-in can add your member profile plus LinkedIn **company pages** you administer (same token).
 * Calendar entries pick `linkedin:<accountId>` per post so you can schedule for Ascendra brands, other internal
 * businesses, or future client orgs on this site; hard multi-tenant isolation is still “separate deployment”
 * until workspace-scoped credentials exist elsewhere in Ascendra OS.
 *
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
  /** Person URN for the login that created this row; company rows share the member’s token. */
  oauthMemberUrn?: string;
  accountKind?: "member" | "organization";
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

/** Default scopes: personal posts + company pages you admin. Override with LINKEDIN_OAUTH_SCOPES if your app uses a slimmer allowlist. */
const DEFAULT_LINKEDIN_OAUTH_SCOPES =
  "openid profile w_member_social w_organization_social r_organization_admin";

export function linkedInOAuthScopesForAuthorizeUrl(): string {
  const raw = process.env.LINKEDIN_OAUTH_SCOPES?.trim();
  if (raw) return raw.split(/\s+/).filter(Boolean).join(" ");
  return DEFAULT_LINKEDIN_OAUTH_SCOPES;
}

export function buildLinkedInAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const scope = linkedInOAuthScopesForAuthorizeUrl();
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
    ).map((a) => ({
      ...a,
      oauthMemberUrn:
        typeof a.oauthMemberUrn === "string" && a.oauthMemberUrn.trim()
          ? a.oauthMemberUrn.trim()
          : undefined,
      accountKind:
        a.accountKind === "member" || a.accountKind === "organization" ? a.accountKind : undefined,
    }));
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
        oauthMemberUrn: urn.trim().startsWith("urn:li:person:") ? urn.trim() : undefined,
        accountKind: urn.trim().startsWith("urn:li:organization:") ? "organization" : "member",
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
  { accountId: string; authorUrn: string; displayLabel: string; accountKind?: "member" | "organization" }[]
> {
  const accounts = await listLinkedInConnectedAccounts();
  return accounts.map((a) => ({
    accountId: a.accountId,
    authorUrn: a.authorUrn,
    displayLabel: a.displayLabel,
    accountKind:
      a.accountKind ??
      (a.authorUrn.startsWith("urn:li:organization:") ? "organization" : "member"),
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
  const id = accountId.trim();
  const target = accounts.find((a) => a.accountId === id);
  let next: LinkedInConnectedAccount[];
  if (!target) {
    next = accounts.filter((a) => a.accountId !== id);
  } else {
    const kind =
      target.accountKind ??
      (target.authorUrn.startsWith("urn:li:organization:") ? "organization" : "member");
    if (kind === "member") {
      const personUrn = target.authorUrn;
      next = accounts.filter(
        (a) => a.authorUrn !== personUrn && a.oauthMemberUrn !== personUrn,
      );
    } else {
      next = accounts.filter((a) => a.accountId !== id);
    }
  }
  next = next.slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);

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

type OrgAclElement = {
  organization?: string;
  "organization~"?: {
    localizedName?: string | Record<string, string>;
    name?: { localized?: Record<string, string> };
    vanityName?: string;
  };
};

function pickLocalizedName(decorated: OrgAclElement["organization~"]): string {
  if (!decorated) return "";
  const ln = decorated.localizedName;
  if (typeof ln === "string" && ln.trim()) return ln.trim();
  if (ln && typeof ln === "object" && !Array.isArray(ln)) {
    const o = ln as Record<string, string>;
    const name = o.en_US || o.en || Object.values(o)[0];
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  const loc = decorated.name?.localized;
  if (loc && typeof loc === "object") {
    const name = loc.en_US || loc.en || Object.values(loc)[0];
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  if (typeof decorated.vanityName === "string" && decorated.vanityName.trim()) {
    return decorated.vanityName.trim();
  }
  return "";
}

/**
 * Company pages the signed-in member can administer (requires r_organization_admin + relevant products on the LinkedIn app).
 */
async function fetchLinkedInAdministratorOrganizations(
  accessToken: string,
): Promise<{ ok: true; orgs: { urn: string; name: string }[] } | { ok: false; error: string }> {
  const linkedInVersion = process.env.LINKEDIN_API_VERSION?.trim() || "202411";
  const tryUrls = [
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=50&projection=(elements*(organization~(localizedName,vanityName)))",
    "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=50",
  ];
  let lastErr = "Unknown error";
  for (const url of tryUrls) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": linkedInVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      elements?: OrgAclElement[];
      message?: string;
    };
    if (!res.ok) {
      lastErr = data.message || `LinkedIn organizationAcls ${res.status}`;
      continue;
    }
    const elements = data.elements ?? [];
    const orgs: { urn: string; name: string }[] = [];
    const seenUrns = new Set<string>();
    for (const el of elements) {
      const urn = typeof el.organization === "string" ? el.organization.trim() : "";
      if (!urn.startsWith("urn:li:organization:")) continue;
      if (seenUrns.has(urn)) continue;
      seenUrns.add(urn);
      let name = pickLocalizedName(el["organization~"]);
      if (!name) {
        const id = urn.replace("urn:li:organization:", "");
        name = `Organization ${id}`;
      }
      orgs.push({ urn, name });
    }
    return { ok: true, orgs };
  }
  return { ok: false, error: lastErr };
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
): Promise<{ ok: true; notice?: string } | { ok: false; error: string }> {
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

  const memberUrn = normalizePersonUrn(meta.sub);
  const existingAll = await listLinkedInConnectedAccounts();

  if (existingAll.some((a) => a.authorUrn === memberUrn)) {
    return { ok: false, error: "This LinkedIn profile is already connected." };
  }

  const orgFetch = await fetchLinkedInAdministratorOrganizations(tok.token);
  if (!orgFetch.ok) {
    console.warn(
      "[contentStudioLinkedIn] Company pages not loaded (member-only connect).",
      orgFetch.error,
    );
  }
  const orgs = orgFetch.ok ? orgFetch.orgs : [];

  const encToken = encryptSchedulingSecret(tok.token);
  const memberRow: LinkedInConnectedAccount = {
    accountId: randomUUID(),
    authorUrn: memberUrn,
    displayLabel: meta.name,
    encryptedAccessToken: encToken,
    oauthMemberUrn: memberUrn,
    accountKind: "member",
  };

  const orgSeen = new Set<string>();
  const orgRows: LinkedInConnectedAccount[] = [];
  for (const o of orgs) {
    if (orgSeen.has(o.urn)) continue;
    orgSeen.add(o.urn);
    orgRows.push({
      accountId: randomUUID(),
      authorUrn: o.urn,
      displayLabel: `Page · ${o.name}`,
      encryptedAccessToken: encToken,
      oauthMemberUrn: memberUrn,
      accountKind: "organization",
    });
  }

  let newBundle = [memberRow, ...orgRows];
  const others = existingAll.filter(
    (a) => a.authorUrn !== memberUrn && a.oauthMemberUrn !== memberUrn,
  );
  const budget = MAX_SOCIAL_CONNECTIONS_PER_PLATFORM - others.length;
  if (budget < 1) {
    return {
      ok: false,
      error: `Maximum ${MAX_SOCIAL_CONNECTIONS_PER_PLATFORM} LinkedIn targets on this site. Disconnect another profile or company page first.`,
    };
  }

  let notice: string | undefined;
  if (newBundle.length > budget) {
    notice = `Saved ${budget} of ${newBundle.length} targets (your profile first, then company pages). Disconnect unused targets or raise the limit in code if needed.`;
    newBundle = newBundle.slice(0, budget);
  }

  const accounts = [...others, ...newBundle].slice(0, MAX_SOCIAL_CONNECTIONS_PER_PLATFORM);

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

  return notice ? { ok: true, notice } : { ok: true };
}
