"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface FunnelBreakdownProps {
  funnelStage?: string | null;
  className?: string;
}

export function FunnelBreakdown({ funnelStage, className }: FunnelBreakdownProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Funnel stage</CardTitle>
        <CardDescription>
          Experiment primary stage:{" "}
          <strong>{funnelStage ?? "—"}</strong>. Stage-level comparisons use metrics keyed{" "}
          <code className="text-xs bg-muted px-1 rounded">funnel:*</code> once nurture stages are attributed.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Cross-stage view requires dimensional daily metrics.</CardContent>
    </Card>
  );
}
