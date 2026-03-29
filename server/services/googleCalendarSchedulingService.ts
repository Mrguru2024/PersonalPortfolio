/**
 * Google Calendar OAuth + event sync for native Ascendra bookings (optional integration).
 * Uses GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET (separate from login OAuth).
 * Each approved admin can connect their own calendar; legacy single-row config remains as fallback.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@server/db";
import {
  schedulingAdminGoogleCalendar,
  schedulingAppointments,
  schedulingIntegrationConfigs,
} from "@shared/schedulingSchema";
import {
  canEncryptSchedulingSecrets,
  decryptSchedulingSecret,
  encryptSchedulingSecret,
} from "@server/lib/schedulingSecrets";
import type { SchedulingAppointment } from "@shared/schedulingSchema";

const PROVIDER = "google_calendar";
const CONFIG_RT_KEY = "encryptedRefreshToken";
const CONFIG_CAL_KEY = "calendarId";

/** HttpOnly OAuth state cookie (mirrors signed `state` query param). See `/api/admin/integrations/google-calendar/start`. */
export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "gcal_oauth_state";

export type GoogleCalendarConfigJson = {
  [CONFIG_RT_KEY]?: string;
  [CONFIG_CAL_KEY]?: string;
};

/**
 * Normalizes values from .env / Vercel (common causes of invalid_client on every environment:
 * wrapping quotes, BOM, pasted newlines, literal \\n in secrets).
 */
function normalizeGoogleCalendarOAuthEnvValue(value: string | undefined): string {
  if (value == null || typeof value !== "string") return "";
  let t = value.trim();
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1).trim();
  if (t.length >= 2) {
    const open = t[0];
    const close = t[t.length - 1];
    if (
      (open === '"' && close === '"') ||
      (open === "'" && close === "'") ||
      (open === "`" && close === "`")
    ) {
      t = t.slice(1, -1).trim();
    }
  }
  t = t.replace(/\\n/g, "").replace(/\r/g, "").replace(/\n/g, "");
  return t.trim();
}

export function getGoogleCalendarOAuthClientId(): string {
  return normalizeGoogleCalendarOAuthEnvValue(process.env.GOOGLE_CALENDAR_CLIENT_ID);
}

export function getGoogleCalendarOAuthClientSecret(): string {
  return normalizeGoogleCalendarOAuthEnvValue(process.env.GOOGLE_CALENDAR_CLIENT_SECRET);
}

export function isGoogleCalendarOAuthConfigured(): boolean {
  return !!(getGoogleCalendarOAuthClientId() && getGoogleCalendarOAuthClientSecret());
}

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

function tokenErrorLooksLikeClientAuth(j: { error?: string }): boolean {
  const e = String(j?.error ?? "").toLowerCase();
  return e === "invalid_client" || e === "unauthorized_client";
}

/**
 * Google accepts client credentials in the POST body or via RFC 6749 HTTP Basic.
 * Some secrets / host configs only succeed with Basic — try that first, then form body.
 */
async function postGoogleCalendarTokenRequest(
  formWithoutClientCreds: URLSearchParams,
  formWithClientCreds: URLSearchParams,
): Promise<Response> {
  const clientId = getGoogleCalendarOAuthClientId();
  const clientSecret = getGoogleCalendarOAuthClientSecret();
  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const resBasic = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formWithoutClientCreds,
  });
  const text = await resBasic.text();
  let j: { error?: string } = {};
  try {
    j = JSON.parse(text) as { error?: string };
  } catch {
    /* non-JSON error body */
  }
  if (resBasic.ok || !tokenErrorLooksLikeClientAuth(j)) {
    return new Response(text, {
      status: resBasic.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formWithClientCreds,
  });
}

