import { randomBytes } from "crypto";
import { addMinutes, format, getDay, isBefore, isEqual } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@server/db";
import {
  schedulingAppointments,
  schedulingAvailabilityRules,
  schedulingBookingTypes,
  schedulingGlobalSettings,
  schedulingHostBlockedDates,
  schedulingHostWeeklyRules,
  schedulingReminderJobs,
  type SchedulingAppointment,
  type SchedulingBookingType,
  type SchedulingGlobalSettings,
} from "@shared/schedulingSchema";
import { users } from "@shared/schema";
import { crmContacts } from "@shared/crmSchema";
import {
  deleteGoogleCalendarEventForAppointment,
  syncAppointmentToGoogleCalendar,
} from "@server/services/googleCalendarSchedulingService";

const ACTIVE = ["confirmed", "pending"] as const;

function parseHm(t: string): { h: number; m: number } {
  const [a, b] = t.split(":").map((x) => parseInt(x, 10));
  return { h: a || 0, m: b || 0 };
}

export async function ensureSchedulingDefaults(): Promise<void> {
  const g = await db.select().from(schedulingGlobalSettings).where(eq(schedulingGlobalSettings.id, 1)).limit(1);
  if (g.length === 0) {
    await db.insert(schedulingGlobalSettings).values({ id: 1 });
  }
  const types = await db.select().from(schedulingBookingTypes).limit(1);
  if (types.length === 0) {
    await db.insert(schedulingBookingTypes).values({
      name: "Strategy call",
      slug: "strategy-call",
      durationMinutes: 45,
      description: "Intro conversation — goals, fit, and next steps.",
      sortOrder: 0,
    });
  }
  const rules = await db.select().from(schedulingAvailabilityRules).limit(1);
  if (rules.length === 0) {
    for (const dow of [1, 2, 3, 4, 5]) {
      await db.insert(schedulingAvailabilityRules).values({
        bookingTypeId: null,
        dayOfWeek: dow,
        startTimeLocal: "09:00",
        endTimeLocal: "17:00",
      });
    }
  }
}

export async function getSchedulingSettings(): Promise<SchedulingGlobalSettings> {
  await ensureSchedulingDefaults();
  const [row] = await db.select().from(schedulingGlobalSettings).where(eq(schedulingGlobalSettings.id, 1));
  return row!;
}

export async function updateSchedulingSettings(
  patch: Partial<{
    businessTimezone: string;
    slotStepMinutes: number;
    minNoticeHours: number;
    maxDaysAhead: number;
    publicBookingEnabled: boolean;
    aiAssistantEnabled: boolean;
    confirmationEmailSubject: string | null;
    confirmationEmailHtml: string | null;
    reminderEmailSubject: string | null;
    reminderEmailHtml: string | null;
    reminderOffsetsMinutes: number[];
    cancellationPolicyHtml: string | null;
  }>,
): Promise<SchedulingGlobalSettings> {
  await ensureSchedulingDefaults();
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getSchedulingSettings();
  await db
    .update(schedulingGlobalSettings)
    .set({ ...Object.fromEntries(entries), updatedAt: new Date() })
    .where(eq(schedulingGlobalSettings.id, 1));
  return getSchedulingSettings();
}

export async function listActiveBookingTypes() {
  await ensureSchedulingDefaults();
  return db
    .select()
    .from(schedulingBookingTypes)
    .where(eq(schedulingBookingTypes.active, true))
    .orderBy(asc(schedulingBookingTypes.sortOrder), asc(schedulingBookingTypes.id));
}

export async function listAllBookingTypesAdmin() {
  await ensureSchedulingDefaults();
  return db.select().from(schedulingBookingTypes).orderBy(asc(schedulingBookingTypes.sortOrder), asc(schedulingBookingTypes.id));
}

