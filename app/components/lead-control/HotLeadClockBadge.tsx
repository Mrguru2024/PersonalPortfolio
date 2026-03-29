"use client";

import { Clock, Flame, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadHotnessInput } from "@/lib/leadHotness";
import { describeLeadAge, getHotLeadUrgency, hotLeadNeedsContactCopy } from "@/lib/leadHotness";

export function HotLeadClockBadge({
  contact,
  className,
}: {
  contact: LeadHotnessInput;
  className?: string;
}) {
  const { label } = describeLeadAge(contact.createdAt);
  const urgency = getHotLeadUrgency(contact);
  const hint = hotLeadNeedsContactCopy(urgency);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        urgency === "immediate" &&
          "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm shadow-amber-500/10",
        urgency === "soon" && "border-orange-500/35 bg-orange-500/5",
        urgency === "normal" && "border-border bg-muted/30",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" aria-hidden />
        <span className="tabular-nums font-medium text-foreground">Submitted {label}</span>
      </span>
      {urgency !== "normal" ? (
        <Badge variant="outline" className="gap-1 border-amber-600/40 text-amber-900 dark:text-amber-100">
          {urgency === "immediate" ? (
            <Zap className="h-3 w-3" aria-hidden />
          ) : (
            <Flame className="h-3 w-3" aria-hidden />
          )}
          {urgency === "immediate" ? "Hot now" : "Follow up"}
        </Badge>
      ) : null}
      {hint ? <span className="text-xs text-amber-900/90 dark:text-amber-100/90 w-full sm:w-auto">{hint}</span> : null}
    </div>
  );
}
