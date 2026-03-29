"use client";

import Link from "next/link";
import { FlaskConical, LineChart, Shapes } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuidedTourAnchor } from "./GuidedTourAnchor";
import { MetricTooltip } from "./MetricTooltip";

export interface ExperimentDashboardProps {
  experimentCount: number;
}

export function ExperimentDashboard({ experimentCount }: ExperimentDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GuidedTourAnchor tourId="aee-summary">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <MetricTooltip
                label="Active tests"
                explanation="Experiments stored in growth_experiments with variants. Status must be running for public assignment via storage.getOrAssignVariant."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{experimentCount}</p>
            <CardDescription className="mt-1">Total experiments in workspace</CardDescription>
          </CardContent>
        </Card>
      </GuidedTourAnchor>

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
          Wire channel links on each experiment to PPC and comms campaigns. Import or sync paid stats into existing PPC tables
          where possible.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shapes className="h-4 w-4" />
            Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Link href="/admin/experiments/patterns" className="text-primary hover:underline">
            Content DNA
          </Link>{" "}
          surfaces winning structures once editorial + experiment rollups connect.
        </CardContent>
      </Card>
    </div>
  );
}
