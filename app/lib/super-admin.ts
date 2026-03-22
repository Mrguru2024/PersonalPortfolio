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
