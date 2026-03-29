import { randomBytes } from "crypto";
import { addMinutes, format, getDay, isBefore, isEqual } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { db } from "@server/db";
import {
  schedulingAppointments,
  schedulingAvailabilityRules,
  schedulingBookingPages,
  schedulingBookingTypes,
  schedulingGlobalSettings,
  schedulingHostBlockedDates,
  schedulingHostWeeklyRules,
  schedulingReminderJobs,
  type SchedulingAppointment,
  type SchedulingBookingPage,
  type SchedulingBookingType,
  type SchedulingGlobalSettings,
} from "@shared/schedulingSchema";
import { users } from "@shared/schema";
import { crmContacts, type CrmContact } from "@shared/crmSchema";
import { deriveSchedulerQualification } from "@server/lib/schedulerQualification";
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
  guestCompany?: string | null;
  hostUserId?: number | null;
  bookingPageSlug?: string | null;
  formAnswers?: Record<string, unknown> | null;
  bookingSource?: string | null;
}): Promise<{ ok: true; appointment: SchedulingAppointment } | { ok: false; error: string }> {
  const settings = await getSchedulingSettings();
  if (!settings.publicBookingEnabled) return { ok: false, error: "Public booking is disabled." };

  const formAnswers =
    input.formAnswers && typeof input.formAnswers === "object" && !Array.isArray(input.formAnswers)
      ? input.formAnswers
      : {};

  let pageRow: SchedulingBookingPage | null = null;
  if (input.bookingPageSlug && input.bookingPageSlug.trim()) {
    const slug = input.bookingPageSlug.trim().toLowerCase();
    const [p] = await db
      .select()
      .from(schedulingBookingPages)
      .where(
        and(eq(schedulingBookingPages.slug, slug), eq(schedulingBookingPages.active, true)),
      )
      .limit(1);
    if (!p) return { ok: false, error: "This booking link is not available." };
    if (p.bookingTypeId !== input.bookingTypeId) {
      return { ok: false, error: "Meeting type does not match this booking page." };
    }
    pageRow = p;
  }

  let hostUserId: number | null;
  if (pageRow?.hostMode === "fixed" && pageRow.fixedHostUserId != null) {
    const fid = pageRow.fixedHostUserId;
    if (!(await isSchedulingHostUser(fid))) {
      return { ok: false, error: "This page’s host is not available for booking." };
    }
    hostUserId = fid;
  } else {
    const resolvedHost = await resolvePublicBookingHostUserId(input.hostUserId ?? undefined);
    if (!resolvedHost.ok) return { ok: false, error: resolvedHost.error };
    hostUserId = resolvedHost.hostUserId;
  }

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
  const qual = deriveSchedulerQualification({
    formAnswers,
    guestEmail: input.guestEmail.trim().toLowerCase(),
    guestPhone: input.guestPhone,
    guestNotes: input.guestNotes,
    guestCompany: input.guestCompany,
  });

  const paymentRequirement = pageRow?.paymentRequirement ?? "none";
  const paymentStatus =
    paymentRequirement === "none" || paymentRequirement === ""
      ? "none"
      : paymentRequirement === "deposit" || paymentRequirement === "full"
        ? "pending"
        : "none";

  const bookingSource = input.bookingSource?.trim() || (pageRow ? `page:${pageRow.slug}` : "native_booking");

  const [appt] = await db
    .insert(schedulingAppointments)
    .values({
      bookingTypeId: input.bookingTypeId,
      hostUserId,
      guestName: input.guestName.trim(),
      guestEmail: input.guestEmail.trim().toLowerCase(),
      guestPhone: input.guestPhone?.trim() || null,
      guestCompany: input.guestCompany?.trim() || null,
      bookingPageId: pageRow?.id ?? null,
      leadScoreTier: qual.leadScoreTier,
      intentClassification: qual.intentClassification,
      noShowRiskTier: qual.noShowRiskTier,
      paymentStatus,
      estimatedValueCents: qual.estimatedValueCents,
      bookingSource,
      formAnswersJson: formAnswers,
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

export type AppointmentAdminEnrichedRow = {
  appointment: SchedulingAppointment;
  bookingTypeName: string | null;
  bookingTypeSlug: string | null;
  bookingTypeColor: null;
  contactCompany: string | null;
  contactName: string | null;
  hostDisplay: string | null;
  bookingPageSlug: string | null;
};

/** Joins hosts, CRM contacts, booking types, and booking pages for Scheduler admin UI. */
export async function listAppointmentsAdminEnriched(opts?: { from?: Date; to?: Date; limit?: number }) {
  const limit = Math.min(opts?.limit ?? 200, 500);
  const selectShape = {
    appointment: schedulingAppointments,
    bookingTypeName: schedulingBookingTypes.name,
    bookingTypeSlug: schedulingBookingTypes.slug,
    contactCompany: crmContacts.company,
    contactName: crmContacts.name,
    hostUsername: users.username,
    hostFullName: users.full_name,
    bookingPageSlug: schedulingBookingPages.slug,
  };
  const rows =
    opts?.from && opts?.to
      ? await db
          .select(selectShape)
          .from(schedulingAppointments)
          .leftJoin(schedulingBookingTypes, eq(schedulingAppointments.bookingTypeId, schedulingBookingTypes.id))
          .leftJoin(crmContacts, eq(schedulingAppointments.contactId, crmContacts.id))
          .leftJoin(users, eq(schedulingAppointments.hostUserId, users.id))
          .leftJoin(schedulingBookingPages, eq(schedulingAppointments.bookingPageId, schedulingBookingPages.id))
          .where(
            and(gte(schedulingAppointments.startAt, opts.from), lte(schedulingAppointments.startAt, opts.to)),
          )
          .orderBy(desc(schedulingAppointments.startAt))
          .limit(limit)
      : await db
          .select(selectShape)
          .from(schedulingAppointments)
          .leftJoin(schedulingBookingTypes, eq(schedulingAppointments.bookingTypeId, schedulingBookingTypes.id))
          .leftJoin(crmContacts, eq(schedulingAppointments.contactId, crmContacts.id))
          .leftJoin(users, eq(schedulingAppointments.hostUserId, users.id))
          .leftJoin(schedulingBookingPages, eq(schedulingAppointments.bookingPageId, schedulingBookingPages.id))
          .orderBy(desc(schedulingAppointments.startAt))
          .limit(limit);

  return rows.map((r) => {
    const hostDisplay =
      r.hostFullName?.trim() || r.hostUsername?.trim()
        ? (r.hostFullName?.trim() || r.hostUsername) ?? null
        : null;
    return {
      appointment: r.appointment,
      bookingTypeName: r.bookingTypeName,
      bookingTypeSlug: r.bookingTypeSlug,
      bookingTypeColor: null,
      contactCompany: r.contactCompany,
      contactName: r.contactName,
      hostDisplay,
      bookingPageSlug: r.bookingPageSlug,
    } satisfies AppointmentAdminEnrichedRow;
  });
}

export async function listPriorAppointmentsForGuestEmail(
  email: string,
  excludeAppointmentId: number,
  limit = 25,
): Promise<SchedulingAppointment[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];
  return db
    .select()
    .from(schedulingAppointments)
    .where(and(eq(schedulingAppointments.guestEmail, normalized), ne(schedulingAppointments.id, excludeAppointmentId)))
    .orderBy(desc(schedulingAppointments.startAt))
    .limit(Math.min(limit, 100));
}

export type SchedulerAppointmentDetailAdmin = AppointmentAdminEnrichedRow & {
  crmContact: CrmContact | null;
  priorAppointments: SchedulingAppointment[];
};

export async function getSchedulerAppointmentDetailAdmin(
  id: number,
): Promise<SchedulerAppointmentDetailAdmin | null> {
  const base = await getAppointmentAdminEnriched(id);
  if (!base) return null;
  let crmContact: CrmContact | null = null;
  if (base.appointment.contactId != null) {
    const [c] = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.id, base.appointment.contactId))
      .limit(1);
    crmContact = c ?? null;
  }
  const priorAppointments = await listPriorAppointmentsForGuestEmail(base.appointment.guestEmail, id);
  return { ...base, crmContact, priorAppointments };
}

