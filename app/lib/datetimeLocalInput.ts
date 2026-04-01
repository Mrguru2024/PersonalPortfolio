/**
 * Value for HTML `input[type="datetime-local"]`: local calendar date + clock time.
 * Do not use `toISOString().slice(0, 16)` — that uses UTC and shifts the picker vs the user's zone.
 */
export function formatDateTimeLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
