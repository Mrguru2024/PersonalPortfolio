"use client";

import { useRef, useState, useCallback } from "react";
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
  const reduced = useReducedMotion();

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced) return;
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
    [reduced]
  );

  const handleLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: offset.x, y: offset.y }}
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
        <motion.span
          whileHover={{ y: -2 }}
          whileTap={{ y: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block"
        >
          {children}
        </motion.span>
      )}
    </motion.div>
  );
}