export async function getAppointmentAdminEnriched(id: number): Promise<AppointmentAdminEnrichedRow | null> {
  const [r] = await db
    .select({
      appointment: schedulingAppointments,
      bookingTypeName: schedulingBookingTypes.name,
      bookingTypeSlug: schedulingBookingTypes.slug,
      contactCompany: crmContacts.company,
      contactName: crmContacts.name,
      hostUsername: users.username,
      hostFullName: users.full_name,
      bookingPageSlug: schedulingBookingPages.slug,
    })
    .from(schedulingAppointments)
    .leftJoin(schedulingBookingTypes, eq(schedulingAppointments.bookingTypeId, schedulingBookingTypes.id))
    .leftJoin(crmContacts, eq(schedulingAppointments.contactId, crmContacts.id))
    .leftJoin(users, eq(schedulingAppointments.hostUserId, users.id))
    .leftJoin(schedulingBookingPages, eq(schedulingAppointments.bookingPageId, schedulingBookingPages.id))
    .where(eq(schedulingAppointments.id, id))
    .limit(1);

  if (!r) return null;
  const hostDisplay =
    r.hostFullName?.trim() || r.hostUsername?.trim()
      ? (r.hostFullName?.trim() || r.hostUsername) ?? null
      : null;

  return {
    appointment: r.appointment,
    bookingTypeName: r.bookingTypeName,
    bookingTypeSlug: r.bookingTypeSlug,
    bookingTypeColor: null,
    contactCompany: r.contactCompany,
    contactName: r.contactName,
    hostDisplay,
    bookingPageSlug: r.bookingPageSlug,
  };
}

