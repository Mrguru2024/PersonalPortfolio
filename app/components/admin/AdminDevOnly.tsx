"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isAuthSuperUser } from "@/lib/super-admin";

/**
 * Renders `children` only for super admins (hosting owner / engineering gate from `/api/user` `isSuperUser`).
 * Use for env var names, raw IDs, API paths, table names, and other operator-facing—not client-facing—details.
 */
export function AdminDevOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  return isAuthSuperUser(user) ? <>{children}</> : <>{fallback}</>;
}

/** Boolean helper when you need the same gate in logic (e.g. toast body). */
export function useIsAdminSuperUser(): boolean {
  const { user } = useAuth();
  return isAuthSuperUser(user);
}
