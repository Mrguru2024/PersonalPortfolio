"use client";

import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

const SKIP_MS = 100;
const DELAY_FINE_POINTER_MS = 400;
const DELAY_COARSE_OR_NO_HOVER_MS = 650;
const DELAY_REDUCED_MOTION_MS = 500;

/**
 * Single Radix tooltip scope for the app. Uses a slightly longer open delay than the
 * old default (200ms) so incidental hovers feel less noisy. Touch / coarse-pointer devices
 * get a longer delay to reduce accidental popovers while scrolling.
 *
 * Tooltips remain **supplemental** — never the only place critical instructions appear.
 */
export function GlobalTooltipProvider({ children }: { children: React.ReactNode }) {
  const [delayDuration, setDelayDuration] = useState(DELAY_FINE_POINTER_MS);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");

    const apply = () => {
      if (reduced.matches) {
        setDelayDuration(DELAY_REDUCED_MOTION_MS);
        return;
      }
      setDelayDuration(fineHover.matches ? DELAY_FINE_POINTER_MS : DELAY_COARSE_OR_NO_HOVER_MS);
    };

    apply();
    reduced.addEventListener("change", apply);
    fineHover.addEventListener("change", apply);
    return () => {
      reduced.removeEventListener("change", apply);
      fineHover.removeEventListener("change", apply);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={SKIP_MS}>
      {children}
    </TooltipProvider>
  );
}
