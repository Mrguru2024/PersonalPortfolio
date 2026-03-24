"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { ArrowRight, Palette, Target, Layers, ChevronDown, ExternalLink } from "lucide-react";
import { BRAND_GROWTH_PATH, STRATEGY_CALL_PATH, ECOSYSTEM_CTA_STRATEGY_CALL } from "@/lib/funnelCtas";

const MACON_LOGO_BADGE = "/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png";
const MACON_LOGO_WHITE = "/Ascendra images/logomacondesigns/Macon Designs_logo_horiz_white.png";

const FOCUS_AREAS = [
  {
    icon: Palette,
    title: "Brand identity",
    shortDesc: "Logo systems, color, typography.",
    desc: "Logo systems, color, typography, and visual language that build recognition and trust. We create identities that scale across every touchpoint and support your positioning.",
  },
  {
    icon: Layers,
    title: "Visual systems",
    shortDesc: "Guidelines and assets.",
    desc: "Guidelines and assets that keep your brand consistent across every touchpoint—so your website, ads, packaging, and social all feel unmistakably you.",
  },
  {
    icon: Target,
    title: "Strategic design",
    shortDesc: "Design that supports positioning.",
    desc: "Design that supports your positioning and helps you stand out in your market. Not just pretty—strategic, so every asset works harder for your business.",
  },
];

export default function MaconDesignsPartnerPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <>
      <PageSEO
        title="Macon Designs | Brand Identity & Visual Systems"
        description="Denishia leads Macon Designs—brand identity, visual systems, and strategic design. Part of the coordinated Brand Growth ecosystem with Ascendra and Style Studio."
        keywords={["Macon Designs", "brand identity", "visual identity", "brand systems", "Denishia"]}
        canonicalPath="/partners/macon-designs"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden" data-brand="macon">
        {/* Hero — logo-led, premium (brand accent: warm/identity) */}
        <section className="w-full min-w-0 max-w-full relative py-12 fold:py-14 xs:py-16 sm:py-24 md:py-28 overflow-hidden border-t-4 border-amber-500/40 dark:border-amber-400/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto aspect-[1.1] mb-8 sm:mb-10"
            >
              <Image
                src={MACON_LOGO_BADGE}
                alt="Macon Designs — Brand identity & visual systems"
                fill
                className="object-contain object-center drop-shadow-md"
                sizes="(max-width: 640px) 280px, 320px"
                priority
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-10 break-words min-w-0"
            >
              <strong className="text-foreground">Denishia</strong> leads Macon Designs with a BA in Visual Communications and 10+ years focused on brand identity. She helps growth-ready businesses build identity systems that look professional and convert—brand strategy, visual identity, and design systems that integrate with the broader Brand Growth team (Ascendra for web, Style Studio for marketing assets).
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_STRATEGY_CALL}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-[44px]">
                <Link href={BRAND_GROWTH_PATH}>Brand Growth hub</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Services — interactive expandable cards */}
        <section className="w-full min-w-0 max-w-full py-12 fold:py-14 xs:py-16 sm:py-24 md:py-28 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-4 sm:mb-6 tracking-tight">
              What we do
            </h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base mb-10 sm:mb-12 max-w-xl mx-auto break-words min-w-0">
              Brand identity and visual systems that build trust and recognition—strategic, scalable, and unmistakably yours.
            </p>
            <div className="space-y-3 sm:space-y-4 min-w-0">
              {FOCUS_AREAS.map(({ icon: Icon, title, shortDesc, desc }, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ transition: { duration: 0.2 } }}
                  className="min-w-0"
                >
                  <Card
                    className={`border overflow-hidden min-w-0 cursor-pointer transition-all duration-200 select-none ${
                      expandedIndex === i
                        ? "border-primary/30 bg-card shadow-md ring-1 ring-primary/10"
                        : "border-border bg-card shadow-sm hover:border-primary/20 hover:shadow"
                    }`}
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  >
                    <CardHeader className="py-4 sm:py-5 px-4 sm:px-6 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base sm:text-lg break-words">{title}</CardTitle>
                            <CardDescription className="text-sm mt-0.5 break-words min-w-0">{shortDesc}</CardDescription>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                            expandedIndex === i ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                    <AnimatePresence initial={false}>
                      {expandedIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <CardContent className="pt-0 pb-4 sm:pb-6 px-4 sm:px-6 min-w-0 border-t border-border/80">
                            <p className="text-muted-foreground text-sm sm:text-base pt-4 break-words min-w-0">
                              {desc}
                            </p>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-14 sm:mt-16 tracking-tight">
              Design philosophy
            </h2>
            <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 leading-relaxed">
                  Brand identity should be strategic, not just pretty. We focus on clarity, consistency, and systems that scale—so your logo, colors, and typography work across every touchpoint and support your positioning.
                </p>
              </CardContent>
            </Card>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-12 tracking-tight">
              Portfolio / selected work
            </h2>
            <Card className="border-primary/20 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 mb-6">
                  Brand identity, social media branding kits, conference and event branding, and motion graphics—view Denishia&apos;s full portfolio on Behance.
                </p>
                <Button asChild className="gap-2 min-h-[44px] w-full sm:w-auto">
                  <a
                    href="https://www.behance.net/macondesigns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    View portfolio on Behance
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-12 tracking-tight">
              Why brand systems matter
            </h2>
            <Card className="border-primary/20 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 leading-relaxed">
                  A clear brand system—logo, colors, typography, and guidelines—gives you consistency and credibility. It makes every subsequent piece (website, ads, packaging) faster to produce and more recognizable. That's why we build systems, not one-off logos.
                </p>
              </CardContent>
            </Card>
            <p className="text-center text-muted-foreground text-sm mt-8 max-w-2xl mx-auto break-words min-w-0">
              Macon Designs is the brand identity pillar of the ecosystem. When your project needs strategy, identity, and guidelines, we connect you with the right path.
            </p>
          </div>
        </section>

        {/* CTA — white logo */}
        <section className="w-full min-w-0 max-w-full py-12 fold:py-14 xs:py-16 sm:py-24 md:py-28 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,255,255,0.12),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl flex flex-col items-center text-center">
            <div className="relative w-full max-w-[240px] sm:max-w-[280px] mx-auto h-14 sm:h-16 mb-6 sm:mb-8">
              <Image
                src={MACON_LOGO_WHITE}
                alt="Macon Designs"
                fill
                className="object-contain object-center opacity-95"
                sizes="(max-width: 640px) 240px, 280px"
              />
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 break-words">
              Ready to build a brand that converts?
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto break-words min-w-0">
              Book a strategy call. We'll align on your goals and outline clear next steps—no pressure.
            </p>
            <Button asChild size="lg" className="gap-2 min-h-[48px] bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
              <Link href={STRATEGY_CALL_PATH}>
                {ECOSYSTEM_CTA_STRATEGY_CALL}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