export async function listAvailabilityRulesAdmin(opts?: { bookingTypeId?: number | "null_only" }) {
  await ensureSchedulingDefaults();
  if (opts?.bookingTypeId === "null_only") {
    return db
      .select()
      .from(schedulingAvailabilityRules)
      .where(isNull(schedulingAvailabilityRules.bookingTypeId))
      .orderBy(asc(schedulingAvailabilityRules.dayOfWeek), asc(schedulingAvailabilityRules.id));
  }
  if (typeof opts?.bookingTypeId === "number") {
    return db
      .select()
      .from(schedulingAvailabilityRules)
      .where(eq(schedulingAvailabilityRules.bookingTypeId, opts.bookingTypeId))
      .orderBy(asc(schedulingAvailabilityRules.dayOfWeek), asc(schedulingAvailabilityRules.id));
  }
  return db
    .select()
    .from(schedulingAvailabilityRules)
    .orderBy(asc(schedulingAvailabilityRules.dayOfWeek), asc(schedulingAvailabilityRules.id));
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validHm(t: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(t);
}

export async function replaceAvailabilityRulesForScope(
  bookingTypeId: number | null,
  rules: Array<{ dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }>,
): Promise<{ ok: true; inserted: number } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  for (const r of rules) {
    if (!Number.isInteger(r.dayOfWeek) || r.dayOfWeek < 0 || r.dayOfWeek > 6) {
      return { ok: false, error: "Each rule needs dayOfWeek 0–6." };
    }
    if (!validHm(r.startTimeLocal) || !validHm(r.endTimeLocal)) {
      return { ok: false, error: "Times must use HH:mm (24h)." };
    }
  }
  if (bookingTypeId !== null) {
    const [bt] = await db
      .select({ id: schedulingBookingTypes.id })
      .from(schedulingBookingTypes)
      .where(eq(schedulingBookingTypes.id, bookingTypeId))
      .limit(1);
    if (!bt) return { ok: false, error: "Booking type not found." };
  }
  const cond =
    bookingTypeId === null
      ? isNull(schedulingAvailabilityRules.bookingTypeId)
      : eq(schedulingAvailabilityRules.bookingTypeId, bookingTypeId);
  await db.delete(schedulingAvailabilityRules).where(cond);
  let inserted = 0;
  for (const r of rules) {
    await db.insert(schedulingAvailabilityRules).values({
      bookingTypeId,
      dayOfWeek: r.dayOfWeek,
      startTimeLocal: r.startTimeLocal,
      endTimeLocal: r.endTimeLocal,
    });
    inserted++;
  }
  return { ok: true, inserted };
}

export async function createBookingTypeAdmin(input: {
  name: string;
  slug: string;
  durationMinutes: number;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true; row: SchedulingBookingType } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return { ok: false, error: "Slug: lowercase letters, numbers, hyphens only." };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name required." };
  const durationMinutes = Math.max(5, Math.min(24 * 60, input.durationMinutes || 30));
  try {
    const [row] = await db
      .insert(schedulingBookingTypes)
      .values({
        name,
        slug,
        durationMinutes,
        description: input.description?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active !== false,
      })
      .returning();
    if (!row) return { ok: false, error: "Insert failed." };
    return { ok: true, row };
  } catch {
    return { ok: false, error: "Slug may already exist." };
  }
}

export async function updateBookingTypeAdmin(
  id: number,
  patch: Partial<{
    name: string;
    slug: string;
    durationMinutes: number;
    description: string | null;
    sortOrder: number;
    active: boolean;
  }>,
): Promise<{ ok: true; row: SchedulingBookingType } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const [row] = await db.select().from(schedulingBookingTypes).where(eq(schedulingBookingTypes.id, id)).limit(1);
    return row ? { ok: true, row } : { ok: false, error: "Not found." };
  }
  const data: Partial<{
    name: string;
    slug: string;
    durationMinutes: number;
    description: string | null;
    sortOrder: number;
    active: boolean;
  }> = {};
  for (const [k, v] of entries) {
    if (k === "name" && typeof v === "string") data.name = v.trim();
    else if (k === "slug" && typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (!SLUG_RE.test(s)) return { ok: false, error: "Invalid slug." };
      data.slug = s;
    } else if (k === "durationMinutes" && typeof v === "number") {
      data.durationMinutes = Math.max(5, Math.min(24 * 60, v));
    } else if (k === "description") data.description = v === null ? null : String(v).trim() || null;
    else if (k === "sortOrder" && typeof v === "number") data.sortOrder = v;
    else if (k === "active" && typeof v === "boolean") data.active = v;
  }
  try {
    const [row] = await db
      .update(schedulingBookingTypes)
      .set(data)
      .where(eq(schedulingBookingTypes.id, id))
      .returning();
    if (!row) return { ok: false, error: "Not found." };
    return { ok: true, row };
  } catch {
    return { ok: false, error: "Update failed (duplicate slug?)." };
  }
}

