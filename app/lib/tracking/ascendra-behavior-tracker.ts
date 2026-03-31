/**
 * Browser Behavior Intelligence recorder (admin analytics — not for end-clients).
 * Privacy: masks inputs, ignores [data-private], can be disabled via localStorage ascendra_behavior_opt_out=1
 */
"use client";

import { record } from "rrweb";
import { clientLocationMatchesWatchTarget } from "@shared/ascendraOsWatchScope";

export type AscendraBehaviorTrackerOptions = {
  businessId?: string;
  /** Defaults to /api/behavior/ingest */
  ingestUrl?: string;
  /** Current path for watch-target matching (defaults to window.location.pathname) */
  pathname?: string;
  /** Full URL including query (defaults to window.location.href) */
  href?: string;
  /** Merged into event payloads for visitor_activity bridge */
  visitorId?: string;
  /** Called after each flush */
  onError?: (e: unknown) => void;
};

const OPT_OUT_KEY = "ascendra_behavior_opt_out";
const SESSION_KEY = "ascendra_behavior_sid";

type WatchConfigResponse =
  | { mode: "legacy_all"; targets: [] }
  | {
      mode: "scoped";
      targets: Array<{
        pathPattern: string;
        fullUrlPrefix?: string | null;
        recordReplay: boolean;
        recordHeatmap: boolean;
        maxSessionRecordingMinutes: number;
        collectFrom: string | null;
        collectUntil: string | null;
      }>;
    };

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

function resolveCaptureForPath(
  href: string,
  pathname: string,
  cfg: WatchConfigResponse,
): {
  shouldRecord: boolean;
  recordReplay: boolean;
  recordHeatmap: boolean;
  replayCapMinutes: number | null;
} {
  if (cfg.mode === "legacy_all") {
    return { shouldRecord: true, recordReplay: true, recordHeatmap: true, replayCapMinutes: null };
  }
  let recordReplay = false;
  let recordHeatmap = false;
  let replayCapMinutes: number | null = null;
  for (const t of cfg.targets) {
    if (
      !clientLocationMatchesWatchTarget(href, pathname, {
        pathPattern: t.pathPattern,
        fullUrlPrefix: t.fullUrlPrefix ?? null,
      })
    ) {
      continue;
    }
    if (t.recordReplay) recordReplay = true;
    if (t.recordHeatmap) recordHeatmap = true;
    if (t.recordReplay) {
      const m = t.maxSessionRecordingMinutes;
      replayCapMinutes = replayCapMinutes === null ? m : Math.min(replayCapMinutes, m);
    }
  }
  if (!recordReplay && !recordHeatmap) {
    return { shouldRecord: false, recordReplay: false, recordHeatmap: false, replayCapMinutes: null };
  }
  return { shouldRecord: true, recordReplay, recordHeatmap, replayCapMinutes };
}

/**
 * Start rrweb recording + periodic flush to /api/behavior/ingest when watch config allows.
 * Respects admin “watch targets” (path, replay/heatmap toggles, session duration cap).
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
  let cancelled = false;
  let stopRrweb: (() => void) | null = null;
  let replayCapTimer: ReturnType<typeof setTimeout> | null = null;
  let clickHandler: ((e: MouseEvent) => void) | null = null;
  let scrollHandler: (() => void) | null = null;
  let captureActive = false;
  const scrollMilestonesSent = new Set<string>();

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

  const sendEvent = async (eventType: string, eventData?: Record<string, unknown>) => {
    if (!captureActive) return;
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
    if (!captureActive) return;
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

  const teardownRecording = () => {
    if (replayCapTimer) {
      clearTimeout(replayCapTimer);
      replayCapTimer = null;
    }
    if (stopRrweb) {
      try {
        stopRrweb();
      } catch {
        /* ignore */
      }
      stopRrweb = null;
    }
  };

  const teardownHeatmap = () => {
    if (clickHandler) {
      document.removeEventListener("click", clickHandler, true);
      clickHandler = null;
    }
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler, true);
      scrollHandler = null;
    }
  };

  const stop = () => {
    cancelled = true;
    captureActive = false;
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    teardownRecording();
    teardownHeatmap();
    void flushReplay(true);
  };

  void (async () => {
    const pathname = opts.pathname ?? window.location.pathname;
    const href = opts.href ?? window.location.href;
    const q = opts.businessId ? `?businessId=${encodeURIComponent(opts.businessId)}` : "";
    let cfg: WatchConfigResponse = { mode: "legacy_all", targets: [] };
    try {
      const res = await fetch(`/api/behavior/watch-config${q}`, { headers: ingestHeaders() });
      if (res.ok) cfg = (await res.json()) as WatchConfigResponse;
    } catch {
      /* fall back to legacy_all */
    }
    if (cancelled) return;

    const plan = resolveCaptureForPath(href, pathname, cfg);
    if (!plan.shouldRecord) return;

    captureActive = true;

    if (plan.recordHeatmap) {
      let scrollRaf: number | null = null;
      scrollHandler = () => {
        if (scrollRaf != null) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = null;
          if (!captureActive) return;
          const path = window.location.pathname;
          const el = document.documentElement;
          const sh = el.scrollHeight - el.clientHeight;
          if (sh <= 0) return;
          const pct = Math.min(100, Math.round((el.scrollTop / sh) * 100));
          const milestones = [25, 50, 75, 90];
          for (const m of milestones) {
            if (pct >= m) {
              const key = `${path}_${m}`;
              if (!scrollMilestonesSent.has(key)) {
                scrollMilestonesSent.add(key);
                void sendEvent("scroll_depth", { pct: m, path });
              }
            }
          }
        });
      };
      window.addEventListener("scroll", scrollHandler, { passive: true, capture: true });

      clickHandler = (e: MouseEvent) => {
        void sendHeatmapClick(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
        const t = e.target as HTMLElement | null;
        const cta = t?.closest?.("[data-ascendra-cta]") as HTMLElement | null;
        if (cta) {
          void sendEvent("cta_click", {
            ctaKey: cta.getAttribute("data-ascendra-cta") ?? "unnamed",
            tag: cta.tagName,
          });
        }
      };
      document.addEventListener("click", clickHandler, { capture: true, passive: true });
    }

    if (plan.recordReplay) {
      const stopRec = record({
        emit(ev) {
          buffer.push(ev);
          if (buffer.length >= 60) void flushReplay(true);
          else scheduleFlush();
        },
        maskAllInputs: true,
        maskTextSelector:
          "[data-private], [data-behavior-mask], [type=\"password\"], [autocomplete=\"cc-number\"], [autocomplete=\"cc-csc\"]",
        blockSelector: "[data-behavior-block]",
        ignoreClass: "ascendra-behavior-ignore",
        sampling: {
          mousemove: false,
          scroll: 120,
        },
      });
      stopRrweb = typeof stopRec === "function" ? stopRec : null;

      if (plan.replayCapMinutes != null && plan.replayCapMinutes > 0) {
        replayCapTimer = setTimeout(() => {
          teardownRecording();
        }, plan.replayCapMinutes * 60_000);
      }
    }
  })();

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
      void flushReplay(true);
    });
  }

  return { stop, sessionId, sendEvent, flush: () => flushReplay(true), sendHeatmapClick };
}
