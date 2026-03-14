"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleAnimation from "@/components/ParticleAnimation";
import { AUDIT_PATH, SEE_GROWTH_SYSTEMS } from "@/lib/funnelCtas";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function HeroSection() {
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="home"
      className="relative w-full min-w-0 max-w-full min-h-[420px] sm:min-h-[480px] md:min-h-[520px] flex items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Particle background */}
      <div className="absolute inset-0 w-full h-full">
        <ParticleAnimation
          count={56}
          minSize={1.6}
          maxSize={4}
          linkParticles={true}
          linkDistance={140}
          linkThickness={0.85}
          glowRadius={4.5}
          className="absolute inset-0 w-full h-full opacity-90 dark:opacity-100"
          colorArray={[
            "hsl(var(--primary))",
            "hsl(var(--primary) / 0.9)",
            "hsl(var(--muted-foreground) / 0.75)",
          ]}
          colorArrayDark={[
            "hsl(174 55% 65%)",
            "hsl(174 50% 75%)",
            "hsl(174 45% 55%)",
            "hsl(174 60% 70%)",
          ]}
        />
      </div>

      {/* Gradient overlay so text stays readable */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background/80 dark:from-background/28 dark:via-background/12 dark:to-background/62 pointer-events-none"
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-3 fold:px-4 sm:px-6 py-12 sm:py-16 md:py-20 min-w-0 max-w-4xl text-center">
        <motion.div
          ref={contentRef}
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={reducedMotion ? undefined : { boxShadow: "0 20px 50px -15px hsl(var(--foreground) / 0.08)" }}
          className="relative rounded-2xl border border-border/50 bg-card/80 dark:bg-card/70 backdrop-blur-sm p-6 sm:p-8 md:p-10 mx-auto max-w-3xl"
        >
          <p className="text-sm font-medium text-primary">Ascendra Technologies</p>
          <h1 className="mt-2 text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            A stronger brand, better presentation, and a website that actually helps your business grow.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Ascendra Technologies works with design and branding partners to help businesses improve how they show up online and turn more visitors into real opportunities.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <motion.span
              whileHover={reducedMotion ? undefined : { y: -2 }}
              whileTap={reducedMotion ? undefined : { y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg">
                <Link href={AUDIT_PATH}>
                  Request a Digital Growth Audit
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            </motion.span>
            <motion.span
              whileHover={reducedMotion ? undefined : { y: -2 }}
              whileTap={reducedMotion ? undefined : { y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button asChild variant="outline" size="lg" className="min-h-[48px] w-full sm:w-auto border-border hover:bg-accent">
                <Link href="/services">{SEE_GROWTH_SYSTEMS}</Link>
              </Button>
            </motion.span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
