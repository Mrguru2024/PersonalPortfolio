/**
 * User-visible dates/times: browser default locale + 12-hour clock (no 24h “military” display).
 * Do not use for `input type="datetime-local"` values — those require a fixed local pattern.
 */

export type LocaleDateTimeKind =
  | "monthDayTime"
  | "monthDayTimeWithSeconds"
  | "full"
  | "fullWithSeconds";

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** @param empty — string when value is null/invalid (default "—") */
/** Medium date only (typical replacement for date-fns `PP`), browser locale. */
export function formatLocaleMediumDate(
  value: Date | string | number | null | undefined,
  empty = "—",
): string {
  const d = toDate(value);
  if (!d) return empty;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

/** Medium date + short time (typical replacement for date-fns `PPp`), browser locale, 12-hour clock. */
export function formatLocaleMediumDateTime(
  value: Date | string | number | null | undefined,
  empty = "—",
): string {
  const d = toDate(value);
  if (!d) return empty;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(d);
}

export function formatLocaleDateTime(
  value: Date | string | number | null | undefined,
  kind: LocaleDateTimeKind = "full",
  empty = "—",
): string {
  const d = toDate(value);
  if (!d) return empty;

  const optsBase = { hour12: true as const };

  switch (kind) {
    case "monthDayTime":
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...optsBase,
      }).format(d);
    case "monthDayTimeWithSeconds":
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        ...optsBase,
      }).format(d);
    case "fullWithSeconds":
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        ...optsBase,
      }).format(d);
    default:
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...optsBase,
      }).format(d);
  }
}
