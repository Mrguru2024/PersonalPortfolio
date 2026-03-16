import type { NextRequest } from "next/server";

/**
 * Base URL for password reset links in emails.
 * In production, always use NEXT_PUBLIC_APP_URL so the link points to the canonical site
 * (avoids wrong domain when Origin is missing or when behind proxies).
 * Falls back to request headers (origin / x-forwarded-*) then VERCEL_URL then localhost.
 */
export function getBaseUrlForResetLink(req?: NextRequest | null): string {
  const canonical = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (canonical) {
    const url = canonical.replace(/\/$/, "");
    if (url.startsWith("http")) return url;
    return `https://${url}`;
  }

  if (req) {
    const origin = req.headers.get("origin") ?? req.headers.get("x-forwarded-host");
    if (origin) {
      const protocol = req.headers.get("x-forwarded-proto") ?? "https";
      return origin.startsWith("http") ? origin.replace(/\/$/, "") : `${protocol}://${origin}`;
    }
  }

  if (process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
    const base = process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/$/, "");
    return base.startsWith("http") ? base : `https://${base}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
