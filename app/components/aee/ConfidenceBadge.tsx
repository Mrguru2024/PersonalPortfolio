"use client";

import { Badge } from "@/components/ui/badge";

export interface ConfidenceBadgeProps {
  value0to100: number;
  className?: string;
}

export function ConfidenceBadge({ value0to100, className }: ConfidenceBadgeProps) {
  const v = Math.min(100, Math.max(0, value0to100));
  const label = v >= 75 ? "High confidence" : v >= 40 ? "Moderate" : "Low / early";
  const variant = v >= 75 ? "default" : v >= 40 ? "secondary" : "outline";
  return (
    <Badge variant={variant} className={className} title={`Model confidence approximates sample size and signal strength (${v}/100).`}>
      {label} · {v}
    </Badge>
  );
}
