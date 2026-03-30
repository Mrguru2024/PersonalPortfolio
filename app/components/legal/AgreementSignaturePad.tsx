"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AgreementSignaturePadProps {
  className?: string;
  onChange: (pngDataUrl: string | null) => void;
}

/** Lightweight canvas signature; exports PNG data URL for optional storage. */
export function AgreementSignaturePad({ className, onChange }: AgreementSignaturePadProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = ref.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const flush = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      onChange(canvas.toDataURL("image/png"));
    } catch {
      onChange(null);
    }
  }, [onChange]);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    setEmpty(false);
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    flush();
  };

  const end = () => {
    drawing.current = false;
    flush();
  };

  const clear = () => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <canvas
        ref={ref}
        width={480}
        height={160}
        className="w-full max-w-full touch-none rounded-md border border-border bg-background"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Clear signature
        </Button>
        {empty ?
          <span className="text-xs text-muted-foreground self-center">Optional — draw if you want a captured signature.</span>
        : null}
      </div>
    </div>
  );
}
