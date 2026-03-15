/** Super admin email allowed for system monitoring and full admin (must match auth-helpers SUPER_ADMIN_EMAIL). */
export const SUPER_ADMIN_EMAIL = "5epmgllc@gmail.com";

/** Client-side check: is this user a super admin (developer, 5epmgllc username, or super admin email)? */
export function isSuperAdminUser(user: { role?: string | null; username?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  return (
    user.role === "developer" ||
    user.username === "5epmgllc" ||
    (!!user.email && String(user.email).toLowerCase() === SUPER_ADMIN_EMAIL)
  );
}
