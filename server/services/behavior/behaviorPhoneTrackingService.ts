import { db } from "@server/db";
import {
  behaviorPhoneCallLogs,
  behaviorPhoneTrackedNumbers,
} from "@shared/schema";
import type { IStorage } from "@server/storage";
import { desc, eq, gte } from "drizzle-orm";

type TrackedRow = typeof behaviorPhoneTrackedNumbers.$inferSelect;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Best-effort E.164 for US and generic international. */
export function normalizePhoneE164(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("+")) {
    const d = digitsOnly(t);
    return d ? `+${d}` : "";
  }
  const d = digitsOnly(t);
  if (d.length === 10) return `+1${d}`;
  if (d.length >= 11) return `+${d}`;
  return "";
}

function phonesMatch(a: string, b: string): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const la = da.slice(-10);
  const lb = db.slice(-10);
  return la.length === 10 && la === lb;
}

export async function listTrackedNumbersForAdmin(): Promise<TrackedRow[]> {
  return db.select().from(behaviorPhoneTrackedNumbers).orderBy(desc(behaviorPhoneTrackedNumbers.createdAt));
}

export async function listActiveTrackedNumbers(): Promise<TrackedRow[]> {
  return db
    .select()
    .from(behaviorPhoneTrackedNumbers)
    .where(eq(behaviorPhoneTrackedNumbers.active, true));
}

