import type { NextRequest, NextResponse } from "next/server";

/**
 * Public site URL for the current HTTP request (integrations docs, OAuth hints).
 * Uses forwarded Host when present; falls back to NEXT_PUBLIC_APP_URL / Vercel / metadata origin.
 */
export function getPublicSiteUrlFromRequest(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost || req.headers.get("host") || "";
  const host = hostHeader.split(",")[0]?.trim() ?? "";
  const protoHeader = req.headers.get("x-forwarded-proto") || "https";
  const proto = protoHeader.split(",")[0]?.trim() || "https";
  if (host && !/^localhost\b/i.test(host) && !/^127\.\d+\.\d+\.\d+/.test(host)) {
    return ensureAbsoluteUrl(`${proto}://${host}`);
  }
  return getSiteOriginForMetadata();
}

/**
 * OAuth redirect_uri base (social integrations). Prefer NEXT_PUBLIC_APP_URL when it matches the request host
 * (including www vs apex) so Meta/GitHub redirect URIs match what's configured, while cookies can still cover both.
 */
export function getOAuthBaseUrlFromRequest(req: NextRequest): string {
  const fromRequest = getPublicSiteUrlFromRequest(req);
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!pub) return fromRequest;
  try {
    const fromUrl = new URL(fromRequest);
    if (/^localhost$/i.test(fromUrl.hostname) || /^127\.\d+\.\d+\.\d+$/.test(fromUrl.hostname)) {
      return fromRequest;
    }
    const canonical = ensureAbsoluteUrl(pub);
    const cHost = new URL(canonical).hostname.toLowerCase();
    const rHost = fromUrl.hostname.toLowerCase();
    const cBase = cHost.startsWith("www.") ? cHost.slice(4) : cHost;
    const rBase = rHost.startsWith("www.") ? rHost.slice(4) : rHost;
    if (cBase !== "" && cBase === rBase) return canonical;
  } catch {
    /* keep request-derived */
  }
  return fromRequest;
}

/** Cookie options for OAuth state (and related) cookies — fixes invalid_state when Secure/www/apex mismatch. */
export function getOAuthStateCookieOptions(req: NextRequest): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
  path: string;
  domain?: string;
} {
  const fromRequest = getPublicSiteUrlFromRequest(req);
  let secure = false;
  try {
    secure = new URL(fromRequest).protocol === "https:";
  } catch {
    secure = process.env.NODE_ENV === "production";
  }

  const explicit = process.env.OAUTH_STATE_COOKIE_DOMAIN?.trim();
  if (explicit) {
    const domain = explicit.startsWith(".") ? explicit.slice(1) : explicit;
    return { httpOnly: true, sameSite: "lax", secure, maxAge: 600, path: "/", domain };
  }

  try {
    const fromUrl = new URL(fromRequest);
    const rHost = fromUrl.hostname.toLowerCase();
    if (/^localhost$/i.test(rHost) || /^127\.\d+\.\d+\.\d+$/.test(rHost) || rHost === "[::1]") {
      return { httpOnly: true, sameSite: "lax", secure, maxAge: 600, path: "/" };
    }

    const pub = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim();
    if (pub) {
      const canonical = ensureAbsoluteUrl(pub);
      const cHost = new URL(canonical).hostname.toLowerCase();
      const cBase = cHost.startsWith("www.") ? cHost.slice(4) : cHost;
      const rBase = rHost.startsWith("www.") ? rHost.slice(4) : rHost;
      const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(cBase);
      const publicSuffixHost =
        cBase.endsWith(".vercel.app") || rBase.endsWith(".vercel.app") || cBase.endsWith(".netlify.app");
      if (cBase === rBase && cBase.includes(".") && !looksLikeIp && !publicSuffixHost) {
        return { httpOnly: true, sameSite: "lax", secure, maxAge: 600, path: "/", domain: cBase };
      }
    }
  } catch {
    /* */
  }

  return { httpOnly: true, sameSite: "lax", secure, maxAge: 600, path: "/" };
}

/** Clear an OAuth state cookie with the same Path/Domain it was set with (required for scoped cookies). */
export function expireOAuthStateCookie(res: NextResponse, req: NextRequest, cookieName: string): void {
  const o = getOAuthStateCookieOptions(req);
  res.cookies.set(cookieName, "", { ...o, maxAge: 0 });
}

/**
 * Canonical base URL for the site. Used for Open Graph, Twitter cards, canonical links, and emails.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://yoursite.com) so social shares show the correct URL and image.
 * After changing, use Facebook Sharing Debugger / Twitter Card Validator / LinkedIn Post Inspector to refresh cached metadata.
 */
export function getSiteBaseUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL?.trim()) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_URL?.trim()) ||
    "";
  if (raw) return ensureAbsoluteUrl(raw);
  return "https://mrguru.dev";
}

/**
 * Server / build-time origin for root metadata (Open Graph absolute URLs, metadataBase).
 * Order: explicit public URL → Vercel production domain → preview deployment URL → legacy fallback.
 */
export function getSiteOriginForMetadata(): string {
  const pub =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (pub) return ensureAbsoluteUrl(pub);

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return ensureAbsoluteUrl(prod);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return ensureAbsoluteUrl(/^https?:\/\//i.test(vercel) ? vercel : `https://${vercel}`);
  }

  return "https://mrguru.dev";
}

/** Ensures URL has a scheme (https:// or http://). Required for OAuth redirect_uri. */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "").trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed === "localhost" || /^localhost:\d+$/.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

/** Build absolute URL for og:image / twitter:image (handles /path or full URL). */
export function absoluteFromSiteBase(siteBase: string, pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (!p) return `${ensureAbsoluteUrl(siteBase)}/og-ascendra.png`;
  if (/^https?:\/\//i.test(p)) return p;
  const base = ensureAbsoluteUrl(siteBase);
  if (p.startsWith("/")) return `${base}${p}`;
  return `${base}/${p}`;
}

/**
 * In the browser, prefer the live origin on real deployments so OG/canonical match the shared URL
 * even when NEXT_PUBLIC_APP_URL was mis-set. Localhost keeps env-based base.
 */
export function resolveClientSiteBase(envBase: string): string {
  const fromEnv = ensureAbsoluteUrl(envBase);
  if (typeof window === "undefined") return fromEnv;
  try {
    const live = window.location.origin;
    if (/localhost|127\.0\.0\.1/i.test(live)) return fromEnv;
    return live;
  } catch {
    return fromEnv;
  }
}

/** Canonical URL for a page (absolute href or path segment). */
export function absoluteCanonicalUrl(
  siteBase: string,
  canonicalOrPath: string,
  fallbackPath: string,
): string {
  const c = (canonicalOrPath || "").trim();
  const base = ensureAbsoluteUrl(siteBase);
  if (/^https?:\/\//i.test(c)) return c;
  if (c.startsWith("/")) return `${base}${c}`;
  if (c) return `${base}/${c}`;
  return `${base}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`;
}
