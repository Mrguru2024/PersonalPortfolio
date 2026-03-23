"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, GripHorizontal, Minus, X, Radio } from "lucide-react";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveFeedItem, LiveFeedResponse } from "@/lib/adminLiveFeedTypes";
import { queryClient } from "@/lib/queryClient";

const UI_KEY = "ascendra_super_live_log_ui_v1";
const FEED_QK = ["super-admin-live-feed"] as const;

type SavedUi = {
  x: number;
  y: number;
  w: number;
  h: number;
  open: boolean;
  minimized: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function loadUi(): SavedUi | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedUi;
    if (typeof p.x !== "number" || typeof p.w !== "number") return null;
    return p;
  } catch {
    return null;
  }
}

function saveUi(p: SavedUi): void {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function defaultUi(): SavedUi {
  if (typeof window === "undefined") {
    return { x: 24, y: 120, w: 400, h: 300, open: false, minimized: false };
  }
  const w = 420;
  const h = 320;
  return {
    x: clamp(window.innerWidth - w - 20, 8, window.innerWidth - 120),
    y: clamp(window.innerHeight - h - 28, 8, window.innerHeight - 80),
    w,
    h,
    open: false,
    minimized: false,
  };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Super-admin only: floating PIP-style live activity (auth audit, visitor events, in-memory API/error log).
 * Draggable header, native resize (corner drag), transparent blurred panel. Toggle from FAB.
 */
export function SuperAdminLiveActivityLog() {
  const { user } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const [ui, setUi] = useState<SavedUi>(() => defaultUi());
  const [lines, setLines] = useState<LiveFeedItem[]>([]);
  const maxSeenMs = useRef(0);
  const bootstrapped = useRef(false);
  const hydrated = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    const saved = loadUi();
    if (saved) {
      setUi((prev) => ({
        ...prev,
        ...saved,
        x: clamp(saved.x, 0, Math.max(0, window.innerWidth - 160)),
        y: clamp(saved.y, 0, Math.max(0, window.innerHeight - 80)),
        w: clamp(saved.w, 280, window.innerWidth - 16),
        h: clamp(saved.h, 140, window.innerHeight - 24),
      }));
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveUi(ui);
  }, [ui]);

  const openPanel = useCallback(() => {
    maxSeenMs.current = 0;
    bootstrapped.current = false;
    setLines([]);
    setUi((u) => ({ ...u, open: true, minimized: false }));
    void queryClient.invalidateQueries({ queryKey: [...FEED_QK] });
  }, []);

  const closePanel = useCallback(() => {
    setUi((u) => ({ ...u, open: false, minimized: false }));
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: FEED_QK,
    enabled: isSuper && ui.open && !ui.minimized,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: isSuper && ui.open && !ui.minimized ? 2800 : false,
    queryFn: async (): Promise<LiveFeedResponse> => {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (maxSeenMs.current > 0) {
        params.set("afterMs", String(maxSeenMs.current));
      }
      const res = await fetch(`/api/admin/system/live-feed?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      return res.json() as Promise<LiveFeedResponse>;
    },
  });

  useEffect(() => {
    if (!data?.items) return;
    const incoming = data.items;
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      setLines(incoming);
    } else if (incoming.length > 0) {
      setLines((prev) => {
        const seen = new Set(prev.map((l) => l.id));
        const fresh = incoming.filter((i) => !seen.has(i.id));
        if (!fresh.length) return prev;
        return [...fresh, ...prev].slice(0, 220);
      });
    }
    let maxT = maxSeenMs.current;
    for (const row of incoming) {
      const t = new Date(row.at).getTime();
      if (!Number.isNaN(t)) maxT = Math.max(maxT, t);
    }
    if (typeof data.serverTime === "number") {
      maxT = Math.max(maxT, data.serverTime);
    }
    maxSeenMs.current = maxT;
  }, [data]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    if (!ui.open || ui.minimized) return;
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr || cr.width < 100 || cr.height < 80) return;
      setUi((u) => {
        if (Math.abs(u.w - cr.width) < 1.5 && Math.abs(u.h - cr.height) < 1.5) return u;
        return { ...u, w: Math.round(cr.width), h: Math.round(cr.height) };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ui.open, ui.minimized]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d?.active) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      setUi((u) => ({
        ...u,
        x: clamp(d.origX + dx, 0, window.innerWidth - 120),
        y: clamp(d.origY + dy, 0, window.innerHeight - 72),
      }));
    };
    const onUp = () => {
      if (dragRef.current) dragRef.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const startMove = (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: ui.x,
      origY: ui.y,
    };
  };

  if (!isSuper) return null;

  return (
    <>
      {(!ui.open || ui.minimized) && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn(
            "fixed z-[9998] h-11 w-11 rounded-full border border-border/80 shadow-lg",
            "bg-background/85 backdrop-blur-md hover:bg-background/95",
            "bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left,0px))]",
          )}
          aria-label="Open live activity log"
          onClick={() => {
            if (ui.open && ui.minimized) {
              setUi((u) => ({ ...u, minimized: false }));
            } else {
              openPanel();
            }
          }}
        >
          <Radio className="h-5 w-5 text-primary" aria-hidden />
        </Button>
      )}

      {ui.open && (
        <div
          ref={panelRef}
          className={cn(
            "fixed z-[9999] flex flex-col overflow-hidden rounded-lg border border-border/70 shadow-2xl",
            "bg-background/72 dark:bg-background/55 backdrop-blur-lg",
            "ring-1 ring-border/40",
          )}
          style={{
            left: ui.x,
            top: ui.y,
            width: ui.w,
            height: ui.minimized ? 48 : ui.h,
            resize: ui.minimized ? "none" : "both",
            minWidth: 280,
            minHeight: ui.minimized ? 48 : 160,
            maxWidth: "calc(100vw - 8px)",
            maxHeight: ui.minimized ? 48 : "calc(100vh - 8px)",
          }}
          role="dialog"
          aria-label="Live activity log"
        >
          <header
            className="flex shrink-0 cursor-grab items-center gap-2 border-b border-border/60 bg-muted/30 px-2 py-1.5 active:cursor-grabbing"
            onPointerDown={startMove}
          >
            <GripHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-tight">
              Live activity
            </span>
            {isFetching && !ui.minimized && (
              <span className="text-[10px] text-muted-foreground tabular-nums">Updating…</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={ui.minimized ? "Expand" : "Minimize"}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setUi((u) => ({ ...u, minimized: !u.minimized }))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Close"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={closePanel}
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {!ui.minimized && (
            <div
              className="flex min-h-0 flex-1 flex-col"
              aria-live="polite"
              aria-relevant="additions"
            >
              <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
              {lines.length === 0 && !isFetching && (
                <p className="px-1 text-xs text-muted-foreground">
                  No events yet. Waiting for activity…
                </p>
              )}
              <ul className="flex flex-col gap-1.5">
                {lines.map((row) => (
                  <li
                    key={row.id}
                    className={cn(
                      "rounded-md border border-border/50 bg-background/40 px-2 py-1.5 text-[11px] leading-snug",
                      row.severity === "error" && "border-destructive/40 bg-destructive/5",
                      row.severity === "warn" && "border-amber-500/35 bg-amber-500/5",
                    )}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatTime(row.at)}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1 py-0 text-[10px] font-medium uppercase tracking-wide",
                          row.kind === "visitor" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                          row.kind === "audit" && "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                          row.kind === "runtime" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                          row.kind === "error" && "bg-destructive/15 text-destructive",
                          !["visitor", "audit", "runtime", "error"].includes(row.kind) &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {row.kind}
                      </span>
                      <span className="min-w-0 flex-1 font-medium text-foreground">{row.title}</span>
                    </div>
                    {row.subtitle ? (
                      <p className="mt-0.5 break-words text-[10px] text-muted-foreground">
                        {row.subtitle}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
