"use client";

import type { GrowthLineItem } from "@shared/clientGrowthSnapshot";
import { Badge } from "@/components/ui/badge";

export function lineStatusVariant(
  s: GrowthLineItem["status"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "done":
    case "active":
      return "default";
    case "in_progress":
      return "secondary";
    case "pending":
      return "outline";
    default:
      return "outline";
  }
}

export function LineItemBlock({ title, items }: Readonly<{ title: string; items: GrowthLineItem[] }>) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant={lineStatusVariant(item.status)} className="text-[10px] uppercase">
                {item.status.replace("_", " ")}
              </Badge>
            </div>
            {item.detail ? <p className="text-xs text-muted-foreground mt-1">{item.detail}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MetricCard({ label, value }: Readonly<{ label: string; value: number | null }>) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1 tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
