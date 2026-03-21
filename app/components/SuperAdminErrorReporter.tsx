"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isSuperAdminUser } from "@shared/super-admin-identities";

/**
 * When the current user is a super admin, reports client-side errors and unhandled
 * promise rejections to /api/admin/system/capture so they appear in the system monitor.
 * Renders nothing.
 */
export function SuperAdminErrorReporter() {
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminUser(user ?? null);
  const reported = useRef(new Set<string>());

  useEffect(() => {
    if (!isSuperAdmin) return;

    const report = (message: string, stack?: string) => {
      const key = `${message}:${(stack ?? "").slice(0, 100)}`;
      if (reported.current.has(key)) return;
      reported.current.add(key);
      fetch("/api/admin/system/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          stack: stack ?? undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          route: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      report(
        event.message ?? "Unknown error",
        event.error?.stack
      );
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack : undefined;
      report(`Unhandled rejection: ${message}`, stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [isSuperAdmin]);

  return null;
}
