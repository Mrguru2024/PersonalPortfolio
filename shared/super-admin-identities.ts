import { SUPER_ADMIN_EMAIL } from "./super-admin-email";

/** Minimal user shape for super-admin checks (no circular imports with accessScope). */
export interface SuperAdminUserLike {
  role?: string | null;
  email?: string | null;
  username?: string | null;
}

const DEFAULT_SUPER_USERNAMES = ["5epmgllc"] as const;

/**
 * Optional comma-separated list (case-insensitive usernames).
 * When unset, defaults to legacy `5epmgllc` for backward compatibility.
 */
export function getSuperAdminUsernames(): string[] {
  const raw = process.env.SUPER_ADMIN_USERNAMES?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [...DEFAULT_SUPER_USERNAMES];
}

/**
 * Optional comma-separated super-admin emails (lowercase).
 * When unset, uses {@link SUPER_ADMIN_EMAIL} from code (single source for default).
 */
export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [SUPER_ADMIN_EMAIL.toLowerCase()];
}

/** Super user / break-glass identities: developer role, configured usernames, or configured emails. */
export function userMatchesSuperAdminIdentity(
  user: SuperAdminUserLike | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "developer") return true;
  const un = user.username?.trim().toLowerCase();
  if (un && getSuperAdminUsernames().includes(un)) return true;
  const em = user.email?.trim().toLowerCase();
  if (em && getSuperAdminEmails().includes(em)) return true;
  return false;
}

/** User shape for UI checks (GET /api/user may set isSuperUser server-side). */
export type SuperAdminUserInput = SuperAdminUserLike & {
  isSuperUser?: boolean;
};

/**
 * Prefer isSuperUser from GET /api/user when present; otherwise identity rules.
 * Client UI: `isAuthSuperUser` from `@/lib/super-admin` (leaf module) or re-exported from `@/hooks/use-auth`.
 */
export function isSuperAdminUser(user: SuperAdminUserInput | null | undefined): boolean {
  if (!user) return false;
  if (typeof user.isSuperUser === "boolean") return user.isSuperUser;
  return userMatchesSuperAdminIdentity(user);
}