export async function updateAppointmentAdmin(
  id: number,
  patch: Partial<{
    status: string;
    internalNotes: string | null;
    guestCompany: string | null;
    leadScoreTier: string | null;
    intentClassification: string | null;
    noShowRiskTier: string | null;
    paymentStatus: string;
    estimatedValueCents: number | null;
    completedAt: Date | null;
  }>,
): Promise<{ ok: true; row: SchedulingAppointment } | { ok: false; error: string }> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const [row] = await db.select().from(schedulingAppointments).where(eq(schedulingAppointments.id, id)).limit(1);
    return row ? { ok: true, row } : { ok: false, error: "Not found." };
  }
  const [row] = await db
    .update(schedulingAppointments)
    .set({ ...Object.fromEntries(entries), updatedAt: new Date() })
    .where(eq(schedulingAppointments.id, id))
    .returning();
  if (!row) return { ok: false, error: "Not found." };
  return { ok: true, row };
}

export async function getPublicBookingPageBySlug(slug: string): Promise<
  | { ok: true; page: SchedulingBookingPage; bookingType: SchedulingBookingType }
  | { ok: false; error: string }
> {
  await ensureSchedulingDefaults();
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Invalid slug." };
  const [page] = await db
    .select()
    .from(schedulingBookingPages)
    .where(and(eq(schedulingBookingPages.slug, normalized), eq(schedulingBookingPages.active, true)))
    .limit(1);
  if (!page) return { ok: false, error: "Not found." };
  const [bt] = await db
    .select()
    .from(schedulingBookingTypes)
    .where(and(eq(schedulingBookingTypes.id, page.bookingTypeId), eq(schedulingBookingTypes.active, true)))
    .limit(1);
  if (!bt) return { ok: false, error: "Meeting type unavailable." };
  return { ok: true, page, bookingType: bt };
}

export async function listBookingPagesAdmin(): Promise<SchedulingBookingPage[]> {
  await ensureSchedulingDefaults();
  return db
    .select()
    .from(schedulingBookingPages)
    .orderBy(desc(schedulingBookingPages.updatedAt), desc(schedulingBookingPages.id));
}

export async function createBookingPageAdmin(input: {
  slug: string;
  title: string;
  shortDescription?: string | null;
  bestForBullets?: string[];
  bookingTypeId: number;
  fixedHostUserId?: number | null;
  hostMode?: string;
  locationType?: string;
  paymentRequirement?: string;
  depositCents?: number | null;
  confirmationMessage?: string | null;
  postBookingNextSteps?: string | null;
  redirectUrl?: string | null;
  formFieldsJson?: Array<{ id: string; label: string; type: "text" | "textarea"; required?: boolean }>;
  settingsJson?: Record<string, unknown>;
  active?: boolean;
}): Promise<{ ok: true; row: SchedulingBookingPage } | { ok: false; error: string }> {
  await ensureSchedulingDefaults();
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return { ok: false, error: "Slug: lowercase letters, numbers, hyphens only." };
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title required." };
  const [bt] = await db
    .select({ id: schedulingBookingTypes.id })
    .from(schedulingBookingTypes)
    .where(eq(schedulingBookingTypes.id, input.bookingTypeId))
    .limit(1);
  if (!bt) return { ok: false, error: "Meeting type not found." };
  try {
    const [row] = await db
      .insert(schedulingBookingPages)
      .values({
        slug,
        title,
        shortDescription: input.shortDescription?.trim() || null,
        bestForBullets: input.bestForBullets?.length ? input.bestForBullets : [],
        bookingTypeId: input.bookingTypeId,
        fixedHostUserId: input.fixedHostUserId ?? null,
        hostMode: input.hostMode === "fixed" ? "fixed" : "inherit",
        locationType: input.locationType?.trim() || "video",
        paymentRequirement: input.paymentRequirement?.trim() || "none",
        depositCents: input.depositCents ?? null,
        confirmationMessage: input.confirmationMessage?.trim() || null,
        postBookingNextSteps: input.postBookingNextSteps?.trim() || null,
        redirectUrl: input.redirectUrl?.trim() || null,
        formFieldsJson: input.formFieldsJson ?? [],
        settingsJson: input.settingsJson ?? {},
        active: input.active !== false,
      })
      .returning();
    if (!row) return { ok: false, error: "Insert failed." };
    return { ok: true, row };
  } catch {
    return { ok: false, error: "Slug may already exist." };
  }
}

