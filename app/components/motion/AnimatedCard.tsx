"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, cardDock } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  /** When true, parent (e.g. SectionRevealItem) handles entrance; this card only does hover */
  skipReveal?: boolean;
  /** Index for stagger delay when using own viewport reveal */
  staggerIndex?: number;
}

export function AnimatedCard({
  children,
  className,
  skipReveal = false,
  staggerIndex = 0,
}: AnimatedCardProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={cn("rounded-xl border border-border bg-card", className)}>{children}</div>;
  }

  const hoverTransition = {
    duration: motionTokens.hover.duration,
    ease: motionTokens.hover.ease,
  };

  if (skipReveal) {
    return (
      <motion.div
        whileHover={{ y: -2, transition: hoverTransition }}
        className={cn(
          "rounded-xl border border-border bg-card",
          "transition-[box-shadow,border-color] duration-200",
          "hover:shadow-md hover:shadow-foreground/5 hover:border-primary/15",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: cardDock.y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: cardDock.duration,
        ease: cardDock.ease,
        delay: staggerIndex * (motionTokens.staggerStep / 1000),
      }}
      whileHover={{ y: -2, transition: hoverTransition }}
      className={cn(
        "rounded-xl border border-border bg-card",
        "transition-[box-shadow,border-color] duration-200",
        "hover:shadow-md hover:shadow-foreground/5 hover:border-primary/15",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
