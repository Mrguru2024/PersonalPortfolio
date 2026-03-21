"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before first element (seconds) */
  delay?: number;
}

export function SectionReveal({
  children,
  className,
  delay = 0,
}: Readonly<SectionRevealProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  /** Avoid Framer Motion on the server + first client paint so SSR HTML matches hydration (see react.dev/link/hydration-mismatch). */
  const [motionReady, setMotionReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMotionReady(true);
  }, []);

  useEffect(() => {
    if (reduced || !motionReady || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, motionReady]);

  if (reduced || !motionReady) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: motionTokens.reveal.duration,
        ease: motionTokens.reveal.ease,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SectionRevealStaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Wrapper that reveals and optionally staggers its direct children */
export function SectionRevealStagger({
  children,
  className,
  delay = 0,
}: Readonly<SectionRevealStaggerProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMotionReady(true);
  }, []);

  useEffect(() => {
    if (reduced || !motionReady || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, motionReady]);

  if (reduced || !motionReady) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: motionTokens.staggerStep / 1000,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SectionRevealItemProps {
  children: React.ReactNode;
  className?: string;
}

/** Child of SectionRevealStagger: single item dock-in */
export const SectionRevealItem = ({
  children,
  className,
}: Readonly<SectionRevealItemProps>) => {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: motionTokens.reveal.duration,
            ease: motionTokens.reveal.ease,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
