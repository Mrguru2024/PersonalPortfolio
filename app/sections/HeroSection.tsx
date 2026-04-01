"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleAnimation from "@/components/ParticleAnimation";
import { AUDIT_PATH, FREE_TRIAL_PATH, PRIMARY_FREE_LEAD_CTA, SEE_GROWTH_SYSTEMS } from "@/lib/funnelCtas";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { HeroMotion, MagneticButton } from "@/components/motion";
import { heroChoreography, motionTokens } from "@/lib/motion";
import {
  CTA_REASSURANCE_HOME,
  HERO_HEADLINE,
  HERO_SUBLINE,
} from "@/lib/embeddedAssuranceCopy";
import { CTAReassuranceLine } from "@/components/marketing/EmbeddedAssurance";

export default function HeroSection() {
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="home"
      className="relative w-full min-w-0 max-w-full min-h-[420px] sm:min-h-[480px] md:min-h-[520px] flex items-center justify-center overflow-x-visible overflow-y-visible"
      aria-label="Hero"
    >
      {/* Particle background only — no video here to avoid visual collision */}
      <div className="absolute inset-0 w-full h-full overflow-x-hidden" aria-hidden>
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
        className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/85 dark:from-background/50 dark:via-background/20 dark:to-background/70 pointer-events-none"
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-3 fold:px-4 sm:px-6 py-16 sm:py-20 md:py-24 min-w-0 max-w-4xl text-center">
        <motion.div
          ref={contentRef}
          initial={
            reducedMotion
              ? false
              : { opacity: 0, y: heroChoreography.card.y, scale: 0.98 }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: heroChoreography.card.duration,
            ease: motionTokens.hero.ease,
            delay: heroChoreography.card.delay,
          }}
          whileHover={
            reducedMotion
              ? undefined
              : { boxShadow: "0 20px 50px -15px hsl(var(--foreground) / 0.08)" }
          }
          className="relative rounded-2xl border border-border/50 bg-card/80 dark:bg-card/70 backdrop-blur-sm p-8 sm:p-10 md:p-12 mx-auto max-w-3xl"
        >
          <HeroMotion
            eyebrow={
              <p className="text-sm font-medium text-primary">Ascendra Technologies</p>
            }
            headline={HERO_HEADLINE}
            subline={HERO_SUBLINE}
            actions={
              <>
                <MagneticButton className="w-full lg:w-auto shrink-0 min-w-0 max-w-full">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 min-h-[48px] w-full lg:w-auto max-w-full bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Link href={AUDIT_PATH}>
                      Request a Digital Growth Audit
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                </MagneticButton>
                <motion.span
                  whileHover={reducedMotion ? undefined : { y: -2 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex w-full sm:w-auto shrink-0 justify-center"
                >
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="min-h-[48px] w-full sm:w-auto gap-2 shadow-sm"
                  >
                    <Link href={FREE_TRIAL_PATH}>
                      {PRIMARY_FREE_LEAD_CTA}
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                </motion.span>
                <motion.span
                  whileHover={reducedMotion ? undefined : { y: -2 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex w-full lg:w-auto shrink-0 min-w-0 max-w-full justify-center"
                >
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="min-h-[48px] w-full lg:w-auto max-w-full border-border hover:bg-accent"
                  >
                    <Link href="/services">{SEE_GROWTH_SYSTEMS}</Link>
                  </Button>
                </motion.span>
              </>
            }
          />
          <CTAReassuranceLine dense>{CTA_REASSURANCE_HOME}</CTAReassuranceLine>
        </motion.div>
      </div>
    </section>
  );
}
