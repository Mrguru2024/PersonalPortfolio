"use client";

import { useEffect, useRef } from "react";

import "rrweb-player/dist/style.css";

export interface BehaviorRrwebPlayerProps {
  readonly events: unknown[];
}

/** rrweb-player instance (ESM default export shape varies by bundler). */
export function BehaviorRrwebPlayer({ events }: BehaviorRrwebPlayerProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let destroyed = false;
    let pause: (() => void) | undefined;
    void (async () => {
      if (!targetRef.current || events.length === 0) return;
      const el = targetRef.current;
      const mod = await import("rrweb-player");
      const Player = (mod as { default?: new (o: unknown) => { pause?: () => void } }).default;
      if (!Player || destroyed || !el) return;
      try {
        const instance = new Player({
          target: el,
          props: {
            events,
            speed: 1,
            autoPlay: false,
            showController: true,
          },
        });
        pause = instance.pause?.bind(instance);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      destroyed = true;
      pause?.();
      if (targetRef.current) targetRef.current.innerHTML = "";
    };
  }, [events]);

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No replay events for this session.</p>;
  }

  return <div ref={targetRef} className="w-full min-h-[400px] border rounded-lg overflow-hidden bg-muted/30" />;
}
