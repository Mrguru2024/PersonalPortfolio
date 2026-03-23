export const APP_LOCALES = ["en", "es"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "ascendra_locale";
export const LOCALE_STORAGE_KEY = "ascendra_locale";

export function normalizeLocale(raw: string | null | undefined): AppLocale {
  if (!raw) return DEFAULT_LOCALE;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0] ?? "";
  if (base === "es") return "es";
  return DEFAULT_LOCALE;
}
