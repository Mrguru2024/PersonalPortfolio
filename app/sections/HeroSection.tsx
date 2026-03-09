import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialLinks from "@/components/SocialLinks";
import { personalInfo } from "@/lib/data";
import { CONTRACTORS_TRADES_PERSONA } from "@/lib/targetPersonas";
import { PRIMARY_CTA, SECONDARY_CTA, AUDIT_PATH, BOOK_CALL_HREF } from "@/lib/funnelCtas";
import { useRef, useState } from "react";
import Link from "next/link";
import ParticleAnimation from "@/components/ParticleAnimation";
import ParallaxBackground from "@/components/ParallaxBackground";
import MouseReactiveGlow from "@/components/MouseReactiveGlow";
import TypewriterText from "@/components/TypewriterText";
import AnimatedButton from "@/components/AnimatedButton";
import { NoSSR } from "@/components/NoSSR";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Smooth, professional particle palette – muted and large-scale feel */
const PARTICLE_COLORS = ["#64748b", "#94a3b8", "#cbd5e1", "#818cf8", "#a5b4fc"];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);
  const [hoverContactBtn, setHoverContactBtn] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative w-full min-w-0 max-w-full -mt-[160px] fold:-mt-[180px] sm:-mt-[200px] md:-mt-[220px] lg:-mt-[240px] pt-[160px] fold:pt-[180px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-16 fold:pb-20 md:pb-32 overflow-hidden min-h-[90vh] flex items-center"
    >
      {/* Background effects layer: smooth fade at bottom so no hard cut-off */}
      <div
        className="absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [mask-size:cover] [-webkit-mask-size:cover]"
        aria-hidden
      >
        {/* Mouse-reactive soft glow (theme-aware, follows cursor) */}
        <NoSSR>
          <MouseReactiveGlow />
        </NoSSR>

        {/* Smooth, large-scale particle layer – slow and professional */}
        <NoSSR>
          <ParticleAnimation
            count={reducedMotion ? 8 : 42}
            minSize={1.5}
            maxSize={3.5}
            minSpeed={0.06}
            maxSpeed={0.24}
            colorArray={PARTICLE_COLORS}
            linkParticles={!reducedMotion}
            linkDistance={200}
            linkThickness={0.3}
            className="opacity-[0.38] dark:opacity-[0.28]"
          />
        </NoSSR>

        {/* Parallax mouse-moving background (static gradient when reduced motion) */}
        <NoSSR>
          <ParallaxBackground className="z-0" reducedMotion={reducedMotion} />
        </NoSSR>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

        {/* Subtle noise texture */}
        <div className="noise-texture absolute inset-0 pointer-events-none" aria-hidden />

        {/* Background gradient – soft and large-scale */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.06] dark:from-primary/10 dark:to-secondary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 2, ease: 'easeOut' }}
        />
      </div>

      <motion.div
        className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 relative min-w-0 max-w-full"
        style={{ opacity, y }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              type: "spring",
              stiffness: 100,
            }}
            className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight"
          >
            <span className="text-foreground">
              Build Digital Systems That Turn Website Visitors Into{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Revenue</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 50 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2"
          >
            Custom websites, automation systems, and scalable platforms built for businesses ready to grow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5"
          >
            <Link href={AUDIT_PATH} className="inline-block">
              <AnimatedButton
                variant="gradient"
                size="lg"
                className="px-4 py-3 fold:px-6 fold:py-4 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm fold:text-base sm:text-base md:text-lg font-medium tracking-wide w-full sm:w-auto"
                withGlowEffect={true}
              >
                <span className="flex items-center gap-2">
                  {PRIMARY_CTA}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </span>
              </AnimatedButton>
            </Link>
            <div
              onMouseEnter={() => setHoverContactBtn(true)}
              onMouseLeave={() => setHoverContactBtn(false)}
            >
              <AnimatedButton
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("contact")}
                className="px-4 py-3 fold:px-6 fold:py-4 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm fold:text-base sm:text-base md:text-lg font-medium tracking-wide"
                withPressEffect={true}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="whitespace-nowrap">{SECONDARY_CTA}</span>
                  <motion.div
                    animate={{ x: hoverContactBtn ? 5 : 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="shrink-0"
                  >
                    <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                  </motion.div>
                </span>
              </AnimatedButton>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-4 sm:mt-5 text-center"
          >
            <span className="text-muted-foreground text-xs sm:text-sm">
              {CONTRACTORS_TRADES_PERSONA.shortLabel}:{" "}
              <Link
                href={CONTRACTORS_TRADES_PERSONA.href}
                className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label={CONTRACTORS_TRADES_PERSONA.ariaLabel}
              >
                {CONTRACTORS_TRADES_PERSONA.ctaLabel} →
              </Link>
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-6 fold:mt-8 sm:mt-10 md:mt-14 w-full max-w-full overflow-hidden px-1"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="mb-3 fold:mb-4 sm:mb-6 text-gray-500 dark:text-gray-400 text-xs fold:text-sm sm:text-base text-center"
            >
              Connect with me
            </motion.div>
            <SocialLinks
              className="flex flex-wrap justify-center gap-2 fold:gap-3 sm:gap-4 md:gap-6"
              iconClassName="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full p-2 fold:p-2.5 sm:p-3 text-base fold:text-lg sm:text-xl text-muted-foreground hover:text-primary dark:hover:text-primary hover:scale-110 active:scale-95 transition-all touch-manipulation"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
