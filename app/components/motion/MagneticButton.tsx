"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { magnetic } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  /** Use for primary CTA only; skip for secondary */
  asChild?: boolean;
}

export function MagneticButton({
  children,
  className,
  asChild = false,
}: Readonly<MagneticButtonProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  /** Defer motion until after mount so SSR matches hydration (same pattern as SectionReveal). */
  const [motionReady, setMotionReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMotionReady(true);
  }, []);

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      if (!motionReady || reduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / rect.width;
      const dy = (e.clientY - centerY) / rect.height;
      const pullX = Math.max(-1, Math.min(1, dx)) * magnetic.maxPull;
      const pullY = Math.max(-1, Math.min(1, dy)) * magnetic.maxPull;
      setOffset({ x: pullX, y: pullY });
    },
    [reduced, motionReady]
  );

  const handleLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  /** Same outer node on server and first client paint — avoids span vs motion.div hydration mismatch. */
  const magneticOn = motionReady && !reduced;

  return (
    <motion.div
      ref={ref}
      onMouseMove={magneticOn ? handleMove : undefined}
      onMouseLeave={magneticOn ? handleLeave : undefined}
      style={{ x: magneticOn ? offset.x : 0, y: magneticOn ? offset.y : 0 }}
      transition={{
        type: "spring",
        stiffness: magnetic.stiffness,
        damping: magnetic.damping,
      }}
      className={cn("inline-block", className)}
    >
      {asChild ? (
        children
      ) : (
        <span
          className="inline-block transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]"
          style={{ transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)" }}
        >
          {children}
        </span>
      )}
    </motion.div>
  );
}
