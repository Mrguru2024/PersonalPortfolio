import { and, eq, gt, lt } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "@server/db";
import { consultationBookings } from "@shared/schema";
import { DEFAULT_CONSULTATION_DURATION } from "@shared/consultationSchema";

const HOST_TIMEZONE = process.env.SCHEDULING_HOST_TIMEZONE || "America/New_York";
const WORKING_DAY_SET = new Set(
  (process.env.SCHEDULING_WORKING_DAYS || "1,2,3,4,5")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
);
const START_HOUR = Number.parseInt(process.env.SCHEDULING_START_HOUR || "9", 10);
const END_HOUR = Number.parseInt(process.env.SCHEDULING_END_HOUR || "17", 10);
const SLOT_INTERVAL_MINUTES = Number.parseInt(
  process.env.SCHEDULING_SLOT_INTERVAL_MINUTES || "30",
  10
);
const MIN_NOTICE_MINUTES = Number.parseInt(
  process.env.SCHEDULING_MIN_NOTICE_MINUTES || "120",
  10
);
const MAX_DAYS_AHEAD = Number.parseInt(
  process.env.SCHEDULING_MAX_DAYS_AHEAD || "60",
  10
);

export interface ConsultationAvailabilitySlot {
  startIso: string;
  endIso: string;
  label: string;
  hostLabel: string;
}

export interface ConsultationAvailabilityResult {
  date: string;
  timezone: string;
  hostTimezone: string;
  durationMinutes: number;
  slots: ConsultationAvailabilitySlot[];
}

export function isValidTimeZone(timezone: string): boolean {
  return DateTime.now().setZone(timezone).isValid;
}

export function normalizeTimeZone(timezone: string | undefined): string {
  if (timezone && isValidTimeZone(timezone)) {
    return timezone;
  }
  return HOST_TIMEZONE;
}

async function getBookedIntervalsForRange(startUtc: DateTime, endUtc: DateTime) {
  return db
    .select({
      scheduledAt: consultationBookings.scheduledAt,
      endAt: consultationBookings.endAt,
    })
    .from(consultationBookings)
    .where(
      and(
        eq(consultationBookings.status, "booked"),
        lt(consultationBookings.scheduledAt, endUtc.toJSDate()),
        gt(consultationBookings.endAt, startUtc.toJSDate())
      )
    );
}

function overlaps(
  startA: DateTime,
  endA: DateTime,
  startB: DateTime,
  endB: DateTime
): boolean {
  return startA < endB && endA > startB;
}

export async function isConsultationSlotAvailable(
  startUtc: DateTime,
  durationMinutes: number
): Promise<boolean> {
  const endUtc = startUtc.plus({ minutes: durationMinutes });
  const overlapsRows = await getBookedIntervalsForRange(startUtc, endUtc);
  return overlapsRows.length === 0;
}

export async function getConsultationAvailability(params: {
  date: string;
  timezone?: string;
  durationMinutes?: number;
}): Promise<ConsultationAvailabilityResult> {
  const timezone = normalizeTimeZone(params.timezone);
  const durationMinutes = params.durationMinutes || DEFAULT_CONSULTATION_DURATION;
  const selectedDay = DateTime.fromISO(params.date, { zone: timezone }).startOf("day");
  if (!selectedDay.isValid) {
    throw new Error("Invalid date");
  }

  const nowInViewerZone = DateTime.now().setZone(timezone).startOf("day");
  if (selectedDay < nowInViewerZone) {
    return {
      date: params.date,
      timezone,
      hostTimezone: HOST_TIMEZONE,
      durationMinutes,
      slots: [],
    };
  }

  if (selectedDay.diff(nowInViewerZone, "days").days > MAX_DAYS_AHEAD) {
    return {
      date: params.date,
      timezone,
      hostTimezone: HOST_TIMEZONE,
      durationMinutes,
      slots: [],
    };
  }

  const rangeStartUtc = selectedDay.startOf("day").toUTC();
  const rangeEndUtc = selectedDay.endOf("day").toUTC();
  const existing = await getBookedIntervalsForRange(rangeStartUtc, rangeEndUtc);

  const booked = existing.map((row) => ({
    start: DateTime.fromJSDate(row.scheduledAt).toUTC(),
    end: DateTime.fromJSDate(row.endAt).toUTC(),
  }));

  const slots: ConsultationAvailabilitySlot[] = [];
  const hostNowPlusNotice = DateTime.now()
    .setZone(HOST_TIMEZONE)
    .plus({ minutes: MIN_NOTICE_MINUTES });

  for (const dayOffset of [-1, 0, 1]) {
    const hostCandidateDay = selectedDay
      .plus({ days: dayOffset })
      .setZone(HOST_TIMEZONE)
      .startOf("day");

    if (!WORKING_DAY_SET.has(hostCandidateDay.weekday)) {
      continue;
    }

    const hostDayStart = hostCandidateDay.set({
      hour: START_HOUR,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const hostDayEnd = hostCandidateDay.set({
      hour: END_HOUR,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    for (
      let slotStart = hostDayStart;
      slotStart.plus({ minutes: durationMinutes }) <= hostDayEnd;
      slotStart = slotStart.plus({ minutes: SLOT_INTERVAL_MINUTES })
    ) {
      if (slotStart < hostNowPlusNotice) continue;

      const slotEnd = slotStart.plus({ minutes: durationMinutes });
      const viewerStart = slotStart.setZone(timezone);
      if (viewerStart.toISODate() !== selectedDay.toISODate()) continue;

      const slotStartUtc = slotStart.toUTC();
      const slotEndUtc = slotEnd.toUTC();
      const startIso = slotStartUtc.toISO();
      const endIso = slotEndUtc.toISO();
      if (!startIso || !endIso) continue;
      const hasConflict = booked.some((interval) =>
        overlaps(slotStartUtc, slotEndUtc, interval.start, interval.end)
      );
      if (hasConflict) continue;

      slots.push({
        startIso,
        endIso,
        label: viewerStart.toFormat("h:mm a"),
        hostLabel: slotStart.toFormat("h:mm a"),
      });
    }
  }

  slots.sort((a, b) => (a.startIso > b.startIso ? 1 : -1));

  return {
    date: params.date,
    timezone,
    hostTimezone: HOST_TIMEZONE,
    durationMinutes,
    slots,
  };
}
