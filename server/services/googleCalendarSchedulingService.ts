/**
 * Google Calendar OAuth + event sync for native Ascendra bookings (optional integration).
 * Uses GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET (separate from login OAuth).
 */

import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { schedulingAppointments, schedulingIntegrationConfigs } from "@shared/schedulingSchema";
import {
  canEncryptSchedulingSecrets,
  decryptSchedulingSecret,
  encryptSchedulingSecret,
} from "@server/lib/schedulingSecrets";
import type { SchedulingAppointment } from "@shared/schedulingSchema";

const PROVIDER = "google_calendar";
const CONFIG_RT_KEY = "encryptedRefreshToken";
const CONFIG_CAL_KEY = "calendarId";

export type GoogleCalendarConfigJson = {
  [CONFIG_RT_KEY]?: string;
  [CONFIG_CAL_KEY]?: string;
};

export function isGoogleCalendarOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() && process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim()
  );
}

export function getGoogleCalendarRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/admin/integrations/google-calendar/callback`;
}

export function buildGoogleCalendarAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID!.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getGoogleCalendarIntegrationRow() {
  const [row] = await db
    .select()
    .from(schedulingIntegrationConfigs)
    .where(eq(schedulingIntegrationConfigs.provider, PROVIDER))
    .limit(1);
  return row ?? null;
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  if (!isGoogleCalendarOAuthConfigured()) return false;
  const row = await getGoogleCalendarIntegrationRow();
  if (!row?.enabled) return false;
  const cfg = (row.configJson || {}) as GoogleCalendarConfigJson;
  return typeof cfg[CONFIG_RT_KEY] === "string" && cfg[CONFIG_RT_KEY]!.length > 0;
}

async function getRefreshToken(): Promise<string | null> {
  const row = await getGoogleCalendarIntegrationRow();
  if (!row?.enabled) return null;
  const enc = (row.configJson as GoogleCalendarConfigJson)[CONFIG_RT_KEY];
  if (!enc || typeof enc !== "string") return null;
  try {
    return decryptSchedulingSecret(enc);
  } catch {
    return null;
  }
}

export async function getGoogleCalendarAccessToken(): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  const refreshToken = await getRefreshToken();
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
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    return { ok: false, error: data.error || `Token refresh failed (${res.status})` };
  }
  return { ok: true, token: data.access_token };
}

export async function saveGoogleCalendarTokensFromCode(
  code: string,
  redirectUri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canEncryptSchedulingSecrets()) {
    return { ok: false, error: "Server cannot encrypt tokens — set SCHEDULING_TOKEN_ENCRYPTION_KEY or SESSION_SECRET." };
  }
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "GOOGLE_CALENDAR_CLIENT_ID / SECRET not set." };
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.error || `Token exchange failed (${res.status})` };
  }
  const rt = data.refresh_token;
  if (!rt) {
    return {
      ok: false,
      error: "No refresh_token returned. Revoke app access in Google Account settings and reconnect with prompt=consent.",
    };
  }
  const encrypted = encryptSchedulingSecret(rt);
  const existing = await getGoogleCalendarIntegrationRow();
  const configJson: GoogleCalendarConfigJson = {
    ...(existing?.configJson as GoogleCalendarConfigJson),
    [CONFIG_RT_KEY]: encrypted,
    [CONFIG_CAL_KEY]: (existing?.configJson as GoogleCalendarConfigJson)?.[CONFIG_CAL_KEY] || "primary",
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

export async function disconnectGoogleCalendar(): Promise<void> {
  const existing = await getGoogleCalendarIntegrationRow();
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

function calendarIdFromConfig(row: Awaited<ReturnType<typeof getGoogleCalendarIntegrationRow>>): string {
  const raw = (row?.configJson as GoogleCalendarConfigJson)?.[CONFIG_CAL_KEY];
  return typeof raw === "string" && raw.trim() ? raw.trim() : "primary";
}

export async function testGoogleCalendarConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isGoogleCalendarOAuthConfigured()) {
    return { ok: false, message: "Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET." };
  }
  const tok = await getGoogleCalendarAccessToken();
  if (!tok.ok) return { ok: false, message: tok.error };
  const row = await getGoogleCalendarIntegrationRow();
  const calId = encodeURIComponent(calendarIdFromConfig(row));
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
  return { ok: true, message: `Connected (${j.summary || calId}).` };
}

export async function syncAppointmentToGoogleCalendar(
  appt: SchedulingAppointment,
  bookingTypeName: string,
): Promise<void> {
  const connected = await isGoogleCalendarConnected();
  if (!connected) return;
  const tok = await getGoogleCalendarAccessToken();
  if (!tok.ok) {
    console.warn("[google-calendar] skip sync:", tok.error);
    return;
  }
  const row = await getGoogleCalendarIntegrationRow();
  const calId = encodeURIComponent(calendarIdFromConfig(row));
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
  const connected = await isGoogleCalendarConnected();
  if (!connected) return;
  const tok = await getGoogleCalendarAccessToken();
  if (!tok.ok) return;
  const cal = encodeURIComponent(typeof calRaw === "string" && calRaw ? calRaw : "primary");
  const eid = encodeURIComponent(eventId);
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${eid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tok.token}` },
  }).catch(() => undefined);
}
