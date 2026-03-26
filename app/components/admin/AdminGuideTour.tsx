"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTourStep } from "@/lib/adminTourConfig";

const OVERLAY_Z = 9999;
const PADDING = 8;

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
    updateTarget();
    const resize = () => updateTarget();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [updateTarget]);

  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const overlay = (
    <div
      className="fixed inset-0 backdrop-blur-[2px]"
      style={{ zIndex: OVERLAY_Z, backgroundColor: targetRect ? "transparent" : "rgba(0,0,0,0.5)" }}
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

      {/* Card: position near target or center */}
      <div
        className="absolute z-[10000] w-[min(calc(100vw-2rem),400px)] max-h-[85vh] overflow-auto"
        style={
          targetRect
            ? {
                left: targetRect.left + targetRect.width + 16 <= window.innerWidth - 320
                  ? targetRect.left + targetRect.width + 16
                  : targetRect.left - 320 - 16,
                top: Math.max(16, Math.min(targetRect.top, window.innerHeight - 320)),
              }
            : {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
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
