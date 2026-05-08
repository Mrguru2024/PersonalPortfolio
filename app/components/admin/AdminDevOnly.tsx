"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isAuthSuperUser, shouldShowAdminTechnicalCopy } from "@/lib/super-admin";

/**
 * Renders `children` only when technical/engineering copy is appropriate: super admins always; in
 * `next dev`, any approved admin. Use for env var names, raw IDs, API paths, table names, repo paths.
 */
export function AdminDevOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  return shouldShowAdminTechnicalCopy(user) ? <>{children}</> : <>{fallback}</>;
}

/** Same gate as {@link AdminDevOnly} for inline copy, labels, or toast bodies. */
export function useShowAdminTechnicalCopy(): boolean {
  const { user } = useAuth();
  return shouldShowAdminTechnicalCopy(user);
}

/** Boolean helper when you need the same gate in logic (e.g. toast body). */
export function useIsAdminSuperUser(): boolean {
  const { user } = useAuth();
  return isAuthSuperUser(user);
}
