"use client";

import { SectionReveal } from "@/components/motion/SectionReveal";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { cn } from "@/lib/utils";

export interface StatItem {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  /** Custom formatter; default is number with optional prefix/suffix */
  format?: (n: number) => string;
}

interface StatsStripProps {
  items: StatItem[];
  className?: string;
}

export function StatsStrip({ items, className }: Readonly<StatsStripProps>) {
  return (
    <SectionReveal className={cn("flex flex-wrap justify-center gap-x-8 gap-y-4 py-6", className)}>
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
            {item.format ? (
              <AnimatedCounter
                end={item.value}
                format={item.format}
              />
            ) : (
              <AnimatedCounter
                end={item.value}
                prefix={item.prefix ?? ""}
                suffix={item.suffix ?? ""}
              />
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
        </div>
      ))}
    </SectionReveal>
  );
}
