"use client";

import { format } from "date-fns";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { Card, CardContent } from "@/components/ui/card";

export interface GrowthActivityFeedProps {
  readonly activity: ClientGrowthSnapshot["activity"];
}

export function GrowthActivityFeed({ activity }: GrowthActivityFeedProps) {
  if (activity.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recent activity</h2>
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {activity.map((row, i) => (
              <li
                key={`${row.at}-${row.kind}-${i}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{row.kind.replace(/_/g, " ")}</p>
                </div>
                <time className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {format(new Date(row.at), "MMM d, yyyy · p")}
                </time>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
