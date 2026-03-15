"use client";

import { useEffect } from "react";
import { useVisitorTracking } from "@/lib/useVisitorTracking";

/**
 * Call from any page (client or as child of server component) to record a page_view.
 * Use path to override (e.g. for server-rendered pages that don't have usePathname in context).
 */
export function TrackPageView({ path }: { path?: string }) {
  const { track } = useVisitorTracking();
  useEffect(() => {
    track("page_view", {
      pageVisited: path ?? (typeof window !== "undefined" ? window.location.pathname || "/" : "/"),
    });
  }, [track, path]);
  return null;
}
