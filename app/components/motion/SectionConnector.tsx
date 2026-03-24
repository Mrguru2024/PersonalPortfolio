"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface SectionConnectorProps {
  /** Optional className for the wrapper */
  className?: string;
  /** Variant: thin line, or gradient trail */
  variant?: "line" | "gradient";
}

export function SectionConnector({
  className,
  variant = "line",
}: Readonly<SectionConnectorProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  if (reduced) {
    return (
      <div className={cn("flex justify-center py-8 sm:py-10 md:py-12", className)} aria-hidden>
        <div className="h-px w-16 bg-border rounded-full" />
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        ref={ref}
        className={cn("flex justify-center py-8 sm:py-10 md:py-12 overflow-hidden", className)}
        aria-hidden
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: inView ? 1 : 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-px w-24 origin-center bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("flex justify-center py-8 sm:py-10 md:py-12", className)}
      aria-hidden
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-px w-16 bg-border rounded-full origin-center"
      />
    </div>
  );
}
