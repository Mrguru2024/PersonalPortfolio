"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = TooltipPrimitive.Content;

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
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-full text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                className
              )}
              aria-label={`Learn more about ${term}`}
            >
              <IconComponent className="h-4 w-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            "z-50 max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <div className="space-y-1">
            <p className="font-semibold">{term}</p>
            <p className="text-gray-300">{definition}</p>
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

// Inline tooltip that shows term with explanation on hover
interface InlineTooltipProps {
  term: string;
  definition: string;
  className?: string;
}

export function InlineTooltip({ term, definition, className }: InlineTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "cursor-help border-b border-dashed border-primary/50 text-primary hover:border-primary",
              className
            )}
          >
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className={cn(
            "z-50 max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-md",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <div className="space-y-1">
            <p className="font-semibold">{term}</p>
            <p className="text-gray-300">{definition}</p>
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
