"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  /** Prefix e.g. "$" or "" */
  prefix?: string;
  /** Suffix e.g. "%" or "k" */
  suffix?: string;
  /** Format number (e.g. locale string); if not provided, raw number is shown */
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedCounter({
  end,
  start = 0,
  duration = 1500,
  prefix = "",
  suffix = "",
  format,
  className,
}: Readonly<AnimatedCounterProps>) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();
  const value = useCountUp({
    end,
    start,
    duration: duration ?? 1500,
    inView: inView && !reduced,
    ease: "easeOut",
  });

  const display = reduced ? end : value;
  const text = format ? format(display) : `${prefix}${display}${suffix}`;

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {text}
    </span>
  );
}
