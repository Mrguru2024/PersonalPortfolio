"use client";

import * as React from "react";
import { Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SimpleTooltipProps {
  term: string;
  definition: string;
  children?: React.ReactNode;
  icon?: "info" | "help";
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function SimpleTooltip({
  term,
  definition,
  children,
  icon = "info",
  className,
  side = "top",
}: SimpleTooltipProps) {
  const IconComponent = icon === "info" ? Info : HelpCircle;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children || (
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className,
            )}
            aria-label={`Learn more about ${term}`}
          >
            <IconComponent className="h-4 w-4" aria-hidden />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn(
          "z-50 max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        )}
      >
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{term}</p>
          <p className="text-muted-foreground">{definition}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface InlineTooltipProps {
  term: string;
  definition: string;
  className?: string;
}

export function InlineTooltip({ term, definition, className }: InlineTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "cursor-help border-b border-dashed border-primary/50 text-primary outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
            className,
          )}
        >
          {term}
        </span>
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          "z-[100] max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        )}
      >
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{term}</p>
          <p className="text-muted-foreground">{definition}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
