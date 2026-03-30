/**
 * Browser Behavior Intelligence recorder (admin analytics — not for end-clients).
 * Privacy: masks inputs, ignores [data-private], can be disabled via localStorage ascendra_behavior_opt_out=1
 */
"use client";

import { record } from "rrweb";

export type AscendraBehaviorTrackerOptions = {
  businessId?: string;
  /** Defaults to /api/behavior/ingest */
  ingestUrl?: string;
  /** Merged into event payloads for visitor_activity bridge */
  visitorId?: string;
  /** Called after each flush */
  onError?: (e: unknown) => void;
};

const OPT_OUT_KEY = "ascendra_behavior_opt_out";
const SESSION_KEY = "ascendra_behavior_sid";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID?.() ?? `bh_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `bh_${Date.now()}`;
  }
}

export function isAscendraBehaviorTrackingOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAscendraBehaviorTrackingOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Start rrweb recording + periodic flush to /api/behavior/ingest.
 * Returns stop handle and helpers for custom events / heatmap clicks.
 */
export function startAscendraBehaviorTracking(opts: AscendraBehaviorTrackerOptions = {}) {
  if (typeof window === "undefined") {
    return { stop: () => {}, sessionId: "", sendEvent: async () => {}, flush: async () => {} };
  }
  if (isAscendraBehaviorTrackingOptedOut()) {
    return { stop: () => {}, sessionId: "", sendEvent: async () => {}, flush: async () => {} };
  }

  const ingestUrl = opts.ingestUrl ?? "/api/behavior/ingest";
  const sessionId = getSessionId();
  let seq = 0;
  const buffer: unknown[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const ingestHeaders = (): HeadersInit => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const token = process.env.NEXT_PUBLIC_BEHAVIOR_INGEST_TOKEN?.trim();
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const post = async (body: Record<string, unknown>) => {
    try {
      await fetch(ingestUrl, {
        method: "POST",
        headers: ingestHeaders(),
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch (e) {
      opts.onError?.(e);
    }
  };

  const flushReplay = async (force = false) => {
    if (buffer.length === 0) return;
    if (!force && buffer.length < 20) return;
    const chunk = buffer.splice(0, buffer.length);
    await post({
      sessionId,
      businessId: opts.businessId,
      url: window.location.href,
      device: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
      replaySegments: [{ seq: seq++, events: chunk }],
    });
  };

  const scheduleFlush = () => {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushReplay(true);
    }, 2500);
  };

  const stopRecord = record({
    emit(ev) {
      buffer.push(ev);
      if (buffer.length >= 60) void flushReplay(true);
      else scheduleFlush();
    },
    maskAllInputs: true,
    maskTextSelector: "[data-private], [data-behavior-mask], [type=\"password\"], [autocomplete=\"cc-number\"], [autocomplete=\"cc-csc\"]",
    blockSelector: "[data-behavior-block]",
    ignoreClass: "ascendra-behavior-ignore",
    sampling: {
      mousemove: false,
      scroll: 120,
    },
  });

  const sendEvent = async (eventType: string, eventData?: Record<string, unknown>) => {
    await post({
      sessionId,
      businessId: opts.businessId,
      url: window.location.href,
      device: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
      events: [
        {
          eventType,
          eventData: { ...eventData, visitorId: opts.visitorId, page: window.location.pathname },
          timestamp: Date.now(),
        },
      ],
    });
  };

  const sendHeatmapClick = async (x: number, y: number, viewportW: number, viewportH: number) => {
    await post({
      sessionId,
      businessId: opts.businessId,
      url: window.location.href,
      device: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
      heatmapPoints: [
        {
          page: window.location.pathname + window.location.search,
          x: Math.round(x),
          y: Math.round(y),
          viewportW: Math.round(viewportW),
          viewportH: Math.round(viewportH),
          eventType: "click",
        },
      ],
    });
  };

  document.addEventListener(
    "click",
    (e) => {
      void sendHeatmapClick(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    },
    { capture: true, passive: true },
  );

  const stop = () => {
    try {
      stopRecord?.();
    } catch {
      /* ignore */
    }
    void flushReplay(true);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
      void flushReplay(true);
    });
  }

  return { stop, sessionId, sendEvent, flush: () => flushReplay(true), sendHeatmapClick };
}
