"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { spotlight } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional inner className for the glow layer container */
  innerClassName?: string;
}

export function SpotlightCard({
  children,
  className,
  innerClassName,
}: Readonly<SpotlightCardProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const reduced = useReducedMotion();

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPosition({ x, y });
    },
    [reduced]
  );

  if (reduced) {
    return (
      <div className={cn("relative rounded-xl border border-border bg-card", className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        y: isHovered ? spotlight.liftY : 0,
        transition: { duration: spotlight.hoverDuration, ease: [0.25, 0.1, 0.25, 1] },
      }}
      className={cn(
        "relative rounded-xl border border-border bg-card overflow-hidden",
        "transition-shadow duration-200",
        isHovered && "shadow-lg shadow-foreground/5 border-primary/20",
        className
      )}
    >
      {/* Radial spotlight that follows cursor */}
      <div
        className={cn("pointer-events-none absolute inset-0 z-0", innerClassName)}
        aria-hidden
      >
        <motion.div
          className="absolute w-[140%] h-[140%] rounded-full opacity-[0.07] dark:opacity-[0.08]"
          style={{
            background: "radial-gradient(circle at center, hsl(var(--primary)) 0%, transparent 60%)",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ left: "50%", top: "50%" }}
          animate={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transition: { duration: spotlight.followDuration, ease: [0.25, 0.1, 0.25, 1] },
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
