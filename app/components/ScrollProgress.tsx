"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Thin progress bar at the top that fills as the user scrolls.
 * Hidden when prefers-reduced-motion to avoid unnecessary motion.
 */
export default function ScrollProgress() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.01], [0, 1]);

  if (reducedMotion) return null;

  return (
    <motion.div
      className="fixed left-0 top-0 z-[100] h-0.5 origin-left bg-primary/80 dark:bg-primary/60"
      style={{
        width: "100%",
        scaleX,
        opacity,
      }}
      aria-hidden
    />
  );
}