export async function createTrackedNumber(input: {
  phoneE164: string;
  label?: string;
  provider?: string;
  recordingEnabled?: boolean;
  active?: boolean;
  businessId?: string | null;
}) {
  const phoneE164 = normalizePhoneE164(input.phoneE164);
  if (!phoneE164 || phoneE164.length < 8) {
    throw new Error("Invalid phone number (use E.164, e.g. +15551234567)");
  }
  const [row] = await db
    .insert(behaviorPhoneTrackedNumbers)
    .values({
      phoneE164,
      label: (input.label ?? "Tracked line").slice(0, 200),
      provider: (input.provider ?? "twilio").slice(0, 32),
      recordingEnabled: input.recordingEnabled !== false,
      active: input.active !== false,
      businessId: input.businessId?.trim() || null,
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateTrackedNumber(
  id: number,
  patch: Partial<{
    phoneE164: string;
    label: string;
    provider: string;
    recordingEnabled: boolean;
    active: boolean;
    businessId: string | null;
  }>,
) {
  const updates: Partial<typeof behaviorPhoneTrackedNumbers.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.phoneE164 !== undefined) {
    const p = normalizePhoneE164(patch.phoneE164);
    if (!p || p.length < 8) throw new Error("Invalid phone number");
    updates.phoneE164 = p;
  }
  if (patch.label !== undefined) updates.label = patch.label.slice(0, 200);
  if (patch.provider !== undefined) updates.provider = patch.provider.slice(0, 32);
  if (patch.recordingEnabled !== undefined) updates.recordingEnabled = patch.recordingEnabled;
  if (patch.active !== undefined) updates.active = patch.active;
  if (patch.businessId !== undefined) updates.businessId = patch.businessId?.trim() || null;

  const [row] = await db
    .update(behaviorPhoneTrackedNumbers)
    .set(updates)
    .where(eq(behaviorPhoneTrackedNumbers.id, id))
    .returning();
  return row ?? null;
}

export async function deleteTrackedNumber(id: number): Promise<boolean> {
  const deleted = await db
    .delete(behaviorPhoneTrackedNumbers)
    .where(eq(behaviorPhoneTrackedNumbers.id, id))
    .returning({ id: behaviorPhoneTrackedNumbers.id });
  return deleted.length > 0;
}

function resolveTrackedNumberId(
  tracked: TrackedRow[],
  direction: string,
  from: string,
  to: string,
): { id: number; row: TrackedRow } | null {
  const dir = direction.toLowerCase();
  for (const row of tracked) {
    if (!row.active) continue;
    const our =
      dir === "outbound-api" || dir === "outbound-dial" || dir === "outbound" ?
        from
      : to;
    if (phonesMatch(row.phoneE164, our)) return { id: row.id, row };
  }
  return null;
}

export async function listCallLogsForAdmin(limit: number, sinceDays?: number) {
  const lim = Math.min(500, Math.max(10, limit));
  if (sinceDays != null && sinceDays > 0) {
    const since = new Date(Date.now() - sinceDays * 86_400_000);
    return db
      .select()
      .from(behaviorPhoneCallLogs)
      .where(gte(behaviorPhoneCallLogs.loggedAt, since))
      .orderBy(desc(behaviorPhoneCallLogs.loggedAt))
      .limit(lim);
  }
  return db.select().from(behaviorPhoneCallLogs).orderBy(desc(behaviorPhoneCallLogs.loggedAt)).limit(lim);
}

/**
 * Ingest Twilio voice status / recording callback params. Only persists when To/From matches an active tracked number.
 */
export async function ingestTwilioVoiceForBehaviorTracking(
  storage: IStorage,
  params: Record<string, string>,
): Promise<void> {
  const callSid = (params.CallSid ?? "").trim();
  if (!callSid) return;

  const direction = (params.Direction ?? "inbound").trim() || "inbound";
  const from = normalizePhoneE164(params.From ?? "");
  const to = normalizePhoneE164(params.To ?? "");
  if (!from || !to) return;

  const tracked = await listActiveTrackedNumbers();
  const match = resolveTrackedNumberId(tracked, direction, from, to);
  if (!match) return;

  const callStatus = (params.CallStatus ?? "").trim() || null;
  const durationRaw = params.CallDuration ?? params.DialCallDuration ?? "";
  const durationSeconds = Number.parseInt(durationRaw, 10);
  const recordingUrl = (params.RecordingUrl ?? "").trim() || null;
  const recordingDurRaw = params.RecordingDuration ?? "";
  const recordingDurationSeconds = Number.parseInt(recordingDurRaw, 10);

  const externalParty = direction.toLowerCase().startsWith("outbound") ? to : from;
  let crmContactId: number | null = null;
  try {
    const contact = await storage.getCrmContactByPhoneDigits(externalParty);
    crmContactId = contact?.id ?? null;
  } catch {
    crmContactId = null;
  }

  const stripRecording = !match.row.recordingEnabled;

  const metadataJson: Record<string, unknown> = {
    rawStatus: callStatus,
    callbackKeys: Object.keys(params).filter((k) => k.length < 64),
  };

  const existingRows = await db
    .select()
    .from(behaviorPhoneCallLogs)
    .where(eq(behaviorPhoneCallLogs.externalCallSid, callSid))
    .limit(1);

  const now = new Date();
  let nextRecording: string | null;
  if (stripRecording) {
    nextRecording = null;
  } else if (recordingUrl) {
    nextRecording = recordingUrl;
  } else {
    nextRecording = existingRows[0]?.recordingUrl ?? null;
  }

  const nextRecDur = Number.isFinite(recordingDurationSeconds) ?
      recordingDurationSeconds
    : (existingRows[0]?.recordingDurationSeconds ?? null);

  const baseCols = {
    trackedNumberId: match.id,
    direction,
    fromE164: from,
    toE164: to,
    callStatus,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    recordingUrl: nextRecording,
    recordingDurationSeconds: nextRecDur,
    crmContactId,
    metadataJson,
    updatedAt: now,
  };

  if (existingRows.length) {
    await db
      .update(behaviorPhoneCallLogs)
      .set(baseCols)
      .where(eq(behaviorPhoneCallLogs.id, existingRows[0].id));
  } else {
    await db.insert(behaviorPhoneCallLogs).values({
      ...baseCols,
      externalCallSid: callSid,
      loggedAt: now,
    });
  }
}
