"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startAscendraBehaviorTracking } from "@/lib/tracking/ascendra-behavior-tracker";

/**
 * Starts rrweb + click heatmap ingestion for the current page (respects `ascendra_behavior_opt_out`).
 * Mount once per route surface that should feed Behavior Intelligence.
 */
export function AscendraBehaviorPageTracker() {
  const pathname = usePathname() ?? "/";
  useEffect(() => {
    const href =
      typeof window !== "undefined" ? `${window.location.origin}${pathname}${window.location.search}` : "";
    const { stop } = startAscendraBehaviorTracking({ businessId: "ascendra_main", pathname, href: href || undefined });
    return () => stop();
  }, [pathname]);
  return null;
}
