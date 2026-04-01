"use client";

import Link from "next/link";
import { ArrowRight, LineChart } from "lucide-react";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface GrowthDiagnoseSectionProps {
  readonly diagnose: ClientGrowthSnapshot["diagnose"];
}

export function GrowthDiagnoseSection({ diagnose }: GrowthDiagnoseSectionProps) {
  const health = diagnose.healthScore0to100;

  return (
    <section id="diagnose" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2">
        <LineChart className="h-5 w-5 text-teal-600 shrink-0" aria-hidden />
        <h2 className="text-lg sm:text-xl font-semibold">Diagnose</h2>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {health != null ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Business health (blended)</span>
                <span className="font-medium">{health}/100</span>
              </div>
              <Progress value={health} className="h-2" />
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium text-destructive/90 dark:text-destructive">Primary focus</p>
            <p className="text-sm text-muted-foreground mt-1">{diagnose.primaryIssue}</p>
          </div>
          <p className="text-sm text-muted-foreground border-l-2 border-amber-500/50 pl-3">{diagnose.missedOpportunityHint}</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(
              [
                ["Market", diagnose.market],
                ["Website & funnel", diagnose.website],
                ["Offer", diagnose.offer],
              ] as const
            ).map(([label, band]) => (
              <div key={label} className="rounded-lg border bg-card/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold mt-1">{band.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{band.summary}</p>
              </div>
            ))}
          </div>
          {diagnose.amie ? (
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/[0.06] dark:bg-teal-950/30 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                Market intelligence
              </p>
              <p className="text-sm font-medium text-foreground">{diagnose.amie.opportunityHeadline}</p>
              <p className="text-sm text-muted-foreground leading-snug">{diagnose.amie.summaryLine}</p>
              {diagnose.amie.demandVsCompetitionHint ? (
                <p className="text-xs text-muted-foreground leading-snug">{diagnose.amie.demandVsCompetitionHint}</p>
              ) : null}
              {diagnose.amie.insightBullets.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                  {diagnose.amie.insightBullets.map((b, i) => (
                    <li key={`${i}-${b.slice(0, 24)}`}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <Button asChild className="w-full sm:w-auto">
            <Link href={diagnose.nextCta.href}>
              {diagnose.nextCta.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
