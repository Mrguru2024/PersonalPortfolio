"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface PersonaBreakdownProps {
  experimentName?: string;
  className?: string;
}

/** Persona slices roll up from `aee_experiment_metrics_daily.dimensionKey` values like `persona:…`. */
export function PersonaBreakdown({ experimentName, className }: PersonaBreakdownProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Persona performance</CardTitle>
        <CardDescription>
          {experimentName ? `Experiment: ${experimentName}. ` : ""}
          When daily metrics include <code className="text-xs bg-muted px-1 rounded">persona:*</code> dimension keys, conversion and revenue by persona appear here.
          Journey events already emit persona signals — wire the rollup job to complete this view.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">No dimensional rows yet.</CardContent>
    </Card>
  );
}
