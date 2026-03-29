/**
 * Booking page visual settings stored in `scheduling_booking_pages.settings_json` under `branding`.
 */

export type BookingPageCardStyle = "default" | "glass" | "minimal";

export type BookingPageHeroGradient = "none" | "aurora" | "sunset" | "ocean" | "midnight";

export type BookingPageTheme = {
  heroImageUrl: string | null;
  accentColor: string | null;
  cardStyle: BookingPageCardStyle;
  heroGradient: BookingPageHeroGradient;
};

export const DEFAULT_BOOKING_PAGE_THEME: BookingPageTheme = {
  heroImageUrl: null,
  accentColor: null,
  cardStyle: "glass",
  heroGradient: "aurora",
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHexColor(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!HEX_RE.test(t)) return null;
  return t.length === 4 ? `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}` : t;
}

function isCardStyle(x: string): x is BookingPageCardStyle {
  return x === "default" || x === "glass" || x === "minimal";
}

function isHeroGradient(x: string): x is BookingPageHeroGradient {
  return x === "none" || x === "aurora" || x === "sunset" || x === "ocean" || x === "midnight";
}

/** Safe public paths only (relative URLs). */
export function sanitizeHeroImageUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.startsWith("/uploads/") && !t.includes("..")) return t;
  return null;
}

export function bookingPageThemeFromSettingsJson(settingsJson: unknown): BookingPageTheme {
  const base = { ...DEFAULT_BOOKING_PAGE_THEME };
  if (!settingsJson || typeof settingsJson !== "object" || Array.isArray(settingsJson)) {
    return base;
  }
  const root = settingsJson as Record<string, unknown>;
  const b =
    root.branding && typeof root.branding === "object" && !Array.isArray(root.branding)
      ? (root.branding as Record<string, unknown>)
      : root;

  const hero = sanitizeHeroImageUrl(typeof b.heroImageUrl === "string" ? b.heroImageUrl : null);
  const accent = normalizeHexColor(typeof b.accentColor === "string" ? b.accentColor : null);

  const cardRaw = typeof b.cardStyle === "string" ? b.cardStyle : "glass";
  const gradRaw = typeof b.heroGradient === "string" ? b.heroGradient : "aurora";

  return {
    heroImageUrl: hero,
    accentColor: accent,
    cardStyle: isCardStyle(cardRaw) ? cardRaw : "glass",
    heroGradient: isHeroGradient(gradRaw) ? gradRaw : "aurora",
  };
}

export function mergeBrandingIntoSettingsJson(
  existing: Record<string, unknown> | null | undefined,
  branding: BookingPageTheme,
): Record<string, unknown> {
  const next = { ...(existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {}) };
  next.branding = {
    heroImageUrl: branding.heroImageUrl,
    accentColor: branding.accentColor,
    cardStyle: branding.cardStyle,
    heroGradient: branding.heroGradient,
  };
  return next;
}

export function heroGradientClass(g: BookingPageHeroGradient): string {
  switch (g) {
    case "none":
      return "";
    case "sunset":
      return "from-rose-500/25 via-amber-500/15 to-background dark:from-rose-600/20 dark:via-amber-600/15";
    case "ocean":
      return "from-cyan-500/25 via-blue-500/15 to-background dark:from-cyan-600/20 dark:via-blue-600/15";
    case "midnight":
      return "from-violet-600/30 via-indigo-600/20 to-background dark:from-violet-500/25 dark:via-indigo-900/40";
    case "aurora":
    default:
      return "from-primary/20 via-violet-500/15 to-teal-500/10 dark:from-primary/25 dark:via-violet-600/20 dark:to-teal-900/20";
  }
}
