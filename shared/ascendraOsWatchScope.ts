/** Ascendra OS watch scopes: path prefixes, full URL prefixes, and linked Agency OS projects (shared: browser + server). */

import { normalizePathPattern, pathMatchesPathPattern } from "./behaviorWatchPath";

export const WATCH_TARGET_SCOPE_TYPES = ["path_prefix", "full_url", "aos_agency_project"] as const;
export type WatchTargetScopeType = (typeof WATCH_TARGET_SCOPE_TYPES)[number];

export function isWatchTargetScopeType(raw: string | null | undefined): raw is WatchTargetScopeType {
  return !!raw && (WATCH_TARGET_SCOPE_TYPES as readonly string[]).includes(raw);
}

/** Accepts URLs with or without scheme; returns null if invalid. */
export function coerceHttpUrl(raw: string | null | undefined): URL | null {
  if (!raw?.trim()) return null;
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

/**
 * Normalized prefix for `location.href.startsWith(prefix)` (no hash, no trailing slash on path except root).
 */
export function normalizeFullUrlPrefix(raw: string): string {
  const u = coerceHttpUrl(raw);
  if (!u) throw new Error("Invalid URL");
  u.hash = "";
  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") return u.origin;
  return `${u.origin}${path}`;
}

export function fullUrlPrefixToPathname(prefixOrUrl: string): string {
  const u = coerceHttpUrl(prefixOrUrl);
  if (!u) return "/";
  const p = u.pathname || "/";
  return normalizePathPattern(p);
}

export type WatchMatchInput = {
  pathPattern: string;
  fullUrlPrefix: string | null | undefined;
};

/** Client: use full URL prefix when set; otherwise path prefix only. */
export function clientLocationMatchesWatchTarget(href: string, pathname: string, t: WatchMatchInput): boolean {
  const prefix = t.fullUrlPrefix?.trim();
  if (prefix) {
    try {
      const n = normalizeFullUrlPrefix(prefix);
      const hrefNorm = href.split("#")[0];
      return hrefNorm.startsWith(n);
    } catch {
      return pathMatchesPathPattern(pathname, t.pathPattern);
    }
  }
  return pathMatchesPathPattern(pathname, t.pathPattern);
}