export async function deleteBookingTypeAdmin(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  const [cnt] = await db
    .select({ n: count() })
    .from(schedulingAppointments)
    .where(eq(schedulingAppointments.bookingTypeId, id));
  if ((cnt?.n ?? 0) > 0) {
    return { ok: false, error: "This type has bookings — deactivate it instead of deleting." };
  }
  await db.delete(schedulingBookingTypes).where(eq(schedulingBookingTypes.id, id));
  return { ok: true };
}

export async function createAvailabilityRuleAdmin(input: {
  bookingTypeId: number | null;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  if (!Number.isInteger(input.dayOfWeek) || input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    return { ok: false, error: "dayOfWeek must be 0–6." };
  }
  if (!validHm(input.startTimeLocal) || !validHm(input.endTimeLocal)) {
    return { ok: false, error: "Times must be HH:mm." };
  }
  if (input.bookingTypeId !== null) {
    const [bt] = await db
      .select({ id: schedulingBookingTypes.id })
      .from(schedulingBookingTypes)
      .where(eq(schedulingBookingTypes.id, input.bookingTypeId))
      .limit(1);
    if (!bt) return { ok: false, error: "Booking type not found." };
  }
  const [row] = await db
    .insert(schedulingAvailabilityRules)
    .values({
      bookingTypeId: input.bookingTypeId,
      dayOfWeek: input.dayOfWeek,
      startTimeLocal: input.startTimeLocal,
      endTimeLocal: input.endTimeLocal,
    })
    .returning({ id: schedulingAvailabilityRules.id });
  if (!row) return { ok: false, error: "Insert failed." };
  return { ok: true, id: row.id };
}

export async function updateAvailabilityRuleAdmin(
  id: number,
  patch: Partial<{ bookingTypeId: number | null; dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  if (patch.dayOfWeek !== undefined) {
    if (!Number.isInteger(patch.dayOfWeek) || patch.dayOfWeek < 0 || patch.dayOfWeek > 6) {
      return { ok: false, error: "dayOfWeek must be 0–6." };
    }
  }
  if (patch.startTimeLocal !== undefined && !validHm(patch.startTimeLocal)) {
    return { ok: false, error: "startTimeLocal must be HH:mm." };
  }
  if (patch.endTimeLocal !== undefined && !validHm(patch.endTimeLocal)) {
    return { ok: false, error: "endTimeLocal must be HH:mm." };
  }
  if (patch.bookingTypeId !== undefined && patch.bookingTypeId !== null) {
    const [bt] = await db
      .select({ id: schedulingBookingTypes.id })
      .from(schedulingBookingTypes)
      .where(eq(schedulingBookingTypes.id, patch.bookingTypeId))
      .limit(1);
    if (!bt) return { ok: false, error: "Booking type not found." };
  }
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return { ok: true };
  await db
    .update(schedulingAvailabilityRules)
    .set(Object.fromEntries(entries))
    .where(eq(schedulingAvailabilityRules.id, id));
  return { ok: true };
}

export async function deleteAvailabilityRuleAdmin(id: number): Promise<{ ok: boolean; error?: string }> {
  await ensureSchedulingDefaults();
  await db.delete(schedulingAvailabilityRules).where(eq(schedulingAvailabilityRules.id, id));
  return { ok: true };
}

export async function listSchedulingHostUsers() {
  return db
    .select({
      id: users.id,
      username: users.username,
      full_name: users.full_name,
    })
    .from(users)
    .where(and(eq(users.isAdmin, true), eq(users.adminApproved, true)))
    .orderBy(asc(users.id));
}

export async function isSchedulingHostUser(userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.id, userId), eq(users.isAdmin, true), eq(users.adminApproved, true)),
    )
    .limit(1);
  return !!row;
}

export async function listHostWeeklyRulesForUser(userId: number) {
  return db
    .select()
    .from(schedulingHostWeeklyRules)
    .where(eq(schedulingHostWeeklyRules.userId, userId))
    .orderBy(asc(schedulingHostWeeklyRules.dayOfWeek), asc(schedulingHostWeeklyRules.id));
}

export async function listHostBlockedDatesForUser(userId: number) {
  const rows = await db
    .select({ dateLocal: schedulingHostBlockedDates.dateLocal })
    .from(schedulingHostBlockedDates)
    .where(eq(schedulingHostBlockedDates.userId, userId))
    .orderBy(asc(schedulingHostBlockedDates.dateLocal));
  return rows.map((r) => r.dateLocal);
}

