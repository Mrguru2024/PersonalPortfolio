"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LeadTrackingEventType } from "@/lib/lead-tracking-types";
import {
  ASC_SESSION_COOKIE,
  ASC_VISITOR_COOKIE,
  getAttributionSnapshot,
  persistAttributionInBrowser,
  setCookieValue,
} from "@/lib/analytics/attribution";

const VISITOR_ID_KEY = "v_id";
const SESSION_ID_KEY = "v_sid";
const LAST_PAGE_VIEW_KEY = "v_last_pv";
const PAGE_VIEW_DEBOUNCE_MS = 30_000; // only one page_view per path per 30s per session
const ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

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
    if (typeof window !== "undefined") {
      persistAttributionInBrowser(window.location.href, document.referrer);
    }
    if (visitorIdRef.current) {
      setCookieValue(ASC_VISITOR_COOKIE, visitorIdRef.current, ID_COOKIE_MAX_AGE);
    }
    if (sessionIdRef.current) {
      setCookieValue(ASC_SESSION_COOKIE, sessionIdRef.current, 60 * 60 * 24);
    }
  }, []);

  const track = useCallback(
    (
      eventType: LeadTrackingEventType,
      options?: {
        pageVisited?: string;
        component?: string;
        section?: string;
        leadId?: number;
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
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      let viewport: { width: number; height: number } | undefined;
      let url: string | undefined;
      if (typeof window !== "undefined") {
        viewport = { width: window.innerWidth, height: window.innerHeight };
        url = window.location.href;
        persistAttributionInBrowser(url, referrer);
      }
      const attributionSnapshot = getAttributionSnapshot(visitorId, sessionId);

      const metadata = { ...options?.metadata };
      if (url) metadata.url = url;
      metadata.event_id = eventId;
      metadata.visitor_id = visitorId;
      metadata.session_id = sessionId;
      metadata.attribution = {
        first_touch: attributionSnapshot.firstTouch ?? undefined,
        last_touch: attributionSnapshot.lastTouch ?? undefined,
      };
      Object.assign(metadata, attributionSnapshot.current);
      if (options?.component) metadata.component = options.component;
      if (options?.section) metadata.section = options.section;

      if (eventType === "page_view") markPageViewSent(pageVisited);

      fetch("/api/track/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          leadId: typeof options?.leadId === "number" ? options.leadId : undefined,
          eventType,
          pageVisited,
          referrer: referrer && referrer !== "" ? referrer : undefined,
          viewport,
          metadata: Object.keys(metadata).length ? metadata : undefined,
        }),
      }).catch(() => {});

      if (typeof window !== "undefined") {
        const win = window as unknown as {
          gtag?: (...args: unknown[]) => void;
          fbq?: (...args: unknown[]) => void;
        };
        if (typeof win.gtag === "function") {
          win.gtag("event", eventType, {
            page_path: pageVisited,
            visitor_id: visitorId,
            ...attributionSnapshot.current,
          });
        }
        if (typeof win.fbq === "function" && eventType !== "page_view") {
          win.fbq("trackCustom", eventType, {
            page_path: pageVisited,
            visitor_id: visitorId,
            ...attributionSnapshot.current,
          });
        }
      }
    },
    []
  );

  const getCurrentAttribution = useCallback(
    () => getAttributionSnapshot(visitorIdRef.current || getVisitorId(), sessionIdRef.current || getSessionId()),
    []
  );

  return {
    track,
    getVisitorId: () => visitorIdRef.current || getVisitorId(),
    getSessionId: () => sessionIdRef.current || getSessionId(),
    getAttributionSnapshot: getCurrentAttribution,
  };
}
