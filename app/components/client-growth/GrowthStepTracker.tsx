"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { GROWTH_SYSTEM_STEP_OUTCOMES } from "@/lib/growthSystemOutcomeCopy";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function stepLabel(state: string): string {
  if (state === "locked") return "Locked";
  if (state === "complete") return "Complete";
  if (state === "active") return "Active";
  if (state === "in_progress") return "In progress";
  if (state === "not_started") return "Not started";
  if (state === "optimizing") return "Optimizing";
  return state;
}

export interface GrowthStepTrackerProps {
  readonly step: ClientGrowthSnapshot["step"];
}

const STEP_PAGE: Record<1 | 2 | 3, string> = {
  1: "/growth-system/diagnose",
  2: "/growth-system/build",
  3: "/growth-system/scale",
};

export function GrowthStepTracker({ step }: GrowthStepTrackerProps) {
  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
          Your path
        </CardTitle>
        <CardDescription>Diagnose → Build → Scale</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { n: 1 as const, title: "Diagnose", state: step.diagnose },
              { n: 2 as const, title: "Build", state: step.build },
              { n: 3 as const, title: "Scale", state: step.scale },
            ] as const
          ).map(({ n, title, state }) => (
            <li
              key={n}
              className={`rounded-lg border p-3 sm:p-4 transition-colors ${
                step.current === n ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm" : "border-border/80 bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <Link
                  href={STEP_PAGE[n]}
                  className="text-sm font-semibold hover:underline underline-offset-2 text-foreground"
                >
                  {n}. {title}
                </Link>
                <Badge variant={step.current === n ? "default" : "secondary"} className="text-xs shrink-0">
                  {stepLabel(state)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-snug mt-1.5">{GROWTH_SYSTEM_STEP_OUTCOMES[n]}</p>
              {step.current === n ? <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-2">You are here</p> : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
