"use client";

import Link from "next/link";
import { Activity, FlaskConical, LineChart, Pause, Shapes } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuidedTourAnchor } from "./GuidedTourAnchor";
import { MetricTooltip } from "./MetricTooltip";

export interface ExperimentDashboardProps {
  experimentCount: number;
  statusBreakdown?: {
    running: number;
    draft: number;
    paused: number;
    ended: number;
  };
}

export function ExperimentDashboard({ experimentCount, statusBreakdown }: ExperimentDashboardProps) {
  const br = statusBreakdown ?? { running: 0, draft: 0, paused: 0, ended: 0 };
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GuidedTourAnchor tourId="aee-summary">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <MetricTooltip
                label="All experiments"
                explanation="All rows in growth_experiments for this workspace (ascendra_main by default). Total includes every status."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{experimentCount}</p>
            <CardDescription className="mt-1">Total in workspace</CardDescription>
          </CardContent>
        </Card>
      </GuidedTourAnchor>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <MetricTooltip
              label="Running"
              explanation="Traffic assignment and rollups apply when status is running. Pause or end to stop new assignments."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{br.running}</p>
          <CardDescription className="mt-1">Live tests</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <MetricTooltip
              label="Draft / paused"
              explanation="Draft: design only. Paused: was live; storage may retain assignment history. Check each experiment detail for exact behavior."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{br.draft + br.paused}</p>
          <CardDescription className="mt-1">Not actively serving</CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <MetricTooltip
              label="Closed loop"
              explanation="CRM deals, ppc_performance_snapshots, ppc_lead_quality, and visitor_activity tie into AEE metrics and attribution events — same datastore, no duplicate CRM."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          Wire channel links on each experiment to PPC and comms. {br.ended > 0 ? (
            <span className="block mt-2 text-xs tabular-nums">{br.ended} ended (historical)</span>
          ) : null}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 xl:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shapes className="h-4 w-4" />
            <MetricTooltip
              label="Patterns"
              explanation="Content DNA surfaces winning structures when editorial metadata and experiment rollups are connected. Jump in to explore hypotheses for the next test."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Link href="/admin/experiments/patterns" className="text-primary font-medium hover:underline">
            Open Content DNA / patterns
          </Link>{" "}
          for ideas backed by rollup data.
        </CardContent>
      </Card>
    </div>
  );
}
