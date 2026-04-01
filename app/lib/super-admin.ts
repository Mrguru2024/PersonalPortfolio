/**
 * Leaf module: client super-user UI gate from GET /api/user (`isSuperUser`).
 * Kept free of `@/hooks/use-auth` so Turbopack HMR does not chain-invalidate
 * this factory when auth code hot-reloads (fixes "module factory is not available"
 * on admin/system and similar client chunks).
 */
export function isAuthSuperUser(
  user: { isSuperUser?: boolean } | null | undefined
): boolean {
  return user?.isSuperUser === true;
}

/** Approved admin (same gate as server `isAdmin`: role flag + `adminApproved`). */
export function isAuthApprovedAdmin(
  user: { isAdmin?: boolean | null; adminApproved?: boolean | null } | null | undefined
): boolean {
  return user?.isAdmin === true && user?.adminApproved === true;
}