export function getGoogleCalendarRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/integrations/google-calendar/callback`;
}

/** Scopes requested at authorize time — add the same URLs under OAuth consent screen → Scopes in Google Cloud. */
export const GOOGLE_CALENDAR_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export function buildGoogleCalendarAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = getGoogleCalendarOAuthClientId();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [...GOOGLE_CALENDAR_OAUTH_SCOPES].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function hasEncryptedRefreshToken(cfg: unknown): boolean {
  const j = (cfg || {}) as GoogleCalendarConfigJson;
  return typeof j[CONFIG_RT_KEY] === "string" && j[CONFIG_RT_KEY]!.length > 0;
}

/** Legacy: one row in scheduling_integration_configs (pre per-admin). */
export async function getLegacyGoogleCalendarIntegrationRow() {
  const [row] = await db
    .select()
    .from(schedulingIntegrationConfigs)
    .where(eq(schedulingIntegrationConfigs.provider, PROVIDER))
    .limit(1);
  return row ?? null;
}

export async function getAdminGoogleCalendarRow(userId: number) {
  const [row] = await db
    .select()
    .from(schedulingAdminGoogleCalendar)
    .where(and(eq(schedulingAdminGoogleCalendar.userId, userId), eq(schedulingAdminGoogleCalendar.enabled, true)))
    .limit(1);
  return row ?? null;
}

export async function getGoogleCalendarIntegrationRow() {
  return getLegacyGoogleCalendarIntegrationRow();
}

export async function isGoogleCalendarPersonalConnected(userId: number): Promise<boolean> {
  if (!isGoogleCalendarOAuthConfigured() || !Number.isFinite(userId) || userId <= 0) return false;
  const row = await getAdminGoogleCalendarRow(userId);
  if (!row?.enabled) return false;
  return hasEncryptedRefreshToken(row.configJson);
}

export async function isGoogleCalendarLegacyConnected(): Promise<boolean> {
  if (!isGoogleCalendarOAuthConfigured()) return false;
  const row = await getLegacyGoogleCalendarIntegrationRow();
  if (!row?.enabled) return false;
  return hasEncryptedRefreshToken(row.configJson);
}

/** True if this admin has a personal connection or the site still uses legacy shared tokens. */
export async function isGoogleCalendarConnectedForUser(userId: number): Promise<boolean> {
  return (await isGoogleCalendarPersonalConnected(userId)) || (await isGoogleCalendarLegacyConnected());
}

/** @deprecated Prefer isGoogleCalendarConnectedForUser(sessionUserId) for UI; kept for callers without user context. */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  return isGoogleCalendarLegacyConnected();
}

async function getRefreshTokenFromConfigJson(configJson: unknown): Promise<string | null> {
  const enc = (configJson as GoogleCalendarConfigJson)[CONFIG_RT_KEY];
  if (!enc || typeof enc !== "string") return null;
  try {
    return decryptSchedulingSecret(enc);
  } catch {
    return null;
  }
}

/**
 * Prefer the host admin’s calendar; fall back to legacy shared integration.
 */
async function resolveConfigForHost(hostUserId: number | null): Promise<{
  configJson: GoogleCalendarConfigJson;
  source: "admin" | "legacy";
} | null> {
  if (hostUserId != null && hostUserId > 0) {
    const row = await getAdminGoogleCalendarRow(hostUserId);
    if (row?.enabled && hasEncryptedRefreshToken(row.configJson)) {
      return { configJson: row.configJson as GoogleCalendarConfigJson, source: "admin" };
    }
  }
  const legacy = await getLegacyGoogleCalendarIntegrationRow();
  if (legacy?.enabled && hasEncryptedRefreshToken(legacy.configJson)) {
    return { configJson: legacy.configJson as GoogleCalendarConfigJson, source: "legacy" };
  }
  return null;
}

async function runGoogleCalendarPing(resolved: {
  configJson: GoogleCalendarConfigJson;
  source: "admin" | "legacy";
}): Promise<{ ok: boolean; message: string }> {
  const tok = await getGoogleCalendarAccessTokenForConfig(resolved.configJson);
  if (!tok.ok) return { ok: false, message: tok.error };
  const calId = encodeURIComponent(calendarIdFromConfigJson(resolved.configJson));
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}`, {
    headers: { Authorization: `Bearer ${tok.token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    return {
      ok: false,
      message: err.error?.message || `Calendar API ${res.status}`,
    };
  }
  const j = (await res.json()) as { summary?: string };
  const scope =
    resolved.source === "admin" ? "your calendar" : "the shared (legacy) site calendar";
  return { ok: true, message: `Connected (${scope}: ${j.summary || calId}).` };
}

export async function getGoogleCalendarAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  const legacy = await getLegacyGoogleCalendarIntegrationRow();
  if (!legacy?.enabled) {
    return { ok: false, error: "Google Calendar not connected or OAuth client missing." };
  }
  const rt = await getRefreshTokenFromConfigJson(legacy.configJson);
  return refreshAccessTokenWithRefreshToken(rt);
}

async function refreshAccessTokenWithRefreshToken(
  refreshToken: string | null
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientId = getGoogleCalendarOAuthClientId();
  const clientSecret = getGoogleCalendarOAuthClientSecret();
  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, error: "Google Calendar not connected or OAuth client missing." };
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    const detail =
      typeof data.error_description === "string" && data.error_description.trim()
        ? data.error_description.trim()
        : "";
    const code = typeof data.error === "string" ? data.error.trim() : "";
    const msg =
      detail || code
        ? [code, detail].filter(Boolean).join(": ")
        : `Token refresh failed (${res.status})`;
    return { ok: false, error: msg };
  }
  return { ok: true, token: data.access_token };
}

async function getGoogleCalendarAccessTokenForConfig(
  configJson: GoogleCalendarConfigJson
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const rt = await getRefreshTokenFromConfigJson(configJson);
  return refreshAccessTokenWithRefreshToken(rt);
}

export async function saveGoogleCalendarTokensFromCode(
  code: string,
  redirectUri: string,
  userId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(userId) || userId <= 0) {
    return { ok: false, error: "Invalid user." };
  }
  if (!canEncryptSchedulingSecrets()) {
    return {
      ok: false,
      error: "Server cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET.",
    };
  }
  const clientId = getGoogleCalendarOAuthClientId();
  const clientSecret = getGoogleCalendarOAuthClientSecret();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "GOOGLE_CALENDAR_CLIENT_ID / SECRET not set." };
  }
  const minimal = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const full = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await postGoogleCalendarTokenRequest(minimal, full);
  const data = (await res.json().catch(() => ({}))) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok) {
    const detail =
      typeof data.error_description === "string" && data.error_description.trim()
        ? data.error_description.trim()
        : "";
    const code = typeof data.error === "string" ? data.error.trim() : "";
    const msg =
      detail || code
        ? [code, detail].filter(Boolean).join(": ")
        : `Token exchange failed (${res.status})`;
    return { ok: false, error: msg };
  }
  const rt = data.refresh_token;
  if (!rt) {
    return {
      ok: false,
      error:
        "No refresh_token returned. Revoke app access in Google Account settings and reconnect with prompt=consent.",
    };
  }
  const encrypted = encryptSchedulingSecret(rt);
  const [existing] = await db
    .select()
    .from(schedulingAdminGoogleCalendar)
    .where(eq(schedulingAdminGoogleCalendar.userId, userId))
    .limit(1);
  const prev = (existing?.configJson || {}) as GoogleCalendarConfigJson;
  const configJson: GoogleCalendarConfigJson = {
    ...prev,
    [CONFIG_RT_KEY]: encrypted,
    [CONFIG_CAL_KEY]: prev[CONFIG_CAL_KEY] || "primary",
  };
  await db
    .insert(schedulingAdminGoogleCalendar)
    .values({ userId, enabled: true, configJson })
    .onConflictDoUpdate({
      target: schedulingAdminGoogleCalendar.userId,
      set: { enabled: true, configJson, updatedAt: new Date() },
    });
  return { ok: true };
}

/** Remove this admin’s calendar link. If they have no personal row, clears legacy shared config (previous behavior). */
export async function disconnectGoogleCalendarForUser(userId: number): Promise<void> {
  const personal = await db
    .select()
    .from(schedulingAdminGoogleCalendar)
    .where(eq(schedulingAdminGoogleCalendar.userId, userId))
    .limit(1);
  if (personal.length > 0) {
    await db.delete(schedulingAdminGoogleCalendar).where(eq(schedulingAdminGoogleCalendar.userId, userId));
    return;
  }
  await disconnectLegacyGoogleCalendar();
}

async function disconnectLegacyGoogleCalendar(): Promise<void> {
  const existing = await getLegacyGoogleCalendarIntegrationRow();
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

/** @deprecated Use disconnectGoogleCalendarForUser */
export async function disconnectGoogleCalendar(): Promise<void> {
  await disconnectLegacyGoogleCalendar();
}

function calendarIdFromConfigJson(cfg: GoogleCalendarConfigJson | null | undefined): string {
  const raw = cfg?.[CONFIG_CAL_KEY];
  return typeof raw === "string" && raw.trim() ? raw.trim() : "primary";
}

export async function testGoogleCalendarConnectionForUser(
  userId: number
): Promise<{ ok: boolean; message: string }> {
  if (!isGoogleCalendarOAuthConfigured()) {
    return { ok: false, message: "Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET." };
  }
  const resolved = await resolveConfigForHost(
    Number.isFinite(userId) && userId > 0 ? userId : null
  );
  if (!resolved) {
    return {
      ok: false,
      message:
        "Google Calendar isn’t connected for you yet. Click Connect, or ensure a site-wide calendar is still configured.",
    };
  }
  return runGoogleCalendarPing(resolved);
}

/** Legacy shared token only (no per-user resolution). */
export async function testGoogleCalendarConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isGoogleCalendarOAuthConfigured()) {
    return { ok: false, message: "Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET." };
  }
  const resolved = await resolveConfigForHost(null);
  if (!resolved) {
    return { ok: false, message: "Google Calendar isn’t connected." };
  }
  return runGoogleCalendarPing(resolved);
}

export async function getGoogleCalendarSettingsForUser(userId: number): Promise<{ calendarId: string }> {
  const personal = await db
    .select()
    .from(schedulingAdminGoogleCalendar)
    .where(eq(schedulingAdminGoogleCalendar.userId, userId))
    .limit(1);
  if (personal[0]?.enabled && hasEncryptedRefreshToken(personal[0].configJson)) {
    const cfg = personal[0].configJson as GoogleCalendarConfigJson;
    return { calendarId: calendarIdFromConfigJson(cfg) };
  }
  const legacy = await getLegacyGoogleCalendarIntegrationRow();
  const cfg = (legacy?.configJson || {}) as GoogleCalendarConfigJson;
  return { calendarId: calendarIdFromConfigJson(cfg) };
}

export async function patchGoogleCalendarSettingsForUser(
  userId: number,
  calendarId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db
    .select()
    .from(schedulingAdminGoogleCalendar)
    .where(eq(schedulingAdminGoogleCalendar.userId, userId))
    .limit(1);
  if (row[0]?.enabled && hasEncryptedRefreshToken(row[0].configJson)) {
    const prev = (row[0].configJson || {}) as Record<string, unknown>;
    await db
      .update(schedulingAdminGoogleCalendar)
      .set({
        configJson: { ...prev, [CONFIG_CAL_KEY]: calendarId },
        updatedAt: new Date(),
      })
      .where(eq(schedulingAdminGoogleCalendar.userId, userId));
    return { ok: true };
  }
  const legacy = await getLegacyGoogleCalendarIntegrationRow();
  if (!legacy) {
    return { ok: false, error: "Connect Google Calendar first." };
  }
  const prev = (legacy.configJson || {}) as Record<string, unknown>;
  await db
    .update(schedulingIntegrationConfigs)
    .set({
      configJson: { ...prev, [CONFIG_CAL_KEY]: calendarId },
      updatedAt: new Date(),
    })
    .where(eq(schedulingIntegrationConfigs.id, legacy.id));
  return { ok: true };
}

export async function syncAppointmentToGoogleCalendar(
  appt: SchedulingAppointment,
  bookingTypeName: string
): Promise<void> {
  const resolved = await resolveConfigForHost(appt.hostUserId ?? null);
  if (!resolved) return;
  const tok = await getGoogleCalendarAccessTokenForConfig(resolved.configJson);
  if (!tok.ok) {
    console.warn("[google-calendar] skip sync:", tok.error);
    return;
  }
  const calId = encodeURIComponent(calendarIdFromConfigJson(resolved.configJson));
  const meta = (appt.metadataJson || {}) as Record<string, unknown>;
  if (typeof meta.googleCalendarEventId === "string") return;

  const start = new Date(appt.startAt).toISOString();
  const end = new Date(appt.endAt).toISOString();
  const body = {
    summary: `${bookingTypeName}: ${appt.guestName}`,
    description: `Booked via Ascendra\n${appt.guestEmail}${appt.guestPhone ? `\n${appt.guestPhone}` : ""}`,
    start: { dateTime: start },
    end: { dateTime: end },
  };
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tok.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn("[google-calendar] create event failed", res.status, await res.text());
    return;
  }
  const created = (await res.json()) as { id?: string };
  if (!created.id) return;
  const nextMeta = { ...meta, googleCalendarEventId: created.id, googleCalendarCalendarId: decodeURIComponent(calId) };
  await db
    .update(schedulingAppointments)
    .set({ metadataJson: nextMeta, updatedAt: new Date() })
    .where(eq(schedulingAppointments.id, appt.id));
}

export async function deleteGoogleCalendarEventForAppointment(appt: SchedulingAppointment): Promise<void> {
  const meta = (appt.metadataJson || {}) as Record<string, unknown>;
  const eventId = meta.googleCalendarEventId;
  const calRaw = meta.googleCalendarCalendarId;
  if (typeof eventId !== "string") return;
  const resolved = await resolveConfigForHost(appt.hostUserId ?? null);
  if (!resolved) return;
  const tok = await getGoogleCalendarAccessTokenForConfig(resolved.configJson);
  if (!tok.ok) return;
  const cal = encodeURIComponent(typeof calRaw === "string" && calRaw ? calRaw : "primary");
  const eid = encodeURIComponent(eventId);
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${eid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tok.token}` },
  }).catch(() => undefined);
}
