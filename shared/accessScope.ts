/**
 * Ascendra Growth OS — access roles and data visibility classification.
 * Used server-side for authorization and client-side for display (non-secret labels only).
 *
 * Does not import super-admin env logic: client bundles must use `isSuperUser` from GET /api/user
 * (and getSessionUser attaches the same flag server-side). See auth-helpers /api/user.
 */

export const ASCENDRA_ACCESS_ROLES = [
  "ADMIN",
  "INTERNAL_TEAM",
  "CLIENT",
  "PUBLIC",
] as const;

export type AscendraAccessRole = (typeof ASCENDRA_ACCESS_ROLES)[number];

/** How primary data for a module/entity may be exposed outside the org. */
export const DATA_VISIBILITY_TIERS = [
  "internal_only",
  "client_visible",
  "public_visible",
] as const;

export type DataVisibilityTier = (typeof DATA_VISIBILITY_TIERS)[number];

export interface SessionUserLike {
  id?: number;
  isAdmin?: boolean | null;
  adminApproved?: boolean | null;
  role?: string | null;
  email?: string | null;
  username?: string | null;
  permissions?: Record<string, boolean> | null;
  /** Set by GET /api/user and getSessionUser via userMatchesSuperAdminIdentity (server only). */
  isSuperUser?: boolean | null;
}

/**
 * Maps session user to coarse access role for UI and policy checks.
 * - ADMIN: approved admin or break-glass super user (`isSuperUser` from session/API).
 * - INTERNAL_TEAM: explicit permission `internal_team` (non-admin staff tooling; future phases).
 * - CLIENT: any other authenticated user.
 * - PUBLIC: unauthenticated.
 */
export function resolveAscendraAccessRole(
  user: SessionUserLike | null | undefined,
): AscendraAccessRole {
  if (!user) return "PUBLIC";

  const isApprovedAdmin = user.isAdmin === true && user.adminApproved === true;

  if (isApprovedAdmin || user.isSuperUser === true) {
    return "ADMIN";
  }

  const perms = user.permissions;
  if (perms?.internal_team === true) {
    return "INTERNAL_TEAM";
  }

  return "CLIENT";
}

export function parseDataVisibilityTier(raw: string | null | undefined): DataVisibilityTier | null {
  if (!raw) return null;
  if (DATA_VISIBILITY_TIERS.includes(raw as DataVisibilityTier)) {
    return raw as DataVisibilityTier;
  }
  return null;
}

export function assertDataVisibilityTier(raw: string): DataVisibilityTier {
  const v = parseDataVisibilityTier(raw);
  if (!v) {
    throw new Error(`Invalid data visibility tier: ${raw}`);
  }
  return v;
}

/** Phase 1: Growth OS admin UI and APIs require approved admin (same as isAdmin()). */
export function canAccessGrowthOsAdminPhase1(user: SessionUserLike | null | undefined): boolean {
  return resolveAscendraAccessRole(user) === "ADMIN";
}

/** Future: internal tools visible to internal team without full admin. */
export function canAccessGrowthOsInternalTools(user: SessionUserLike | null | undefined): boolean {
  const r = resolveAscendraAccessRole(user);
  return r === "ADMIN" || r === "INTERNAL_TEAM";
}
