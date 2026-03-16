"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BeforeAfterToggleProps {
  /** Label for "before" / problem state */
  beforeLabel?: string;
  /** Label for "after" / solution state */
  afterLabel?: string;
  /** Content when showing problem state */
  beforeContent: React.ReactNode;
  /** Content when showing solution state */
  afterContent: React.ReactNode;
  className?: string;
}

export function BeforeAfterToggle({
  beforeLabel = "The problem",
  afterLabel = "The solution",
  beforeContent,
  afterContent,
  className,
}: Readonly<BeforeAfterToggleProps>) {
  const [isAfter, setIsAfter] = useState(false);
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{beforeLabel}</h3>
          {beforeContent}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-primary mb-3">{afterLabel}</h3>
          {afterContent}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex rounded-lg p-1 bg-muted/50 border border-border w-fit">
        <button
          type="button"
          onClick={() => setIsAfter(false)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isAfter ? "text-muted-foreground hover:text-foreground" : "bg-background text-foreground shadow-sm"
          )}
          aria-pressed={isAfter ? "false" : "true"}
        >
          {beforeLabel}
        </button>
        <button
          type="button"
          onClick={() => setIsAfter(true)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isAfter ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={isAfter ? "true" : "false"}
        >
          {afterLabel}
        </button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[260px]">
        <AnimatePresence mode="wait">
          {isAfter ? (
            <motion.div
              key="after"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{
                duration: motionTokens.reveal.duration,
                ease: motionTokens.reveal.ease,
              }}
              className="p-5 sm:p-6"
            >
              <h3 className="text-sm font-semibold text-primary mb-3">{afterLabel}</h3>
              <div className="leading-relaxed space-y-3">
                {afterContent}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="before"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{
                duration: motionTokens.reveal.duration,
                ease: motionTokens.reveal.ease,
              }}
              className="p-5 sm:p-6"
            >
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{beforeLabel}</h3>
              <div className="leading-relaxed">
                {beforeContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
