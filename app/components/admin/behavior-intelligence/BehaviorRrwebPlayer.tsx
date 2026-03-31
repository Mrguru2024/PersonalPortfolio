"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { extractReplayMeta } from "@/lib/rrwebReplayMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Circle } from "lucide-react";

import "rrweb-player/dist/style.css";

export interface BehaviorRrwebPlayerProps {
  readonly events: unknown[];
  /** Poll ingest append: player grows via addEvent instead of full remount each poll. */
  readonly live?: boolean;
  readonly className?: string;
}

type FrameMode = "desktop" | "mobile";

type RrwebPlayerHandle = {
  pause?: () => void;
  addEvent?: (e: unknown) => void;
};

/**
 * rrweb player with video-style chrome (theater) + optional live tailing via addEvent.
 */
export function BehaviorRrwebPlayer({ events, className, live = false }: BehaviorRrwebPlayerProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RrwebPlayerHandle | null>(null);
  const appliedLenRef = useRef(0);
  const lastFrameRef = useRef<FrameMode>("desktop");
  const [frame, setFrame] = useState<FrameMode>("desktop");

  const meta = useMemo(() => extractReplayMeta(events), [events]);

  const dims = useMemo(
    () =>
      frame === "mobile" ?
        { width: 390, height: 720 }
      : { width: Math.min(1200, typeof window !== "undefined" ? window.innerWidth - 80 : 1100), height: 640 },
    [frame],
  );

  /** Recorded sessions: rebuild player when events or frame change. */
  useEffect(() => {
    if (live) return;
    let destroyed = false;
    let pause: (() => void) | undefined;
    void (async () => {
      if (!targetRef.current || events.length === 0) return;
      const el = targetRef.current;
      const mod = await import("rrweb-player");
      const Player = (mod as { default?: new (o: unknown) => RrwebPlayerHandle }).default;
      if (!Player || destroyed || !el) return;
      try {
        el.innerHTML = "";
        const instance = new Player({
          target: el,
          props: {
            events,
            speed: 1,
            autoPlay: false,
            showController: true,
            skipInactive: true,
            inactiveColor: "#404040",
            ...dims,
          },
        });
        pause = instance.pause?.bind(instance);
        playerRef.current = instance;
      } catch {
        /* ignore */
      }
    })();
    return () => {
      destroyed = true;
      pause?.();
      playerRef.current = null;
      if (targetRef.current) targetRef.current.innerHTML = "";
    };
  }, [events, frame, live, dims]);

  /** Live: one player, append events as polls arrive; rebuild on frame change. */
  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    void (async () => {
      const el = targetRef.current;
      if (!el) return;
      if (lastFrameRef.current !== frame) {
        lastFrameRef.current = frame;
        el.innerHTML = "";
        playerRef.current = null;
        appliedLenRef.current = 0;
      }

      const mod = await import("rrweb-player");
      const Player = (mod as { default?: new (o: unknown) => RrwebPlayerHandle }).default;
      if (cancelled || !Player || !targetRef.current) return;

      if (events.length === 0) {
        if (targetRef.current) targetRef.current.innerHTML = "";
        playerRef.current = null;
        appliedLenRef.current = 0;
        return;
      }

      if (!playerRef.current) {
        targetRef.current.innerHTML = "";
        playerRef.current = new Player({
          target: targetRef.current,
          props: {
            events: [...events],
            speed: 1,
            autoPlay: true,
            showController: true,
            skipInactive: true,
            inactiveColor: "#404040",
            ...dims,
          },
        });
        appliedLenRef.current = events.length;
        return;
      }

      const inst = playerRef.current;
      if (events.length > appliedLenRef.current && inst.addEvent) {
        try {
          for (let i = appliedLenRef.current; i < events.length; i++) {
            inst.addEvent(events[i]);
          }
        } catch {
          /* ignore malformed tail */
        }
        appliedLenRef.current = events.length;
      }
      lastFrameRef.current = frame;
    })();

    return () => {
      cancelled = true;
    };
  }, [events, frame, live, dims]);

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
        {live ? "Waiting for live events…" : "No replay events for this session."}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-gradient-to-b from-muted/50 to-muted/20 px-3 py-2 text-sm">
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {live ? "Live stream" : "Recording"}
          </Badge>
          {live ?
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
              <Circle className="h-2 w-2 fill-current animate-pulse" />
              LIVE
            </span>
          : null}
          <p className="font-medium text-foreground truncate" title={meta.pathLabel ?? undefined}>
            {meta.pathLabel ? meta.pathLabel : "Session playback"}
          </p>
          {meta.href ?
            <p className="text-xs text-muted-foreground truncate w-full sm:w-auto">{meta.href}</p>
          : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            size="sm"
            variant={frame === "mobile" ? "default" : "outline"}
            className="gap-1"
            onClick={() => setFrame("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden />
            Mobile
          </Button>
          <Button
            type="button"
            size="sm"
            variant={frame === "desktop" ? "default" : "outline"}
            className="gap-1"
            onClick={() => setFrame("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" aria-hidden />
            Desktop
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "relative rounded-xl bg-black ring-1 ring-white/10 shadow-2xl overflow-hidden",
          frame === "mobile" ? "max-w-[420px] mx-auto" : "w-full max-w-full",
        )}
      >
        <div className="absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        <p className="absolute top-2 left-3 z-10 text-[10px] uppercase tracking-wider text-white/50 pointer-events-none">
          {live ? "Live video-style playback" : "Recorded playback · timeline below"}
        </p>
        <div ref={targetRef} className="w-full min-h-[360px] bg-zinc-950 [&_.rr-controller]:border-t [&_.rr-controller]:border-white/10" />
      </div>
      <p className="text-xs text-muted-foreground">
        {live ?
          "Events stream in as the visitor moves. Use the controller bar to pause and scrub like a screen recording."
        : "Use play/pause and the scrub bar (with inactive gaps dimmed) like a video. Switch device size to reflow the viewport."}
      </p>
    </div>
  );
}