export async function updateBookingPageAdmin(
  id: number,
  patch: Partial<{
    slug: string;
    title: string;
    shortDescription: string | null;
    bestForBullets: string[];
    bookingTypeId: number;
    fixedHostUserId: number | null;
    hostMode: string;
    locationType: string;
    paymentRequirement: string;
    depositCents: number | null;
    confirmationMessage: string | null;
    postBookingNextSteps: string | null;
    redirectUrl: string | null;
    formFieldsJson: Array<{ id: string; label: string; type: "text" | "textarea"; required?: boolean }>;
    settingsJson: Record<string, unknown>;
    active: boolean;
  }>,
): Promise<{ ok: true; row: SchedulingBookingPage } | { ok: false; error: string }> {
  const [existing] = await db.select().from(schedulingBookingPages).where(eq(schedulingBookingPages.id, id)).limit(1);
  if (!existing) return { ok: false, error: "Not found." };
  const data: Partial<typeof schedulingBookingPages.$inferInsert> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (k === "slug" && typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (!SLUG_RE.test(s)) return { ok: false, error: "Invalid slug." };
      data.slug = s;
    } else if (k === "title" && typeof v === "string") data.title = v.trim();
    else if (k === "shortDescription") data.shortDescription = v === null ? null : String(v).trim() || null;
    else if (k === "bestForBullets" && Array.isArray(v) && v.every((x) => typeof x === "string")) {
      data.bestForBullets = v as string[];
    }
    else if (k === "bookingTypeId" && typeof v === "number") data.bookingTypeId = v;
    else if (k === "fixedHostUserId") data.fixedHostUserId = v as number | null;
    else if (k === "hostMode" && typeof v === "string") data.hostMode = v === "fixed" ? "fixed" : "inherit";
    else if (k === "locationType" && typeof v === "string") data.locationType = v;
    else if (k === "paymentRequirement" && typeof v === "string") data.paymentRequirement = v;
    else if (k === "depositCents") data.depositCents = v as number | null;
    else if (k === "confirmationMessage") data.confirmationMessage = v === null ? null : String(v).trim() || null;
    else if (k === "postBookingNextSteps") data.postBookingNextSteps = v === null ? null : String(v).trim() || null;
    else if (k === "redirectUrl") data.redirectUrl = v === null ? null : String(v).trim() || null;
    else if (k === "formFieldsJson") data.formFieldsJson = v as typeof data.formFieldsJson;
    else if (k === "settingsJson") data.settingsJson = v as Record<string, unknown>;
    else if (k === "active" && typeof v === "boolean") data.active = v;
  }
  try {
    const [row] = await db
      .update(schedulingBookingPages)
      .set(data)
      .where(eq(schedulingBookingPages.id, id))
      .returning();
    if (!row) return { ok: false, error: "Update failed." };
    return { ok: true, row };
  } catch {
    return { ok: false, error: "Update failed (duplicate slug?)." };
  }
}

export async function deleteBookingPageAdmin(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const [cnt] = await db
    .select({ n: count() })
    .from(schedulingAppointments)
    .where(eq(schedulingAppointments.bookingPageId, id));
  if ((cnt?.n ?? 0) > 0) {
    return { ok: false, error: "Deactivate this page instead — it has appointments." };
  }
  await db.delete(schedulingBookingPages).where(eq(schedulingBookingPages.id, id));
  return { ok: true };
}
