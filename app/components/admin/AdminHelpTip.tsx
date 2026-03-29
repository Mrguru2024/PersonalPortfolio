"use client";

import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AdminHelpTipProps {
  /** Tooltip body; use \\n for short line breaks. */
  content: string;
  /** Accessible name for the trigger control. */
  ariaLabel?: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/**
 * In-page help for admins — hover or focus the ? icon to learn what this section, field, or button **does**
 * and how to use it **on the current screen**. Prefer concrete behavior (“what happens when you save”) over
 * telling people where to click in the top navigation.
 *
 * The `/admin` layout provides `TooltipProvider`; pages may wrap again for a different delay.
 */
export function AdminHelpTip({
  content,
  ariaLabel = "Help for this control",
  className,
  side = "top",
  delayDuration = 200,
}: AdminHelpTipProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          aria-label={ariaLabel}
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-sm text-left text-xs leading-snug whitespace-pre-line z-[200]"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/** Label + optional `htmlFor` with a trailing help icon. */
export function AdminTipLabel({
  htmlFor,
  children,
  tip,
  tipAriaLabel,
}: {
  htmlFor?: string;
  children: ReactNode;
  tip: string;
  tipAriaLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="mb-0">
        {children}
      </Label>
      <AdminHelpTip content={tip} ariaLabel={tipAriaLabel ?? "Field help"} />
    </div>
  );
}
