"use client";

import {
  GROWTH_SYSTEM_EXPECTED_OUTCOME_BULLETS,
  GROWTH_SYSTEM_RESULTS_DISCLAIMER,
} from "@/lib/growthSystemOutcomeCopy";

export function GrowthSystemOutcomeCallout() {
  return (
    <aside
      className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 sm:px-5 sm:py-4 space-y-2"
      aria-label="Expected outcomes"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What we aim for</p>
      <ul className="text-sm text-foreground list-disc pl-4 space-y-1">
        {GROWTH_SYSTEM_EXPECTED_OUTCOME_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground leading-relaxed">{GROWTH_SYSTEM_RESULTS_DISCLAIMER}</p>
    </aside>
  );
}
