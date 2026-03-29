"use client";

import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTourStep } from "@/lib/adminTourConfig";

const OVERLAY_Z = 9999;
const PADDING = 8;
const VIEWPORT_PAD = 16;
const POPUP_GAP = 16;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function computePopupPosition(
  targetRect: DOMRect | null,
  popupW: number,
  popupH: number,
  vw: number,
  vh: number,
): { left: number; top: number } {
  const pad = VIEWPORT_PAD;
  if (!targetRect || popupW <= 0 || popupH <= 0) {
    return {
      left: clamp((vw - popupW) / 2, pad, Math.max(pad, vw - popupW - pad)),
      top: clamp((vh - popupH) / 2, pad, Math.max(pad, vh - popupH - pad)),
    };
  }

  const placeRight = targetRect.right + POPUP_GAP + popupW <= vw - pad;
  const placeLeft = targetRect.left - POPUP_GAP - popupW >= pad;

  let left: number;
  if (placeRight) {
    left = targetRect.right + POPUP_GAP;
  } else if (placeLeft) {
    left = targetRect.left - POPUP_GAP - popupW;
  } else {
    left = clamp(
      targetRect.left + targetRect.width / 2 - popupW / 2,
      pad,
      vw - popupW - pad,
    );
  }

  const idealTop = targetRect.top + targetRect.height / 2 - popupH / 2;
  const top = clamp(idealTop, pad, Math.max(pad, vh - popupH - pad));

  return { left, top };
}

interface AdminGuideTourProps {
  steps: AdminTourStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onEnd: () => void;
  onDismiss: () => void;
}

export function AdminGuideTour({
  steps,
  currentStep,
  onNext,
  onBack,
  onEnd,
  onDismiss,
}: AdminGuideTourProps) {
  const step = steps[currentStep];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number }>(() => ({
    left: typeof window !== "undefined" ? Math.max(VIEWPORT_PAD, (window.innerWidth - 400) / 2) : VIEWPORT_PAD,
    top: typeof window !== "undefined" ? Math.max(VIEWPORT_PAD, (window.innerHeight - 280) / 2) : VIEWPORT_PAD,
  }));

  const updateTarget = useCallback(() => {
    if (!step || step.target === "center") {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el && el instanceof HTMLElement) {
      const rect = el.getBoundingClientRect();
      setTargetRect(
        new DOMRect(
          rect.left - PADDING,
          rect.top - PADDING,
          rect.width + PADDING * 2,
          rect.height + PADDING * 2
        )
      );
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!step) return;
    if (step.target !== "center") {
      const el = document.querySelector(step.target);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      }
    }
    updateTarget();
    const resize = () => updateTarget();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [currentStep, updateTarget]);

  const scheduleMeasure = useCallback(() => {
    const el = popupRef.current;
    if (!el || typeof window === "undefined") return;
    const run = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || el.offsetWidth;
      const h = rect.height || el.offsetHeight;
      if (w < 8 || h < 8) return;
      setPopupPos(
        computePopupPosition(targetRect, w, h, window.innerWidth, window.innerHeight),
      );
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [targetRect]);

  useLayoutEffect(() => {
    scheduleMeasure();
  }, [currentStep, targetRect, step?.id, step?.title, step?.description, scheduleMeasure]);

  useEffect(() => {
    const el = popupRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [scheduleMeasure]);

  useEffect(() => {
    const onResize = () => scheduleMeasure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scheduleMeasure]);

  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const overlay = (
    <div
      className="fixed inset-0"
      style={{ zIndex: OVERLAY_Z, backgroundColor: targetRect ? "transparent" : "rgba(0,0,0,0.45)" }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-desc"
    >
      {/* Dark overlay with transparent "hole" at target (spotlight) when targeting an element */}
      {targetRect && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden
        >
          <defs>
            <mask id={`tour-spotlight-${step.id}`}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                fill="black"
                rx="8"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask={`url(#tour-spotlight-${step.id})`} />
        </svg>
      )}
      {!targetRect && <div className="absolute inset-0 bg-black/45 pointer-events-none" aria-hidden />}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-[3px] ring-primary ring-offset-2 ring-offset-background pointer-events-none"
          style={{
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.28), 0 0 22px hsl(var(--primary) / 0.45)",
          }}
        />
      )}

      {/* Card: position near target or center; clamped to viewport using measured size */}
      <div
        ref={popupRef}
        className="fixed z-[10000] w-[min(calc(100vw-2rem),400px)] max-h-[min(85vh,calc(100dvh-2rem))] overflow-y-auto overflow-x-hidden"
        style={{ left: popupPos.left, top: popupPos.top }}
      >
        <Card className="shadow-xl border-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 p-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <CardTitle id="tour-title" className="text-base">
                  {step.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onDismiss}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription id="tour-desc" className="text-sm mt-1">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {isLast ? (
                <Button size="sm" onClick={onEnd}>
                  Done
                </Button>
              ) : (
                <Button size="sm" onClick={onNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