const DATE_LOCAL_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function replaceHostWeeklyRulesForUser(
  userId: number,
  rules: Array<{ dayOfWeek: number; startTimeLocal: string; endTimeLocal: string }>,
): Promise<{ ok: true; inserted: number } | { ok: false; error: string }> {
  if (!(await isSchedulingHostUser(userId))) {
    return { ok: false, error: "Not a scheduling host." };
  }
  for (const r of rules) {
    if (!Number.isInteger(r.dayOfWeek) || r.dayOfWeek < 0 || r.dayOfWeek > 6) {
      return { ok: false, error: "Each rule needs dayOfWeek 0–6." };
    }
    if (!validHm(r.startTimeLocal) || !validHm(r.endTimeLocal)) {
      return { ok: false, error: "Times must use HH:mm (24h)." };
    }
  }
  await db.delete(schedulingHostWeeklyRules).where(eq(schedulingHostWeeklyRules.userId, userId));
  let inserted = 0;
  for (const r of rules) {
    await db.insert(schedulingHostWeeklyRules).values({
      userId,
      dayOfWeek: r.dayOfWeek,
      startTimeLocal: r.startTimeLocal,
      endTimeLocal: r.endTimeLocal,
    });
    inserted++;
  }
  return { ok: true, inserted };
}

export async function replaceHostBlockedDatesForUser(
  userId: number,
  dates: string[],
): Promise<{ ok: true; inserted: number } | { ok: false; error: string }> {
  if (!(await isSchedulingHostUser(userId))) {
    return { ok: false, error: "Not a scheduling host." };
  }
  const normalized: string[] = [];
  for (const d of dates) {
    const s = String(d).trim();
    if (!DATE_LOCAL_RE.test(s)) return { ok: false, error: "Blocked dates must be YYYY-MM-DD." };
    normalized.push(s);
  }
  const uniqueSorted = [...new Set(normalized)].sort();
  await db.delete(schedulingHostBlockedDates).where(eq(schedulingHostBlockedDates.userId, userId));
  for (const dateLocal of uniqueSorted) {
    await db.insert(schedulingHostBlockedDates).values({ userId, dateLocal });
  }
  return { ok: true, inserted: uniqueSorted.length };
}

/**
 * Resolve which admin receives the booking for public /book flows.
 * - 0 hosts: null (legacy single-pool behavior).
 * - 1 host: that admin unless client passes another id (ignored).
 * - 2+ hosts: body/query must supply a valid host user id.
 */
export async function resolvePublicBookingHostUserId(
  requested: number | null | undefined,
): Promise<{ ok: true; hostUserId: number | null } | { ok: false; error: string }> {
  const hosts = await listSchedulingHostUsers();
  if (hosts.length === 0) {
    return { ok: true, hostUserId: null };
  }
  if (hosts.length === 1) {
    return { ok: true, hostUserId: hosts[0]!.id };
  }
  const rid = typeof requested === "number" && Number.isFinite(requested) ? Math.trunc(requested) : NaN;
  if (!Number.isFinite(rid) || !hosts.some((h) => h.id === rid)) {
    return { ok: false, error: "Pick who you’re meeting with (host)." };
  }
  return { ok: true, hostUserId: rid };
}

