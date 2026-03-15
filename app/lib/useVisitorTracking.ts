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

      fetch("/api/track/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          eventType,
          pageVisited,
          referrer: referrer && referrer !== "" ? referrer : undefined,
          metadata: options?.metadata,
        }),
      }).catch(() => {});
    },
    []
  );

  return { track, getVisitorId: () => visitorIdRef.current || getVisitorId(), getSessionId: () => sessionIdRef.current || getSessionId() };
}
