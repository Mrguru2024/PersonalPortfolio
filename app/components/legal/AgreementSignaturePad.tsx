"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AgreementSignaturePadProps {
  className?: string;
  onChange: (pngDataUrl: string | null) => void;
}

/** Lightweight canvas signature; exports PNG data URL for optional storage. */
export function AgreementSignaturePad({ className, onChange }: AgreementSignaturePadProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastSignatureDataUrl = useRef<string | null>(null);
  const [empty, setEmpty] = useState(true);
  const canvasHeight = 160;

  const syncCanvasSize = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = ref.current;
    if (!wrapper || !canvas || typeof window === "undefined") return;
    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const cssWidth = Math.max(180, Math.floor(wrapperWidth));
    const dpr = window.devicePixelRatio || 1;
    const savedSignature = lastSignatureDataUrl.current;
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvasHeight * dpr));
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, dpr * 2);
    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        const drawCtx = canvas.getContext("2d");
        if (!drawCtx) return;
        drawCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = savedSignature;
      setEmpty(false);
      return;
    }
    setEmpty(true);
  }, []);

  useEffect(() => {
    syncCanvasSize();
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => syncCanvasSize());
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [syncCanvasSize]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const flush = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      lastSignatureDataUrl.current = dataUrl;
      onChange(dataUrl);
    } catch {
      lastSignatureDataUrl.current = null;
      onChange(null);
    }
  }, [onChange]);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "hsl(var(--foreground))";
    const scale = canvas.width / Math.max(1, canvas.clientWidth);
    ctx.lineWidth = Math.max(2, scale * 2);
    ctx.lineCap = "round";
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setEmpty(false);
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
    lastSignatureDataUrl.current = null;
    onChange(null);
  };

  return (
    <div ref={wrapperRef} className={cn("space-y-2", className)}>
      <canvas
        ref={ref}
        className="w-full max-w-full touch-none rounded-md border border-border bg-background"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Clear signature
        </Button>
        {empty ?
          <span className="text-xs text-muted-foreground self-center break-words">
            Optional — draw if you want a captured signature.
          </span>
        : null}
      </div>
    </div>
  );
}
