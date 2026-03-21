export const ASC_VISITOR_COOKIE = "asc_v_id";
export const ASC_SESSION_COOKIE = "asc_s_id";
export const ASC_ATTR_FIRST_COOKIE = "asc_attr_first";
export const ASC_ATTR_LAST_COOKIE = "asc_attr_last";

const ATTR_FIRST_STORAGE = "asc_attr_first";
const ATTR_LAST_STORAGE = "asc_attr_last";

export interface TrackingAttributionPayload {
  visitorId?: string | null;
  sessionId?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  ttclid?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  url?: string | null;
}

const ATTR_KEYS: (keyof TrackingAttributionPayload)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "ttclid",
];

function sanitize(value: unknown, max = 512): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function readStorageJson(key: string): TrackingAttributionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, sanitize(v)])
    ) as TrackingAttributionPayload;
  } catch {
    return null;
  }
}

function writeStorageJson(key: string, payload: TrackingAttributionPayload): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function compactPayload(payload: TrackingAttributionPayload): TrackingAttributionPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== "")
  ) as TrackingAttributionPayload;
}

export function setCookieValue(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function parseAttributionFromSearchParams(params: URLSearchParams): TrackingAttributionPayload {
  return compactPayload({
    utm_source: sanitize(params.get("utm_source")),
    utm_medium: sanitize(params.get("utm_medium")),
    utm_campaign: sanitize(params.get("utm_campaign")),
    utm_term: sanitize(params.get("utm_term")),
    utm_content: sanitize(params.get("utm_content")),
    gclid: sanitize(params.get("gclid")),
    fbclid: sanitize(params.get("fbclid")),
    msclkid: sanitize(params.get("msclkid")),
    ttclid: sanitize(params.get("ttclid")),
  });
}

function hasCampaignValues(payload: TrackingAttributionPayload): boolean {
  return ATTR_KEYS.some((key) => Boolean(payload[key]));
}

export function persistAttributionInBrowser(
  currentUrl: string,
  referrer?: string | null
): {
  firstTouch: TrackingAttributionPayload | null;
  lastTouch: TrackingAttributionPayload | null;
} {
  if (typeof window === "undefined") {
    return { firstTouch: null, lastTouch: null };
  }

  const url = new URL(currentUrl);
  const fromQuery = parseAttributionFromSearchParams(url.searchParams);
  const existingFirst = readStorageJson(ATTR_FIRST_STORAGE);
  const existingLast = readStorageJson(ATTR_LAST_STORAGE);

  const contextual: TrackingAttributionPayload = {
    ...fromQuery,
    referrer: sanitize(referrer ?? document.referrer, 1024),
    landing_page: sanitize(url.pathname + url.search, 1024),
    url: sanitize(url.toString(), 1024),
  };
  const compactContextual = compactPayload(contextual);

  const nextLast =
    hasCampaignValues(compactContextual) || compactContextual.referrer || compactContextual.landing_page
      ? { ...existingLast, ...compactContextual }
      : existingLast;
  if (nextLast) writeStorageJson(ATTR_LAST_STORAGE, nextLast);

  const nextFirst =
    !existingFirst && (hasCampaignValues(compactContextual) || compactContextual.referrer || compactContextual.landing_page)
      ? compactContextual
      : existingFirst;
  if (nextFirst) writeStorageJson(ATTR_FIRST_STORAGE, nextFirst);

  return { firstTouch: nextFirst, lastTouch: nextLast };
}

export function getAttributionSnapshot(
  visitorId?: string | null,
  sessionId?: string | null
): {
  firstTouch: TrackingAttributionPayload | null;
  lastTouch: TrackingAttributionPayload | null;
  current: TrackingAttributionPayload;
} {
  const fallback = {
    firstTouch: null,
    lastTouch: null,
    current: {
      visitorId: sanitize(visitorId, 128),
      sessionId: sanitize(sessionId, 128),
    } as TrackingAttributionPayload,
  };

  if (typeof window === "undefined") return fallback;

  const currentUrl = window.location.href;
  const { firstTouch, lastTouch } = persistAttributionInBrowser(currentUrl);

  const params = new URLSearchParams(window.location.search);
  const liveQuery = parseAttributionFromSearchParams(params);
  const current: TrackingAttributionPayload = {
    visitorId: sanitize(visitorId, 128),
    sessionId: sanitize(sessionId, 128),
    ...lastTouch,
    ...liveQuery,
    referrer: sanitize(document.referrer, 1024) ?? lastTouch?.referrer ?? null,
    landing_page: sanitize(window.location.pathname + window.location.search, 1024),
    url: sanitize(currentUrl, 1024),
  };
  return { firstTouch, lastTouch, current };
}
