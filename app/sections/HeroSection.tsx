import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { ArrowRight, MousePointer, Sparkles } from "lucide-react";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ParticleAnimation from "@/components/ParticleAnimation";
import ParallaxBackground from "@/components/ParallaxBackground";
import TypewriterText from "@/components/TypewriterText";
import AnimatedButton from "@/components/AnimatedButton";
import { NoSSR } from "@/components/NoSSR";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);
  const [hoverWorkBtn, setHoverWorkBtn] = useState(false);
  const [hoverContactBtn, setHoverContactBtn] = useState(false);
  const router = useRouter();

  const scrollToWork = () => {
    const element = document.getElementById("projects");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push("/#projects");
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative -mt-[180px] sm:-mt-[200px] md:-mt-[220px] lg:-mt-[240px] pt-[180px] sm:pt-[200px] md:pt-[220px] lg:pt-[240px] pb-20 md:pb-32 overflow-hidden min-h-[90vh] flex items-center"
    >
      {/* Interactive particle background */}
      <NoSSR>
        <ParticleAnimation
          count={80}
          minSize={1}
          maxSize={4}
          colorArray={["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb"]}
          linkParticles={true}
          linkDistance={150}
          className="opacity-40 dark:opacity-30"
        />
      </NoSSR>

      {/* Parallax mouse-moving background */}
      <NoSSR>
        <ParallaxBackground className="z-0" />
      </NoSSR>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      <motion.div
        className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 relative"
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
            className="text-3xl fold:text-4xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-glow block"
            >
              Build Digital Systems That Turn
            </motion.span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent gradient-text">
              Website Visitors Into Revenue
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              type: "spring",
              stiffness: 50,
            }}
            className="text-xl md:text-2xl text-foreground mb-4"
          >
            <span className="font-medium">
              Custom websites, automation systems, and scalable platforms built for businesses ready to grow.
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-6 sm:mb-8 md:mb-10 text-base fold:text-lg xs:text-lg sm:text-lg md:text-xl text-muted-foreground px-2"
          >
            <TypewriterText
              phrases={[
                "For contractors, local businesses, and startups ready to scale online.",
                "Conversion-focused websites, automation, and product systems built to perform.",
                "From strategy to launch: clear scope, fast execution, measurable outcomes.",
                "Typical project range: $3,000 to $10,000+ with growth-ready architecture.",
              ]}
              typingSpeed={50}
              deletingSpeed={20}
              delayAfterPhrase={3000}
              className="inline-block font-light"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5"
          >
            <div
              onMouseEnter={() => setHoverWorkBtn(true)}
              onMouseLeave={() => setHoverWorkBtn(false)}
              className="relative"
            >
              <AnimatedButton
                variant="gradient"
                size="lg"
                onClick={() => router.push("/audit")}
                className="px-4 py-3 fold:px-6 fold:py-4 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm fold:text-base sm:text-base md:text-lg font-medium tracking-wide"
                withGlowEffect={true}
              >
                <span className="flex items-center gap-2">
                  Get Your Free Website Growth Audit
                  <Sparkles className="h-4 w-4 shrink-0" />
                </span>
              </AnimatedButton>

              <AnimatePresence>
                {hoverWorkBtn && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute -right-2 -top-2 bg-secondary rounded-full p-1"
                  >
                    <MousePointer className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              onMouseEnter={() => setHoverContactBtn(true)}
              onMouseLeave={() => setHoverContactBtn(false)}
            >
              <AnimatedButton
                variant="outline"
                size="lg"
                onClick={scrollToWork}
                className="px-4 py-3 fold:px-6 fold:py-4 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm fold:text-base sm:text-base md:text-lg font-medium tracking-wide"
                withPressEffect={true}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="whitespace-nowrap">View Our Work</span>
                  <motion.div
                    animate={{
                      x: hoverContactBtn ? 5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="shrink-0"
                  >
                    <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                  </motion.div>
                </span>
              </AnimatedButton>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.72 }}
            className="mt-3"
          >
            <button
              type="button"
              onClick={() => router.push("/schedule")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Prefer to talk first? Book a Strategy Call
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-6 flex flex-wrap justify-center gap-2 text-xs sm:text-sm"
          >
            <Link href="/contractor-systems" className="rounded-full border px-3 py-1 hover:border-primary hover:text-primary transition-colors">
              Contractor Systems
            </Link>
            <Link href="/local-business-growth" className="rounded-full border px-3 py-1 hover:border-primary hover:text-primary transition-colors">
              Local Business Growth
            </Link>
            <Link href="/startup-mvp-development" className="rounded-full border px-3 py-1 hover:border-primary hover:text-primary transition-colors">
              Startup MVP Development
            </Link>
          </motion.div>

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
