"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Variant = "orbs" | "dots" | "gradient" | "full";

interface SectionAmbientProps {
  /** orbs = soft blurred circles; dots = subtle dot grid; gradient = corner gradient; full = orbs + dots */
  variant?: Variant;
  className?: string;
}

/**
 * Subtle background ambient for sections – soft orbs, dot pattern, or gradient.
 * Keeps focus on content while adding depth. Respects reduced motion.
 */
export default function SectionAmbient({ variant = "full", className = "" }: SectionAmbientProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return null;
  }

  const showOrbs = variant === "orbs" || variant === "full";
  const showDots = variant === "dots" || variant === "full";
  const showGradient = variant === "gradient" || variant === "full";

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden -z-0 ${className}`}
      aria-hidden
    >
      {showOrbs && (
        <>
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/8 dark:bg-primary/12 blur-3xl"
            style={{ animation: "ambient-float 20s ease-in-out infinite" }}
          />
          <div
            className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-secondary/10 dark:bg-secondary/15 blur-3xl"
            style={{ animation: "ambient-float 18s ease-in-out infinite reverse" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-primary/6 dark:bg-primary/10 blur-3xl"
            style={{ animation: "ambient-float 22s ease-in-out infinite 2s" }}
          />
        </>
      )}
      {showDots && (
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.06) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      )}
      {showGradient && variant === "gradient" && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.04),transparent_70%)]" />
      )}
    </div>
  );
}
