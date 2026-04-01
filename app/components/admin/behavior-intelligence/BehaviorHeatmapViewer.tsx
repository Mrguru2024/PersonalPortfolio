"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  /** Density grid + raw clicks + intensity control */
  interactive?: boolean;
};

const BIN_DEFAULT = 24;

/** Normalized heatmap: density clusters + optional raw click overlay. */
export function BehaviorHeatmapViewer({ points, className, interactive = false }: Props) {
  const [binCount, setBinCount] = useState(BIN_DEFAULT);
  const [showRaw, setShowRaw] = useState(true);
  const [hover, setHover] = useState<{ nx: number; ny: number; count: number; key: string } | null>(null);

  const { clusters, rawSample, maxCluster } = useMemo(() => {
    const grid = new Map<string, number>();
    for (const p of points) {
      const vw = p.viewportW && p.viewportW > 0 ? p.viewportW : 1;
      const vh = p.viewportH && p.viewportH > 0 ? p.viewportH : 1;
      const nx = Math.min(1, Math.max(0, p.x / vw));
      const ny = Math.min(1, Math.max(0, p.y / vh));
      const bx = Math.min(binCount - 1, Math.floor(nx * binCount));
      const by = Math.min(binCount - 1, Math.floor(ny * binCount));
      const k = `${bx},${by}`;
      grid.set(k, (grid.get(k) ?? 0) + 1);
    }
    let maxC = 1;
    for (const c of grid.values()) maxC = Math.max(maxC, c);
    const cl: { nx: number; ny: number; opacity: number; key: string; count: number }[] = [];
    let i = 0;
    for (const [k, c] of grid.entries()) {
      const [bx, by] = k.split(",").map(Number);
      const nx = (bx + 0.5) / binCount;
      const ny = (by + 0.5) / binCount;
      const opacity = 0.25 + 0.7 * (c / maxC);
      cl.push({ nx, ny, opacity, key: `${k}-${i++}`, count: c });
    }

    const cap = 500;
    const raw: { nx: number; ny: number; key: string }[] = [];
    const step = Math.max(1, Math.ceil(points.length / cap));
    for (let j = 0; j < points.length && raw.length < cap; j += step) {
      const p = points[j];
      const vw = p.viewportW && p.viewportW > 0 ? p.viewportW : 1;
      const vh = p.viewportH && p.viewportH > 0 ? p.viewportH : 1;
      raw.push({
        nx: Math.min(1, Math.max(0, p.x / vw)),
        ny: Math.min(1, Math.max(0, p.y / vh)),
        key: `r-${j}`,
      });
    }
    return { clusters: cl, rawSample: raw, maxCluster: maxC };
  }, [points, binCount]);

  const onLeave = useCallback(() => setHover(null), []);

  if (!interactive) {
    return (
      <SimpleHeatmap
        points={points}
        className={className}
        binCount={BIN_DEFAULT}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2 min-w-[160px]">
          <Label className="text-xs whitespace-nowrap">Intensity detail</Label>
          <Slider
            value={[binCount]}
            min={12}
            max={48}
            step={4}
            onValueChange={(v) => setBinCount(v[0] ?? BIN_DEFAULT)}
            className="w-[120px]"
          />
          <span className="text-xs text-muted-foreground tabular-nums">{binCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="hm-raw" checked={showRaw} onCheckedChange={setShowRaw} />
          <Label htmlFor="hm-raw" className="text-xs font-normal cursor-pointer">
            Show click points
          </Label>
        </div>
        <span className="text-xs text-muted-foreground">
          {points.length} clicks · peak cell ≈ {maxCluster}
        </span>
      </div>
      <div
        className={cn(
          "relative w-full rounded-lg border bg-muted/40 overflow-hidden aspect-[16/10] touch-none",
          className,
        )}
        onMouseLeave={onLeave}
        aria-label="Interactive click heatmap"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 to-muted/55" />
        {showRaw ?
          rawSample.map(({ nx, ny, key }) => (
            <span
              key={key}
              className="absolute w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/70 pointer-events-none"
              style={{ left: `${nx * 100}%`, top: `${ny * 100}%` }}
            />
          ))
        : null}
        {clusters.map(({ nx, ny, opacity, key, count }) => (
          <button
            key={key}
            type="button"
            className="absolute w-8 h-8 sm:w-10 sm:h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-primary/50 hover:ring-primary cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ left: `${nx * 100}%`, top: `${ny * 100}%`, opacity }}
            title={`~${count} click${count === 1 ? "" : "s"} in this area`}
            onMouseEnter={() => setHover({ nx, ny, count, key })}
            onFocus={() => setHover({ nx, ny, count, key })}
            onBlur={onLeave}
          />
        ))}
        {hover ?
          <div
            className="absolute z-10 rounded-md border bg-popover text-popover-foreground px-2 py-1 text-xs shadow-md pointer-events-none"
            style={{
              left: `${Math.min(88, hover.nx * 100)}%`,
              top: `${Math.max(8, hover.ny * 100 - 12)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            ~{hover.count} clicks
          </div>
        : null}
        {clusters.length === 0 ?
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
            No points for this page in the selected window.
          </p>
        : null}
      </div>
    </div>
  );
}

function SimpleHeatmap({
  points,
  className,
  binCount,
}: {
  points: HeatmapPointRow[];
  className?: string;
  binCount: number;
}) {
  const circles = useMemo(() => {
    const grid = new Map<string, number>();
    for (const p of points) {
      const vw = p.viewportW && p.viewportW > 0 ? p.viewportW : 1;
      const vh = p.viewportH && p.viewportH > 0 ? p.viewportH : 1;
      const nx = Math.min(1, Math.max(0, p.x / vw));
      const ny = Math.min(1, Math.max(0, p.y / vh));
      const bx = Math.min(binCount - 1, Math.floor(nx * binCount));
      const by = Math.min(binCount - 1, Math.floor(ny * binCount));
      const k = `${bx},${by}`;
      grid.set(k, (grid.get(k) ?? 0) + 1);
    }
    let maxC = 1;
    for (const c of grid.values()) maxC = Math.max(maxC, c);
    const out: { nx: number; ny: number; opacity: number; key: string }[] = [];
    let i = 0;
    for (const [k, c] of grid.entries()) {
      const [bx, by] = k.split(",").map(Number);
      const nx = (bx + 0.5) / binCount;
      const ny = (by + 0.5) / binCount;
      const opacity = 0.2 + 0.75 * (c / maxC);
      out.push({ nx, ny, opacity, key: `${k}-${i++}` });
    }
    return out;
  }, [points, binCount]);

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
