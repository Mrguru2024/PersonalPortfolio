"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface MarketBreakdownProps {
  className?: string;
}

/** City/region slices use `region:*` / `city:*` dimension keys + visitor_activity geo. */
export function MarketBreakdown({ className }: MarketBreakdownProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Market performance</CardTitle>
        <CardDescription>
          Regional rollups populate from geo on tracked events and explicit <code className="text-xs bg-muted px-1 rounded">market_region</code> metadata.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">No dimensional rows yet.</CardContent>
    </Card>
  );
}
