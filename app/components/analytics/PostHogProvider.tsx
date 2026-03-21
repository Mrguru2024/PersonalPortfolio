"use client";

import { useEffect } from "react";
import { initPostHogClient, getPostHogClient } from "@/lib/analytics/posthog-client";

const VISITOR_ID_KEY = "v_id";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existingVisitorId = localStorage.getItem(VISITOR_ID_KEY) ?? undefined;
    initPostHogClient(existingVisitorId);
    const posthog = getPostHogClient();
    if (existingVisitorId) {
      posthog.identify(existingVisitorId);
    }
  }, []);

  return <>{children}</>;
}
