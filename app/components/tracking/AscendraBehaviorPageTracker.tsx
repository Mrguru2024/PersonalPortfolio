"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { startAscendraBehaviorTracking } from "@/lib/tracking/ascendra-behavior-tracker";

/**
 * Starts rrweb + click heatmap ingestion for public routes.
 * Excludes admin/internal surfaces while preserving one continuous visitor session id per tab.
 */
export function AscendraBehaviorPageTracker() {
  const pathname = usePathname();
  const trackerRef = useRef<ReturnType<typeof startAscendraBehaviorTracking> | null>(null);

  const shouldTrackRoute = useMemo(() => {
    const path = (pathname || "").toLowerCase();
    if (!path) return true;
    if (path.startsWith("/admin")) return false;
    if (path.startsWith("/api")) return false;
    if (path.startsWith("/dashboard")) return false;
    if (path.startsWith("/_next")) return false;
    return true;
  }, [pathname]);

  useEffect(() => {
    if (!shouldTrackRoute) {
      trackerRef.current?.stop();
      trackerRef.current = null;
      return;
    }
    if (!trackerRef.current) {
      trackerRef.current = startAscendraBehaviorTracking({ businessId: "ascendra_main" });
    }
  }, [shouldTrackRoute]);

  useEffect(() => {
    if (!shouldTrackRoute || !trackerRef.current) return;
    const path = pathname || "/";
    const query = typeof window !== "undefined" ? window.location.search : "";
    void trackerRef.current.sendEvent("page_view", { pageVisited: `${path}${query}` });
  }, [pathname, shouldTrackRoute]);

  useEffect(() => {
    return () => {
      trackerRef.current?.stop();
      trackerRef.current = null;
    };
  }, []);

  return null;
}
