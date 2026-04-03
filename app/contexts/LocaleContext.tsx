"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type AppLocale,
} from "@/lib/i18n/constants";
import { setClientLocale } from "@/lib/i18n/runtime";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): AppLocale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  try {
    const prefix = `${LOCALE_COOKIE}=`;
    const hit = document.cookie
      .split("; ")
      .find((row) => row.startsWith(prefix));
    if (hit) return normalizeLocale(decodeURIComponent(hit.slice(prefix.length)));
    const ls = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (ls) return normalizeLocale(ls);
  } catch {
    /* ignore */
  }
  return normalizeLocale(
    typeof navigator !== "undefined" ? navigator.language : DEFAULT_LOCALE,
  );
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** From server `cookies()` so SSR matches the first client render (avoids footer/nav hydration mismatches). */
  initialLocale?: AppLocale;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(
    () => initialLocale ?? DEFAULT_LOCALE,
  );

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    setClientLocale(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "es" ? "es" : "en";
    }
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    const normalized = normalizeLocale(next);
    setLocaleState(normalized);
    try {
      document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(normalized)};path=/;max-age=31536000;SameSite=Lax`;
      localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
