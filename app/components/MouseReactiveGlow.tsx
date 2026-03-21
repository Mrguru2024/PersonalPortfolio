"use client";

import { useEffect, useState } from "react";

/**
 * A large, slow-following radial glow in the hero that responds to cursor.
 * Theme-aware, subtle, and disabled when prefers-reduced-motion or no pointer (touch).
 */
export default function MouseReactiveGlow() {
  const [position, setPosition] = useState({ x: 50, y: 30 });
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!mounted || prefersReducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      setHasHover(true);
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setPosition((prev) => ({
        x: prev.x + (x - prev.x) * 0.035,
        y: prev.y + (y - prev.y) * 0.035,
      }));
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mounted, prefersReducedMotion]);

  if (!mounted) return null;

  const visible = hasHover && !prefersReducedMotion;
  const opacity = visible ? 0.4 : 0.18;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 transition-opacity ease-out"
      aria-hidden
      style={{
        background: `radial-gradient(ellipse 120% 80% at ${position.x}% ${position.y}%, hsl(var(--primary) / 0.04) 0%, hsl(var(--primary) / 0.02) 35%, transparent 70%)`,
        opacity,
        transitionDuration: "1.5s",
      }}
    />
  );
}
