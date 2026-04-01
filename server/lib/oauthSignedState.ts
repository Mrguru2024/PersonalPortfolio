import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SEP = ".";

/**
 * - `meta`: Facebook Page OAuth — matches FACEBOOK_APP_SECRET–first (then session).
 * - `threads`: Threads uses same order as `threadsOAuthClientSecret()`: THREADS_APP_SECRET first, else FACEBOOK_APP_SECRET, so state and token exchange always share one app secret.
 * - `google_calendar`: Optional GOOGLE_CALENDAR_OAUTH_STATE_SECRET first; then OAUTH_STATE_SECRET, SESSION_SECRET, FACEBOOK_APP_SECRET (never prefers Meta over session).
 */
export type OAuthStateSigningProfile = "default" | "meta" | "threads" | "google_calendar";

const OAUTH_STATE_TTL_MS = 30 * 60 * 1000;

function signingSecret(profile: OAuthStateSigningProfile = "default"): string {
  const oauthDedicated = process.env.OAUTH_STATE_SECRET?.trim();
  if (oauthDedicated) return oauthDedicated;

  if (profile === "meta") {
    const fb = process.env.FACEBOOK_APP_SECRET?.trim();
    if (fb) return fb;
    return process.env.SESSION_SECRET?.trim() || "";
  }

  if (profile === "threads") {
    const threads = process.env.THREADS_APP_SECRET?.trim();
    if (threads) return threads;
    const fb = process.env.FACEBOOK_APP_SECRET?.trim();
    if (fb) return fb;
    return process.env.SESSION_SECRET?.trim() || "";
  }

  if (profile === "google_calendar") {
    const cal = process.env.GOOGLE_CALENDAR_OAUTH_STATE_SECRET?.trim();
    if (cal) return cal;
    const oauthDedicated = process.env.OAUTH_STATE_SECRET?.trim();
    if (oauthDedicated) return oauthDedicated;
    const session = process.env.SESSION_SECRET?.trim();
    if (session) return session;
    return process.env.FACEBOOK_APP_SECRET?.trim() || "";
  }

  const session = process.env.SESSION_SECRET?.trim();
  if (session) return session;
  return process.env.FACEBOOK_APP_SECRET?.trim() || "";
}

function normalizeOAuthStateParam(state: string): string {
  const t = state.trim();
  if (!t) return t;
  if (!t.includes("%")) return t;
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

/**
 * URL-safe OAuth `state` with embedded expiry and HMAC.
 * Avoids relying on a second cookie (fixes invalid_state when cookies are dropped across hosts/Safari/proxies).
 */
export function createSignedOAuthState(profile: OAuthStateSigningProfile = "default"): string {
  const secret = signingSecret(profile);
  if (!secret) {
    throw new Error(
      "Signed OAuth state requires OAUTH_STATE_SECRET, SESSION_SECRET, or FACEBOOK_APP_SECRET in env"
    );
  }
  const r = randomBytes(24).toString("hex");
  const exp = String(Date.now() + OAUTH_STATE_TTL_MS);
  const payload = `${r}${SEP}${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}${SEP}${sig}`;
}

/** Returns a signed state or null if no signing secret is configured. */
export function tryCreateSignedOAuthState(
  profile: OAuthStateSigningProfile = "default"
): string | null {
  try {
    return createSignedOAuthState(profile);
  } catch {
    return null;
  }
}

export function verifySignedOAuthState(
  state: string | null | undefined,
  profile: OAuthStateSigningProfile = "default"
): boolean {
  if (!state || typeof state !== "string") return false;
  const normalized = normalizeOAuthStateParam(state);
  const secret = signingSecret(profile);
  if (!secret) return false;
  const parts = normalized.split(SEP);
  if (parts.length !== 3) return false;
  const [r, exp, sig] = parts;
  if (!/^[a-f0-9]{48}$/i.test(r)) return false;
  if (!/^\d{13,}$/.test(exp)) return false;
  const payload = `${r}${SEP}${exp}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return false;
  } catch {
    return false;
  }
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || Date.now() > expMs) return false;
  return true;
}

/**
 * Signed OAuth state with an extra subject segment (e.g. admin user id for Google Calendar).
 * Format: `nonce.exp.subject.sig` where sig = HMAC-SHA256(nonce + "." + exp + "." + subject).
 * Subject must not contain "." (callers should use numeric ids or url-safe slugs).
 */
export function createSignedOAuthStateWithSubject(
  subject: string,
  profile: OAuthStateSigningProfile = "default"
): string {
  const secret = signingSecret(profile);
  if (!secret) {
    throw new Error(
      "Signed OAuth state requires OAUTH_STATE_SECRET, SESSION_SECRET, or FACEBOOK_APP_SECRET in env"
    );
  }
  const sub = subject.trim();
  if (!sub || sub.includes(SEP)) {
    throw new Error("OAuth state subject must be non-empty and must not contain '.'");
  }
  const r = randomBytes(24).toString("hex");
  const exp = String(Date.now() + OAUTH_STATE_TTL_MS);
  const payload = `${r}${SEP}${exp}${SEP}${sub}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}${SEP}${sig}`;
}

export function tryCreateSignedOAuthStateWithSubject(
  subject: string,
  profile: OAuthStateSigningProfile = "default"
): string | null {
  try {
    return createSignedOAuthStateWithSubject(subject, profile);
  } catch {
    return null;
  }
}

export function verifySignedOAuthStateWithSubject(
  state: string | null | undefined,
  profile: OAuthStateSigningProfile = "default"
): { ok: true; subject: string } | { ok: false } {
  if (!state || typeof state !== "string") return { ok: false };
  const normalized = normalizeOAuthStateParam(state).trim();
  const secret = signingSecret(profile);
  if (!secret) return { ok: false };
  const parts = normalized.split(SEP);
  if (parts.length !== 4) return { ok: false };
  const [r, exp, subject, sig] = parts;
  if (!/^[a-f0-9]{48}$/i.test(r)) return { ok: false };
  if (!/^\d{13,}$/.test(exp)) return { ok: false };
  if (!subject || subject.includes(SEP)) return { ok: false };
  const payload = `${r}${SEP}${exp}${SEP}${subject}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig.length !== expected.length) return { ok: false };
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return { ok: false };
  } catch {
    return { ok: false };
  }
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || Date.now() > expMs) return { ok: false };
  return { ok: true, subject };
}

/**
 * Google Calendar callback: verify `state` from the query first, then fall back to the httpOnly cookie
 * set on `/start` (helps when proxies or user agents alter long query strings).
 */
export function verifyGoogleCalendarOAuthState(
  stateFromQuery: string | null | undefined,
  stateFromCookie: string | null | undefined,
): { ok: true; subject: string } | { ok: false } {
  const q = typeof stateFromQuery === "string" ? stateFromQuery.trim() : "";
  const c = typeof stateFromCookie === "string" ? stateFromCookie.trim() : "";
  const candidates = c && c !== q ? [q, c] : [q || c];
  for (const raw of candidates) {
    if (!raw) continue;
    const v = verifySignedOAuthStateWithSubject(raw, "google_calendar");
    if (v.ok) return v;
  }
  return { ok: false };
}
