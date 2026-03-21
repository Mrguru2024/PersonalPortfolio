"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, heroChoreography } from "@/lib/motion";

/** Single class string for CTA row — must match in reduced-motion and animated branches (hydration). */
const HERO_ACTIONS_ROW_CLASS =
  "mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap justify-center items-stretch sm:items-center gap-3 w-full min-w-0";

interface HeroMotionProps {
  /** Brand/eyebrow line */
  eyebrow?: React.ReactNode;
  /** Main headline */
  headline: React.ReactNode;
  /** Supporting text */
  subline?: React.ReactNode;
  /** Primary and secondary CTAs */
  actions?: React.ReactNode;
  /** Optional card/content wrapper around the block */
  children?: React.ReactNode;
  className?: string;
}

export function HeroMotion({
  eyebrow,
  headline,
  subline,
  actions,
  children,
  className = "",
}: Readonly<HeroMotionProps>) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className}>
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="mt-2 text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
          {headline}
        </h1>
        {subline && <div className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{subline}</div>}
        {actions && (
          <div className={HERO_ACTIONS_ROW_CLASS}>
            {actions}
          </div>
        )}
        {children}
      </div>
    );
  }

  const headlineTransition = {
    duration: heroChoreography.headline.duration,
    ease: motionTokens.hero.ease,
    delay: heroChoreography.headline.delay,
  };
  const sublineTransition = {
    duration: heroChoreography.subline.duration,
    ease: motionTokens.hero.ease,
    delay: heroChoreography.subline.delay,
  };
  const ctasTransition = {
    duration: heroChoreography.ctas.duration,
    ease: motionTokens.hero.ease,
    delay: heroChoreography.ctas.delay,
  };

  return (
    <div className={className}>
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-2"
        >
          {eyebrow}
        </motion.div>
      )}
      <motion.h1
        initial={{ opacity: 0, y: heroChoreography.headline.y, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={headlineTransition}
        className="mt-2 text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
      >
        {headline}
      </motion.h1>
      {subline && (
        <motion.div
          initial={{ opacity: 0, y: heroChoreography.subline.y }}
          animate={{ opacity: 1, y: 0 }}
          transition={sublineTransition}
          className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {subline}
        </motion.div>
      )}
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: heroChoreography.ctas.y }}
          animate={{ opacity: 1, y: 0 }}
          transition={ctasTransition}
          className={HERO_ACTIONS_ROW_CLASS}
        >
          {actions}
        </motion.div>
      )}
      {children}
    </div>
  );
}