/** YYYY-MM-DD in business timezone → slot start instants (UTC) that fit type duration. */
export async function computeAvailableSlots(
  dateStr: string,
  bookingTypeId: number,
  hostUserId?: number | null,
): Promise<{ startAt: string; endAt: string; label: string }[]> {
  const settings = await getSchedulingSettings();
  if (!settings.publicBookingEnabled) return [];

  const [bt] = await db
    .select()
    .from(schedulingBookingTypes)
    .where(and(eq(schedulingBookingTypes.id, bookingTypeId), eq(schedulingBookingTypes.active, true)))
    .limit(1);
  if (!bt) return [];

  const tz = settings.businessTimezone || "America/New_York";
  const parts = dateStr.split("-").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return [];
  const y = parts[0]!;
  const mo = parts[1]!;
  const da = parts[2]!;
  const probeUtc = fromZonedTime(new Date(y, mo - 1, da, 12, 0, 0, 0), tz);
  const dow = getDay(toZonedTime(probeUtc, tz));

  if (hostUserId != null) {
    if (!(await isSchedulingHostUser(hostUserId))) return [];
    const [blocked] = await db
      .select({ id: schedulingHostBlockedDates.id })
      .from(schedulingHostBlockedDates)
      .where(and(eq(schedulingHostBlockedDates.userId, hostUserId), eq(schedulingHostBlockedDates.dateLocal, dateStr)))
      .limit(1);
    if (blocked) return [];
  }

  const hostRows =
    hostUserId != null
      ? await db
          .select()
          .from(schedulingHostWeeklyRules)
          .where(and(eq(schedulingHostWeeklyRules.userId, hostUserId), eq(schedulingHostWeeklyRules.dayOfWeek, dow)))
      : [];

  let rules: { startTimeLocal: string; endTimeLocal: string }[];
  if (hostRows.length > 0) {
    rules = hostRows;
  } else {
    const specific = await db
      .select()
      .from(schedulingAvailabilityRules)
      .where(
        and(eq(schedulingAvailabilityRules.dayOfWeek, dow), eq(schedulingAvailabilityRules.bookingTypeId, bookingTypeId)),
      );
    const generic = await db
      .select()
      .from(schedulingAvailabilityRules)
      .where(and(eq(schedulingAvailabilityRules.dayOfWeek, dow), isNull(schedulingAvailabilityRules.bookingTypeId)));
    const merged = specific.length > 0 ? specific : generic;
    rules = merged;
  }
  if (rules.length === 0) return [];

  const step = Math.max(5, settings.slotStepMinutes || 30);
  const duration = Math.max(5, bt.durationMinutes);
  const minNoticeMs = Math.max(0, (settings.minNoticeHours || 0) * 60 * 60 * 1000);
  const now = Date.now();
  const maxAhead = Math.max(1, settings.maxDaysAhead || 45);
  const endRange = addMinutes(new Date(), maxAhead * 24 * 60);

  const dayStart = fromZonedTime(new Date(y, mo - 1, da, 0, 0, 0, 0), tz);
  const dayEnd = addMinutes(dayStart, 24 * 60);

  const hostBookedCond =
    hostUserId == null ? isNull(schedulingAppointments.hostUserId) : eq(schedulingAppointments.hostUserId, hostUserId);

  const booked = await db
    .select({ startAt: schedulingAppointments.startAt, endAt: schedulingAppointments.endAt })
    .from(schedulingAppointments)
    .where(
      and(
        inArray(schedulingAppointments.status, [...ACTIVE]),
        hostBookedCond,
        lt(schedulingAppointments.startAt, dayEnd),
        gt(schedulingAppointments.endAt, dayStart),
      ),
    );

  function overlaps(aStart: Date, aEnd: Date): boolean {
    for (const b of booked) {
      const bs = new Date(b.startAt);
      const be = new Date(b.endAt);
      if (aStart < be && aEnd > bs) return true;
    }
    return false;
  }

  const slots: { startAt: string; endAt: string; label: string }[] = [];

  for (const rule of rules) {
    const sh = parseHm(rule.startTimeLocal);
    const eh = parseHm(rule.endTimeLocal);
    let cursor = fromZonedTime(new Date(y, mo - 1, da, sh.h, sh.m, 0, 0), tz);
    const blockEnd = fromZonedTime(new Date(y, mo - 1, da, eh.h, eh.m, 0, 0), tz);
    while (isBefore(addMinutes(cursor, duration), blockEnd) || isEqual(addMinutes(cursor, duration), blockEnd)) {
      const slotEnd = addMinutes(cursor, duration);
      if (cursor.getTime() < now + minNoticeMs) {
        cursor = addMinutes(cursor, step);
        continue;
      }
      if (cursor > endRange) break;
      if (!overlaps(cursor, slotEnd)) {
        slots.push({
          startAt: cursor.toISOString(),
          endAt: slotEnd.toISOString(),
          label: format(toZonedTime(cursor, tz), "h:mm a"),
        });
      }
      cursor = addMinutes(cursor, step);
    }
  }

  return slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export async function findContactIdByEmail(email: string): Promise<number | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const [c] = await db
    .select({ id: crmContacts.id })
    .from(crmContacts)
    .where(sql`lower(trim(coalesce(${crmContacts.email}, ''))) = ${normalized}`)
    .limit(1);
  return c?.id ?? null;
}

