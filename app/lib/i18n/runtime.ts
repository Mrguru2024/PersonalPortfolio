import type { AppLocale } from "./constants";
import { DEFAULT_LOCALE, normalizeLocale } from "./constants";

let clientLocale: AppLocale = DEFAULT_LOCALE;

/** Synced from `LocaleProvider` for use outside React (e.g. global `toast()`). */
export function setClientLocale(locale: AppLocale): void {
  clientLocale = normalizeLocale(locale);
}

export function getClientLocale(): AppLocale {
  return clientLocale;
}
