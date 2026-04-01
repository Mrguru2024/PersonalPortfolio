import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** US Eastern (EST/EDT) — IANA zone; avoids fixed EST-only offset during daylight saving. */
export const DEV_UPDATES_TIME_ZONE = "America/New_York";

/** When the digest was last refreshed (browser/client clock → shown in Eastern). */
export function formatDevUpdatesLastChecked(epochMs: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DEV_UPDATES_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(epochMs));
}

/** Calendar day from `YYYY-MM-DD` in markdown; stable vs viewer’s local TZ. */
export function formatDevUpdateDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d || y < 2000) return dateStr;
  const instant = fromZonedTime(new Date(y, m - 1, d, 12, 0, 0, 0), DEV_UPDATES_TIME_ZONE);
  return formatInTimeZone(instant, DEV_UPDATES_TIME_ZONE, "MMM d, yyyy");
}

export function formatDevUpdateTimeInEastern(
  dateStr: string,
  timeRaw: string,
): { label: string; instant: Date | null } {
  const [y, mo, da] = dateStr.split("-").map((x) => parseInt(x, 10));
  const t = timeRaw.trim();
  if (!y || !mo || !da || !t) return { label: timeRaw ? `${timeRaw} ET` : "", instant: null };

  let h = 0;
  let min = 0;
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m24) {
    h = parseInt(m24[1]!, 10);
    min = parseInt(m24[2]!, 10);
    if (h > 23 || min > 59) return { label: `${timeRaw} ET`, instant: null };
  } else if (m12) {
    let hh = parseInt(m12[1]!, 10);
    min = parseInt(m12[2]!, 10);
    const ap = m12[3]!.toUpperCase();
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    h = hh;
    if (min > 59) return { label: `${timeRaw} ET`, instant: null };
  } else {
    return { label: `${timeRaw} ET`, instant: null };
  }

  const instant = fromZonedTime(new Date(y, mo - 1, da, h, min, 0, 0), DEV_UPDATES_TIME_ZONE);
  const label = formatInTimeZone(instant, DEV_UPDATES_TIME_ZONE, "h:mm a zzz");
  return { label, instant };
}
