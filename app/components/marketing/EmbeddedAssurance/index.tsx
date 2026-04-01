import { cn } from "@/lib/utils";

export type CTAReassuranceLineProps = {
  children: string;
  className?: string;
  /** Use when the line sits directly under buttons in a dark-on-light card */
  dense?: boolean;
};

/** Single line of calm reassurance—keep visually quiet. */
export function CTAReassuranceLine({ children, className, dense }: CTAReassuranceLineProps) {
  return (
    <p
      className={cn(
        "text-center text-muted-foreground leading-relaxed",
        dense ? "text-[11px] sm:text-xs mt-4" : "text-xs sm:text-sm mt-6 max-w-xl mx-auto",
        className,
      )}
    >
      {children}
    </p>
  );
}

export type WhatToExpectListProps = {
  title: string;
  items: readonly string[];
  className?: string;
  /** Slightly smaller for booking sidebar */
  compact?: boolean;
};

/** Compact expectation list—booking and high-intent pages. */
export function WhatToExpectList({ title, items, className, compact }: WhatToExpectListProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 dark:bg-muted/10 px-4 py-4 sm:px-5 sm:py-4",
        className,
      )}
    >
      <p className={cn("font-medium text-foreground", compact ? "text-xs sm:text-sm" : "text-sm")}>{title}</p>
      <ul className={cn("mt-2 space-y-1.5 text-muted-foreground", compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm")}>
        {items.map((line) => (
          <li key={line} className="flex gap-2 leading-relaxed">
            <span className="text-primary shrink-0" aria-hidden>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
