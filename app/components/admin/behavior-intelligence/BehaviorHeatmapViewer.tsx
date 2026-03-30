"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type HeatmapPointRow = {
  x: number;
  y: number;
  viewportW: number | null;
  viewportH: number | null;
  eventType: string;
};

type Props = {
  points: HeatmapPointRow[];
  className?: string;
};

const BIN = 24;

/** Normalizes clicks to 0–1, buckets into a coarse grid for opacity = click density. */
export function BehaviorHeatmapViewer({ points, className }: Props) {
  const circles = useMemo(() => {
    const grid = new Map<string, number>();
    for (const p of points) {
      const vw = p.viewportW && p.viewportW > 0 ? p.viewportW : 1;
      const vh = p.viewportH && p.viewportH > 0 ? p.viewportH : 1;
      const nx = Math.min(1, Math.max(0, p.x / vw));
      const ny = Math.min(1, Math.max(0, p.y / vh));
      const bx = Math.min(BIN - 1, Math.floor(nx * BIN));
      const by = Math.min(BIN - 1, Math.floor(ny * BIN));
      const k = `${bx},${by}`;
      grid.set(k, (grid.get(k) ?? 0) + 1);
    }
    let maxC = 1;
    for (const c of grid.values()) maxC = Math.max(maxC, c);
    const out: { nx: number; ny: number; opacity: number; key: string }[] = [];
    let i = 0;
    for (const [k, c] of grid.entries()) {
      const [bx, by] = k.split(",").map(Number);
      const nx = (bx + 0.5) / BIN;
      const ny = (by + 0.5) / BIN;
      const opacity = 0.2 + 0.75 * (c / maxC);
      out.push({ nx, ny, opacity, key: `${k}-${i++}` });
    }
    return out;
  }, [points]);

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border bg-muted/40 overflow-hidden aspect-[16/10]",
        className,
      )}
      aria-label="Click density overlay (normalized to viewport)"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-muted/60" />
      {circles.map(({ nx, ny, opacity, key }) => (
        <span
          key={key}
          className="absolute w-6 h-6 sm:w-8 sm:h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-1 ring-primary/40 pointer-events-none"
          style={{ left: `${nx * 100}%`, top: `${ny * 100}%`, opacity }}
        />
      ))}
      {circles.length === 0 ?
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
          No points for this page in the selected window.
        </p>
      : null}
    </div>
  );
}
