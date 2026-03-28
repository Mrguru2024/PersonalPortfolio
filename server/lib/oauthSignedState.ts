import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SEP = ".";

/** Meta (Facebook / Threads) prefers app secret so start/callback stay aligned even when SESSION_SECRET varies. */
export type OAuthStateSigningProfile = "default" | "meta";

const OAUTH_STATE_TTL_MS = 30 * 60 * 1000;

function signingSecret(profile: OAuthStateSigningProfile = "default"): string {
  const oauthDedicated = process.env.OAUTH_STATE_SECRET?.trim();
  if (oauthDedicated) return oauthDedicated;

  if (profile === "meta") {
    const fb = process.env.FACEBOOK_APP_SECRET?.trim();
    if (fb) return fb;
    return process.env.SESSION_SECRET?.trim() || "";
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
