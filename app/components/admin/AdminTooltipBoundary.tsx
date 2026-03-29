"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Ensures Radix tooltips work site-wide under `/admin` without each page adding its own provider. */
export function AdminTooltipBoundary({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={150}>
      {children}
    </TooltipProvider>
  );
}
