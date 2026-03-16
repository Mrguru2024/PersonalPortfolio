"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface StickyStoryStep {
  id: string;
  title: string;
  problem: string;
  solution: string;
}

interface StickyStorySectionProps {
  /** Headline at top */
  headline: string;
  /** Subline under headline */
  subline?: string;
  steps: readonly StickyStoryStep[];
  className?: string;
}

export function StickyStorySection({
  headline,
  subline,
  steps,
  className,
}: Readonly<StickyStorySectionProps>) {
  const reduced = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.reveal.duration,
        ease: motionTokens.reveal.ease,
        delay: i * (motionTokens.staggerStep / 1000),
      },
    }),
  };

  return (
    <section className={cn("container mx-auto px-3 fold:px-4 sm:px-6 py-10 sm:py-14", className)}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center mb-2">
          {headline}
        </h2>
        {subline && (
          <p className="text-muted-foreground text-center mb-8 sm:mb-10 max-w-xl mx-auto">
            {subline}
          </p>
        )}

        <div className="space-y-4 sm:space-y-6">
          {steps.map((step, i) =>
            reduced ? (
              <div
                key={step.id}
                className="rounded-xl border border-border bg-card p-5 sm:p-6"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step {i + 1} of {steps.length}
                </span>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {step.problem}
                </p>
                <p className="text-sm font-medium text-foreground mt-3 leading-relaxed">
                  {step.solution}
                </p>
              </div>
            ) : (
              <motion.div
                key={step.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-8% 0px" }}
                custom={i}
                className="rounded-xl border border-border bg-card p-5 sm:p-6"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step {i + 1} of {steps.length}
                </span>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {step.problem}
                </p>
                <p className="text-sm font-medium text-foreground mt-3 leading-relaxed">
                  {step.solution}
                </p>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
