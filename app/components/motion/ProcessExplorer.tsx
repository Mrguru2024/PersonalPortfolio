"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ProcessStepItem {
  id: string;
  title: string;
  description: string;
}

export interface ProcessExplorerProps {
  /** Main process steps (e.g. Diagnose, Define, Execute) */
  steps: ProcessStepItem[];
  /** Trust/support points shown in detail panel or second row */
  trustHighlights?: string[];
  /** Optional CTA for the trust block */
  trustCta?: { label: string; href: string };
  className?: string;
}

export function ProcessExplorer({
  steps,
  trustHighlights = [],
  trustCta,
  className,
}: Readonly<ProcessExplorerProps>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [mobileOpenIndex, setMobileOpenIndex] = useState<number | null>(0);
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  if (reduced) {
    return (
      <div className={cn("mx-auto max-w-5xl", className)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">How we work</h2>
            <ol className="space-y-2 text-sm sm:text-base text-muted-foreground">
              {steps.map((step, i) => (
                <li key={step.id}>
                  <span className="font-semibold text-foreground mr-2">{i + 1}.</span>
                  {step.description}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">
              Trust and transformation focus
            </h2>
            <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
              {trustHighlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
            {trustCta && (
              <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                <Link href={trustCta.href}>{trustCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeStep = activeIndex !== null ? steps[activeIndex] : null;

  return (
    <div ref={containerRef} className={cn("mx-auto max-w-5xl", className)}>
      {/* Desktop: nodes + connector + detail panel */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between gap-2 relative">
          {/* Node row */}
          <div className="flex flex-1 items-center justify-between min-w-0">
            {steps.map((step, index) => {
              return (
                <div key={step.id} className="flex flex-1 items-center justify-center min-w-0">
                  <motion.button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    className={cn(
                      "relative z-10 flex flex-col items-center rounded-xl border-2 px-4 py-3 sm:px-5 sm:py-4 min-w-0 max-w-[140px] sm:max-w-[160px]",
                      "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      activeIndex === index
                        ? "border-primary bg-primary/10 text-foreground shadow-md"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-card"
                    )}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: motionTokens.hover.duration }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Step {index + 1}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-foreground line-clamp-2 text-center">
                      {step.title}
                    </span>
                  </motion.button>
                  {index < steps.length - 1 && (
                    <div className="flex-1 flex items-center justify-center px-1 min-w-[24px]">
                      <svg
                        className="w-full max-w-[40px] h-6 text-border"
                        viewBox="0 0 40 24"
                        fill="none"
                        aria-hidden
                      >
                        <line
                          x1="0"
                          y1="12"
                          x2="40"
                          y2="12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {activeStep && (
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: motionTokens.reveal.duration,
                ease: motionTokens.reveal.ease,
              }}
              className="mt-6 rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{activeStep.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {activeStep.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Trust and transformation focus
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {trustHighlights.slice(0, 3).map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                  {trustCta && (
                    <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                      <Link href={trustCta.href}>{trustCta.label}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: accordion stack */}
      <div className="lg:hidden space-y-2">
        {steps.map((step, index) => {
          const isOpen = mobileOpenIndex === index;
          return (
            <div
              key={step.id}
              className={cn(
                "rounded-xl border-2 overflow-hidden transition-colors duration-200",
                isOpen ? "border-primary bg-primary/10" : "border-border bg-card"
              )}
            >
              <button
                type="button"
                onClick={() => setMobileOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-primary mr-2">
                  Step {index + 1}
                </span>
                <span className="font-semibold text-foreground flex-1">{step.title}</span>
                <ChevronDown
                  className={cn("h-5 w-5 text-muted-foreground shrink-0 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Trust and transformation focus
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                        {trustHighlights.map((h) => (
                          <li key={h}>• {h}</li>
                        ))}
                      </ul>
                      {trustCta && (
                        <Button asChild variant="outline" size="sm" className="min-h-[40px]">
                          <Link href={trustCta.href}>{trustCta.label}</Link>
                        </Button>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
