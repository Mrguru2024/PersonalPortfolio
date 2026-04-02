"use client";

import { useEffect } from "react";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { GrowthActivityFeed } from "@/components/client-growth/GrowthActivityFeed";
import { GrowthBuildSection } from "@/components/client-growth/GrowthBuildSection";
import { GrowthDiagnoseSection } from "@/components/client-growth/GrowthDiagnoseSection";
import { GrowthGuaranteeStatusCard } from "@/components/client-growth/GrowthGuaranteeStatusCard";
import { GrowthScaleSection } from "@/components/client-growth/GrowthScaleSection";
import { GrowthStatusHero } from "@/components/client-growth/GrowthStatusHero";
import { GrowthSystemOutcomeCallout } from "@/components/client-growth/GrowthSystemOutcomeCallout";
import { GrowthStepTracker } from "@/components/client-growth/GrowthStepTracker";

export type GrowthFocusSection = "diagnose" | "build" | "scale";

export interface GrowthSnapshotViewProps {
  readonly snapshot: ClientGrowthSnapshot;
  readonly focusSection?: GrowthFocusSection;
}

export function GrowthSnapshotView({ snapshot, focusSection }: GrowthSnapshotViewProps) {
  useEffect(() => {
    if (!focusSection || typeof document === "undefined") return;
    const id = focusSection;
    const t = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(t);
  }, [focusSection, snapshot.businessLabel]);

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      <GrowthStatusHero snapshot={snapshot} />
      <GrowthSystemOutcomeCallout />
      <GrowthStepTracker step={snapshot.step} />
      {snapshot.guarantee ? <GrowthGuaranteeStatusCard /> : null}
      <GrowthDiagnoseSection diagnose={snapshot.diagnose} />
      <GrowthBuildSection build={snapshot.build} />
      <GrowthScaleSection scale={snapshot.scale} />
      <GrowthActivityFeed activity={snapshot.activity} />
    </div>
  );
}
