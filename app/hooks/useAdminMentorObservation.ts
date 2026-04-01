"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

type SettingsPayload = {
  aiMentorObserveUsage?: boolean;
};

/** Batches /admin path transitions + dwell time; POSTs silently when observation is enabled in settings. */
export function useAdminMentorObservation() {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const qc = useQueryClient();
  const isAdmin = user?.isAdmin === true && user?.adminApproved === true;

  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings");
      return res.json() as Promise<SettingsPayload>;
    },
    enabled: isAdmin,
    staleTime: 120_000,
  });

  const observe = isAdmin && settings?.aiMentorObserveUsage === true;

  const bufferRef = useRef<{ path: string; enteredAt: string; dwellMs?: number }[]>([]);
  const sessionRef = useRef<{ path: string; at: number } | null>(null);
  const flushingRef = useRef(false);

  const flush = useCallback(async () => {
    if (!observe || flushingRef.current) return;
    const batch = bufferRef.current.splice(0, bufferRef.current.length);
    if (batch.length === 0) return;
    flushingRef.current = true;
    try {
      const res = await fetch("/api/admin/agent/observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events: batch }),
      });
      if (!res.ok) return;
      const data = (await res.json().catch(() => null)) as { checkpointAdded?: boolean } | null;
      if (data?.checkpointAdded) {
        qc.invalidateQueries({ queryKey: ["/api/admin/agent", "bootstrap"] });
      }
    } catch {
      /* silent */
    } finally {
      flushingRef.current = false;
    }
  }, [observe, qc]);

  useEffect(() => {
    if (!observe) return;
    const now = Date.now();
    const prev = sessionRef.current;
    if (prev && prev.path.startsWith("/admin")) {
      if (!pathname.startsWith("/admin") || prev.path !== pathname) {
        const dwellMs = Math.min(Math.max(0, now - prev.at), 86_400_000);
        bufferRef.current.push({
          path: prev.path,
          enteredAt: new Date(prev.at).toISOString(),
          dwellMs,
        });
      }
    }
    if (pathname.startsWith("/admin")) {
      sessionRef.current = { path: pathname, at: now };
    } else {
      sessionRef.current = null;
    }
  }, [pathname, observe]);

  useEffect(() => {
    if (!observe) return;
    const id = globalThis.setInterval(() => void flush(), 55_000);
    return () => globalThis.clearInterval(id);
  }, [observe, flush]);

  useEffect(() => {
    if (!observe) return;
    const onHide = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    globalThis.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      globalThis.removeEventListener("pagehide", onHide);
    };
  }, [observe, flush]);

  useEffect(() => {
    if (!observe) return;
    return () => {
      void flush();
    };
  }, [observe, flush]);
}