export async function createBookingFromPublic(input: {
  bookingTypeId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  startAtIso: string;
  guestNotes?: string;
  hostUserId?: number | null;
}): Promise<{ ok: true; appointment: SchedulingAppointment } | { ok: false; error: string }> {
  const settings = await getSchedulingSettings();
  if (!settings.publicBookingEnabled) return { ok: false, error: "Public booking is disabled." };

  const resolvedHost = await resolvePublicBookingHostUserId(input.hostUserId ?? undefined);
  if (!resolvedHost.ok) return { ok: false, error: resolvedHost.error };
  const hostUserId = resolvedHost.hostUserId;

  const startGuess = new Date(input.startAtIso);
  if (Number.isNaN(startGuess.getTime())) return { ok: false, error: "Invalid start time." };
  const dateKey = format(toZonedTime(startGuess, settings.businessTimezone), "yyyy-MM-dd");
  const slots = await computeAvailableSlots(dateKey, input.bookingTypeId, hostUserId);
  const t0 = startGuess.getTime();
  const match = slots.find((s) => Math.abs(new Date(s.startAt).getTime() - t0) < 90_000);
  if (!match) return { ok: false, error: "That time is no longer available." };

  const [bt] = await db
    .select()
    .from(schedulingBookingTypes)
    .where(eq(schedulingBookingTypes.id, input.bookingTypeId))
    .limit(1);
  if (!bt || !bt.active) return { ok: false, error: "Invalid meeting type." };

  const startAt = new Date(match.startAt);
  const endAt = addMinutes(startAt, bt.durationMinutes);
  const guestToken = randomBytes(24).toString("hex");
  const contactId = await findContactIdByEmail(input.guestEmail);

  const [appt] = await db
    .insert(schedulingAppointments)
    .values({
      bookingTypeId: input.bookingTypeId,
      hostUserId,
      guestName: input.guestName.trim(),
      guestEmail: input.guestEmail.trim().toLowerCase(),
      guestPhone: input.guestPhone?.trim() || null,
      startAt,
      endAt,
      status: "confirmed",
      guestToken,
      contactId,
      guestNotes: input.guestNotes?.trim() || null,
    })
    .returning();

  if (!appt) return { ok: false, error: "Could not create booking." };

  void syncAppointmentToGoogleCalendar(appt, bt.name).catch((err) =>
    console.warn("[scheduling] Google Calendar sync:", err),
  );

  const offsets = (settings.reminderOffsetsMinutes as number[] | null) ?? [1440, 60];
  for (const offMin of offsets) {
    if (typeof offMin !== "number" || offMin < 1) continue;
    const runAt = addMinutes(startAt, -offMin);
    if (runAt.getTime() <= Date.now()) continue;
    await db.insert(schedulingReminderJobs).values({
      appointmentId: appt.id,
      kind: `${offMin}m`,
      runAt,
      channel: "email",
    });
  }

  return { ok: true, appointment: appt };
}

export async function getAppointmentByGuestToken(token: string): Promise<SchedulingAppointment | null> {
  const [row] = await db.select().from(schedulingAppointments).where(eq(schedulingAppointments.guestToken, token)).limit(1);
  return row ?? null;
}

export async function cancelAppointmentByGuestToken(token: string): Promise<{ ok: boolean; error?: string }> {
  const appt = await getAppointmentByGuestToken(token);
  if (!appt) return { ok: false, error: "Not found." };
  if (appt.status === "cancelled") return { ok: true };
  void deleteGoogleCalendarEventForAppointment(appt).catch(() => undefined);
  await db
    .update(schedulingAppointments)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(schedulingAppointments.id, appt.id));
  await db.delete(schedulingReminderJobs).where(eq(schedulingReminderJobs.appointmentId, appt.id));
  return { ok: true };
}

export async function listAppointmentsAdmin(opts?: { from?: Date; to?: Date; limit?: number }) {
  const limit = Math.min(opts?.limit ?? 100, 500);
  if (opts?.from && opts?.to) {
    return db
      .select()
      .from(schedulingAppointments)
      .where(and(gte(schedulingAppointments.startAt, opts.from), lte(schedulingAppointments.startAt, opts.to)))
      .orderBy(desc(schedulingAppointments.startAt))
      .limit(limit);
  }
  return db.select().from(schedulingAppointments).orderBy(desc(schedulingAppointments.startAt)).limit(limit);
}
