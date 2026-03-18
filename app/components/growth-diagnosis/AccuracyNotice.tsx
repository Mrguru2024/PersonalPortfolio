"use client";

import { Info } from "lucide-react";
import { ACCURACY_NOTICE_VARIANTS } from "@/lib/growth-diagnosis/constants";
import { cn } from "@/lib/utils";

interface AccuracyNoticeProps {
  variantIndex?: number;
  className?: string;
}

export function AccuracyNotice({ variantIndex = 0, className }: AccuracyNoticeProps) {
  const copy = ACCURACY_NOTICE_VARIANTS[variantIndex] ?? ACCURACY_NOTICE_VARIANTS[0];
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/30 p-4 flex gap-3",
        className
      )}
      role="status"
    >
      <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">{copy}</p>
    </div>
  );
}
