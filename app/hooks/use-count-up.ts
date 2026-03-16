"use client";

import { useEffect, useState, useRef } from "react";

interface UseCountUpOptions {
  /** End value */
  end: number;
  /** Start value (default 0) */
  start?: number;
  /** Duration in ms */
  duration?: number;
  /** Run only when in view */
  inView?: boolean;
  /** Easing: linear | easeOut */
  ease?: "linear" | "easeOut";
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function useCountUp({
  end,
  start = 0,
  duration = 1500,
  inView = true,
  ease = "easeOut",
}: UseCountUpOptions): number {
  const [value, setValue] = useState(start);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;
    startTimeRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = ease === "easeOut" ? easeOutQuad(t) : t;
      setValue(Math.round(start + (end - start) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, end, start, duration, ease]);

  return value;
}
