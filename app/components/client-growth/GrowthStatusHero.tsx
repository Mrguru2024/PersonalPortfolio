"use client";

import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";

export interface GrowthStatusHeroProps {
  readonly snapshot: ClientGrowthSnapshot;
}

export function GrowthStatusHero({ snapshot }: GrowthStatusHeroProps) {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{snapshot.growthStatusLine}</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{snapshot.businessLabel}</h1>
      <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">{snapshot.diagnose.statusSummary}</p>
    </header>
  );
}
