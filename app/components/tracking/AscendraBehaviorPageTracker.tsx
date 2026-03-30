"use client";

import { useEffect } from "react";
import { startAscendraBehaviorTracking } from "@/lib/tracking/ascendra-behavior-tracker";

/**
 * Starts rrweb + click heatmap ingestion for the current page (respects `ascendra_behavior_opt_out`).
 * Mount once per route surface that should feed Behavior Intelligence.
 */
export function AscendraBehaviorPageTracker() {
  useEffect(() => {
    const { stop } = startAscendraBehaviorTracking({ businessId: "ascendra_main" });
    return () => stop();
  }, []);
  return null;
}
