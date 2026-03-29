"use client";

import type { ReactNode } from "react";

export interface GuidedTourAnchorProps {
  tourId: string;
  children: ReactNode;
  className?: string;
}

/** Marks a region for `data-tour` — pair with admin tour config or page-local coach marks. */
export function GuidedTourAnchor({ tourId, children, className }: GuidedTourAnchorProps) {
  return (
    <div data-tour={tourId} className={className}>
      {children}
    </div>
  );
}
