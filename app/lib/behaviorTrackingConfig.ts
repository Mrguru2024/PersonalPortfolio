/**
 * Site-wide Growth Intelligence (behavior ingest) — public marketing routes only.
 *
 * - Turn on with `NEXT_PUBLIC_ASCENDRA_BEHAVIOR_TRACKING=1` (required in production).
 * - In development, tracking is on by default unless set to `0` / `false` / `off`.
 * - Optional `NEXT_PUBLIC_ASCENDRA_BEHAVIOR_TRACKING_PATHS`: comma-separated path prefixes
 *   (e.g. `/,/growth-platform,/strategy-call`). If unset, all non-admin paths are allowed.
 */

export function isAscendraPublicBehaviorTrackingEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ASCENDRA_BEHAVIOR_TRACKING?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "on" || raw === "all") return true;
  if (raw === "0" || raw === "false" || raw === "off") return false;
  return process.env.NODE_ENV === "development";
}

function normalizePathPrefix(p: string): string {
  let s = p.trim();
  if (!s) return "/";
  if (!s.startsWith("/")) s = `/${s}`;
  return s.replace(/\/+$/, "") || "/";
}

/** Parsed allowlist; `null` = allow all paths (that pass other gates). */
export function parseAscendraBehaviorTrackingPathAllowlist(): string[] | null {
  const raw = process.env.NEXT_PUBLIC_ASCENDRA_BEHAVIOR_TRACKING_PATHS?.trim();
  if (!raw) return null;
  const parts = raw
    .split(",")
    .map((s) => normalizePathPrefix(s))
    .filter((s) => s.length > 0);
  return parts.length ? parts : null;
}

export function ascendraBehaviorTrackingPathAllowed(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? pathname) || "/";
  const list = parseAscendraBehaviorTrackingPathAllowlist();
  if (!list) return true;
  return list.some((prefix) => {
    if (prefix === "/") return true;
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

/** Routes that never mount the tracker (admin UI, etc.). */
export function ascendraBehaviorTrackingPathExcluded(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return true;
  return false;
}
