/**
 * Ascendra Growth OS — access roles and data visibility classification.
 * Used server-side for authorization and client-side for display (non-secret labels only).
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
}

import { SUPER_ADMIN_EMAIL } from "./super-admin-email";

/** Resolve email-based super user without importing Next-only code. */
function isSuperAdminUserLike(user: SessionUserLike): boolean {
  const email = user.email?.trim().toLowerCase();
  return email === SUPER_ADMIN_EMAIL;
}

/**
 * Maps session user to coarse access role for UI and policy checks.
 * - ADMIN: approved admin, developer role, super-admin email, or legacy super username (aligned with auth-helpers).
 * - INTERNAL_TEAM: explicit permission `internal_team` (non-admin staff tooling; future phases).
 * - CLIENT: any other authenticated user.
 * - PUBLIC: unauthenticated.
 */
export function resolveAscendraAccessRole(
  user: SessionUserLike | null | undefined,
): AscendraAccessRole {
  if (!user) return "PUBLIC";

  const isDevRole = user.role === "developer";
  const isLegacySuperUsername = user.username === "5epmgllc";
  const isApprovedAdmin = user.isAdmin === true && user.adminApproved === true;

  if (
    isApprovedAdmin ||
    isDevRole ||
    isLegacySuperUsername ||
    isSuperAdminUserLike(user)
  ) {
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
