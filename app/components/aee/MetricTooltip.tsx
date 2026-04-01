"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface MetricTooltipProps {
  label: string;
  explanation: string;
  className?: string;
}

export function MetricTooltip({ label, explanation, className }: MetricTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={`inline-flex items-center gap-1 cursor-help text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm ${className ?? ""}`}
        >
          {label}
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm leading-snug">
        {explanation}
      </TooltipContent>
    </Tooltip>
  );
}
