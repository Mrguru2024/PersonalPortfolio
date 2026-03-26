"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTourStep } from "@/lib/adminTourConfig";

const OVERLAY_Z = 9999;
const PADDING = 8;
const CARD_MAX_W = 400;
const CARD_MARGIN = 16;

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
  const reactId = useId();
  const maskId = useMemo(() => `tour-mask-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-${currentStep}`, [reactId, currentStep]);

  const updateTarget = useCallback(() => {
    if (!step || step.target === "center") {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el && el instanceof HTMLElement) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 && rect.height < 2) {
        setTargetRect(null);
        return;
      }
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

  useLayoutEffect(() => {
    if (!step) return;
    if (step.target === "center") {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "center", behavior: "smooth", inline: "nearest" });
    }
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => updateTarget());
    });
    const delayed = window.setTimeout(() => updateTarget(), 420);
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
      window.clearTimeout(delayed);
    };
  }, [currentStep, step, updateTarget]);

  useEffect(() => {
    const onResize = () => updateTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [updateTarget]);

  const cardPosition = useMemo(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    const cardW = Math.min(CARD_MAX_W, vw - CARD_MARGIN * 2);
    const cardHApprox = 280;

    if (!targetRect) {
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: cardW,
      } as const;
    }

    const placeRight = targetRect.left + targetRect.width + 16 + cardW <= vw - CARD_MARGIN;
    let left = placeRight ? targetRect.left + targetRect.width + 16 : targetRect.left - cardW - 16;
    let top = Math.max(CARD_MARGIN, Math.min(targetRect.top, vh - cardHApprox - CARD_MARGIN));

    left = Math.max(CARD_MARGIN, Math.min(left, vw - cardW - CARD_MARGIN));
    top = Math.max(CARD_MARGIN, Math.min(top, vh - cardHApprox - CARD_MARGIN));

    return { left, top, width: cardW, transform: undefined } as const;
  }, [targetRect]);

  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const tips = step.tips?.filter(Boolean) ?? [];
  const tipsId = tips.length > 0 ? "tour-tips" : undefined;
  const ariaDescribedBy = [tipsId, "tour-desc"].filter(Boolean).join(" ");

  const overlay = (
    <div
      className="fixed inset-0 backdrop-blur-[2px] pointer-events-auto"
      style={{ zIndex: OVERLAY_Z, backgroundColor: targetRect ? "transparent" : "rgba(0,0,0,0.5)" }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby={ariaDescribedBy || undefined}
    >
      {targetRect && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          <defs>
            <mask id={maskId}>
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
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask={`url(#${maskId})`} />
        </svg>
      )}
      {!targetRect && <div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden />}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background pointer-events-none"
          style={{
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      <div
        className="absolute z-[10000] max-h-[85vh] overflow-auto pointer-events-auto"
        style={{
          width: cardPosition.width,
          maxWidth: `min(calc(100vw - 2rem), ${CARD_MAX_W}px)`,
          left: cardPosition.left,
          top: cardPosition.top,
          transform: cardPosition.transform,
        }}
      >
        <Card className="shadow-xl border-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="rounded-full bg-primary/10 p-1.5 shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <CardTitle id="tour-title" className="text-base leading-snug">
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
            {tips.length > 0 && (
              <ul id={tipsId} className="mt-3 space-y-1.5 text-sm text-muted-foreground list-none pl-0 border-t border-border/60 pt-3">
                {tips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary shrink-0 font-medium" aria-hidden>
                      •
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
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
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {currentStep + 1} / {steps.length}
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
