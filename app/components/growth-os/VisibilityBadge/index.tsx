"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DataVisibilityTier } from "@shared/accessScope";

export interface VisibilityBadgeProps {
  tier: DataVisibilityTier | string;
  className?: string;
}

const STYLES: Record<string, string> = {
  internal_only:
    "bg-amber-950/40 text-amber-100 border-amber-700/50 dark:bg-amber-950/60 dark:text-amber-50",
  client_visible:
    "bg-blue-950/40 text-blue-100 border-blue-700/50 dark:bg-blue-950/50 dark:text-blue-50",
  public_visible:
    "bg-emerald-950/40 text-emerald-100 border-emerald-700/50 dark:bg-emerald-950/50 dark:text-emerald-50",
};

const LABELS: Record<string, string> = {
  internal_only: "Internal only",
  client_visible: "Client visible",
  public_visible: "Public visible",
};

export function VisibilityBadge({ tier, className }: VisibilityBadgeProps) {
  const key = String(tier);
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium shrink-0",
        STYLES[key] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
      title="Data visibility classification"
    >
      {LABELS[key] ?? key}
    </Badge>
  );
}
