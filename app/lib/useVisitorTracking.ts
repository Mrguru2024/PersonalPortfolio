"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LeadTrackingEventType } from "@/lib/lead-tracking-types";

const VISITOR_ID_KEY = "v_id";
const SESSION_ID_KEY = "v_sid";
const LAST_PAGE_VIEW_KEY = "v_last_pv";
const PAGE_VIEW_DEBOUNCE_MS = 30_000; // only one page_view per path per 30s per session

/** @deprecated Use LeadTrackingEventType from @/lib/lead-tracking-types */
export type VisitorEventType = LeadTrackingEventType;

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

/** Returns true if we should skip this page_view to avoid redundant API calls. */
function shouldSkipPageView(path: string): boolean {
  try {
    const raw = sessionStorage.getItem(LAST_PAGE_VIEW_KEY);
    if (!raw) return false;
    const { path: lastPath, time } = JSON.parse(raw) as { path: string; time: number };
    if (lastPath !== path) return false;
    return Date.now() - time < PAGE_VIEW_DEBOUNCE_MS;
  } catch {
    return false;
  }
}

function markPageViewSent(path: string): void {
  try {
    sessionStorage.setItem(LAST_PAGE_VIEW_KEY, JSON.stringify({ path, time: Date.now() }));
  } catch {
    /* ignore */
  }
}

/**
 * Fire-and-forget visitor tracking to POST /api/track/visitor.
 * Page views are deduped: at most one per path per 30s per session. Other events are sent as-is.
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
      eventType: LeadTrackingEventType,
      options?: {
        pageVisited?: string;
        component?: string;
        section?: string;
        metadata?: Record<string, unknown>;
      }
    ) => {
      const pageVisited =
        options?.pageVisited ?? (typeof window !== "undefined" ? window.location.pathname || "/" : "/");

      if (eventType === "page_view" && typeof sessionStorage !== "undefined" && shouldSkipPageView(pageVisited)) {
        return;
      }

      const visitorId = visitorIdRef.current || getVisitorId();
      const sessionId = sessionIdRef.current || getSessionId();
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
      if (options?.component) metadata.component = options.component;
      if (options?.section) metadata.section = options.section;

      if (eventType === "page_view") markPageViewSent(pageVisited);

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
