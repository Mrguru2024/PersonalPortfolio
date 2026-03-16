"use client";

import { useCallback, useEffect, useRef } from "react";

const VISITOR_ID_KEY = "v_id";
const SESSION_ID_KEY = "v_sid";
const ALLOWED_EVENT_TYPES = ["page_view", "form_started", "form_completed", "cta_click", "tool_used"] as const;
export type VisitorEventType = (typeof ALLOWED_EVENT_TYPES)[number];

function getOrSetId(key: string, generator: () => string): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = generator();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return generator();
  }
}

function getVisitorId(): string {
  return getOrSetId(VISITOR_ID_KEY, () => `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`);
}

function getSessionId(): string {
  return getOrSetId(SESSION_ID_KEY, () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
}

/**
 * Fire-and-forget visitor tracking to POST /api/track/visitor.
 * Use for page views, form_started, form_completed, cta_click, tool_used.
 */
export function useVisitorTracking() {
  const visitorIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
    sessionIdRef.current = getSessionId();
  }, []);

  const track = useCallback(
    (
      eventType: VisitorEventType,
      options?: { pageVisited?: string; metadata?: Record<string, unknown> }
    ) => {
      const visitorId = visitorIdRef.current || getVisitorId();
      const sessionId = sessionIdRef.current || getSessionId();
      const pageVisited =
        options?.pageVisited ?? (typeof window !== "undefined" ? window.location.pathname || "/" : "/");
      const referrer = typeof document !== "undefined" ? document.referrer || undefined : undefined;

      let viewport: { width: number; height: number } | undefined;
      let url: string | undefined;
      let utm: Record<string, string> | undefined;
      if (typeof window !== "undefined") {
        viewport = { width: window.innerWidth, height: window.innerHeight };
        url = window.location.href;
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get("utm_source");
        const utmMedium = params.get("utm_medium");
        const utmCampaign = params.get("utm_campaign");
        const utmTerm = params.get("utm_term");
        const utmContent = params.get("utm_content");
        if (utmSource || utmMedium || utmCampaign || utmTerm || utmContent) {
          utm = {};
          if (utmSource) utm.utm_source = utmSource;
          if (utmMedium) utm.utm_medium = utmMedium;
          if (utmCampaign) utm.utm_campaign = utmCampaign;
          if (utmTerm) utm.utm_term = utmTerm;
          if (utmContent) utm.utm_content = utmContent;
        }
      }

      const metadata = { ...options?.metadata };
      if (url) metadata.url = url;
      if (utm && Object.keys(utm).length) Object.assign(metadata, utm);

      fetch("/api/track/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          eventType,
          pageVisited,
          referrer: referrer && referrer !== "" ? referrer : undefined,
          viewport,
          metadata: Object.keys(metadata).length ? metadata : undefined,
        }),
      }).catch(() => {});
    },
    []
  );

  return { track, getVisitorId: () => visitorIdRef.current || getVisitorId(), getSessionId: () => sessionIdRef.current || getSessionId() };
}
