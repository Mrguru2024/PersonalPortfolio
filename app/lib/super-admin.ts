import { SUPER_ADMIN_EMAIL } from "@shared/super-admin-email";

export { SUPER_ADMIN_EMAIL };

/** Client-side check: is this user a super admin (developer, 5epmgllc username, or super admin email)? */
export function isSuperAdminUser(user: { role?: string | null; username?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  return (
    user.role === "developer" ||
    user.username === "5epmgllc" ||
    (!!user.email && String(user.email).toLowerCase() === SUPER_ADMIN_EMAIL)
  );
}
