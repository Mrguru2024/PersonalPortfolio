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
import { ArrowRight, Megaphone, Package, ImageIcon, ChevronDown, ExternalLink } from "lucide-react";
import { BRAND_GROWTH_PATH, STRATEGY_CALL_PATH, ECOSYSTEM_CTA_STRATEGY_CALL } from "@/lib/funnelCtas";

/** Black/red logo for white (light) background — StyleStudio_Blk_Rd_.png */
const STYLE_STUDIO_LOGO_BLACK_RED = "/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png";
const STYLE_STUDIO_LOGO_WHITE = "/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png";
const BEHANCE_STYLE_STUDIO_URL = "https://www.behance.net/kwilliams7";

const FOCUS_AREAS = [
  {
    icon: Megaphone,
    title: "Marketing graphics",
    shortDesc: "Ad creatives, social assets, campaign visuals.",
    desc: "Ad creatives, social assets, and campaign visuals that perform. On-brand, production-ready files for paid and organic channels so your marketing looks professional and converts.",
  },
  {
    icon: Package,
    title: "Packaging & production",
    shortDesc: "Production-ready packaging and print.",
    desc: "Production-ready packaging and print design that looks premium on the shelf. From concept to print-ready files—we handle the details so your product stands out.",
  },
  {
    icon: ImageIcon,
    title: "Advertising visuals",
    shortDesc: "On-brand ad concepts and production.",
    desc: "On-brand ad concepts and production design for paid and organic channels. Assets that are correctly formatted for the platforms you use and built to perform in the real world.",
  },
];

export default function StyleStudioBrandingPartnerPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <>
      <PageSEO
        title="Style Studio Branding | Marketing & Production Design"
        description="Kristopher Williams leads Style Studio Branding—production design, marketing assets, packaging, and ad creatives. Part of the Brand Growth ecosystem."
        keywords={["Style Studio Branding", "production design", "marketing assets", "packaging design", "ad creatives", "Kristopher Williams"]}
        canonicalPath="/partners/style-studio-branding"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden" data-brand="style-studio">
        {/* Hero — logo-led, premium (brand accent: campaign/production) */}
        <section className="w-full min-w-0 max-w-full relative py-12 fold:py-14 xs:py-16 sm:py-24 md:py-28 overflow-hidden border-t-4 border-red-500/40 dark:border-red-400/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto h-20 sm:h-24 mb-8 sm:mb-10"
            >
              <Image
                src={STYLE_STUDIO_LOGO_BLACK_RED}
                alt="Style Studio Branding — Marketing & production design"
                fill
                className="object-contain object-center drop-shadow-sm dark:hidden"
                sizes="(max-width: 640px) 280px, 320px"
                priority
              />
              <Image
                src={STYLE_STUDIO_LOGO_WHITE}
                alt="Style Studio Branding — Marketing & production design"
                fill
                className="object-contain object-center drop-shadow-sm hidden dark:block"
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
              <strong className="text-foreground">Kristopher Williams</strong> leads Style Studio Branding with 12+ years in production design—print, packaging, digital, and multi-format marketing assets. Experience across brands such as Payscape, DiversiTech, JustChair, and Osaic. Production-ready work that converts, aligned with Macon Designs (brand identity) and Ascendra (web) when you need the full ecosystem.
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

        {/* Services — interactive expandable cards (same pattern as Macon) */}
        <section className="w-full min-w-0 max-w-full py-12 fold:py-14 xs:py-16 sm:py-24 md:py-28 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-4 sm:mb-6 tracking-tight">
              What we do
            </h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base mb-10 sm:mb-12 max-w-xl mx-auto break-words min-w-0">
              Production design and marketing assets that are on-brand, print- and digital-ready, and built to perform for your target audience.
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
              Who we work with
            </h2>
            <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 leading-relaxed">
                  Businesses that already have (or are building) a brand and need ongoing marketing visuals: product launches, ad campaigns, social content, packaging, events, and trade shows. We work with startups, established brands, and the broader Brand Growth team when you need coordinated identity, web, and assets.
                </p>
              </CardContent>
            </Card>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-12 tracking-tight">
              Why production-ready assets matter
            </h2>
            <Card className="border-primary/20 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 leading-relaxed">
                  Production-ready means files that are on-brand, correctly formatted for print and digital, and built to perform in the real world. No last-minute fixes or inconsistent quality—just assets that build trust and convert.
                </p>
              </CardContent>
            </Card>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8 mt-12 tracking-tight">
              Portfolio / selected work
            </h2>
            <Card className="border-primary/20 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 mb-6">
                  Marketing graphics, presentations, flyers, conference materials, and corporate design—view Kristopher&apos;s full portfolio on Behance.
                </p>
                <Button asChild className="gap-2 min-h-[44px] w-full sm:w-auto">
                  <a
                    href={BEHANCE_STYLE_STUDIO_URL}
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
          </div>
        </section>

        {/* CTA — light: black/red logo; dark: white/red logo */}
        <section className="w-full min-w-0 max-w-full py-12 fold:py-14 xs:py-16 sm:py-24 md:py-28 relative overflow-hidden bg-background border-t border-border">
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl flex flex-col items-center text-center">
            <div className="relative w-full max-w-[240px] sm:max-w-[280px] mx-auto h-14 sm:h-16 mb-6 sm:mb-8">
              <Image
                src={STYLE_STUDIO_LOGO_BLACK_RED}
                alt="Style Studio Branding"
                fill
                className="object-contain object-center dark:hidden"
                sizes="(max-width: 640px) 240px, 280px"
              />
              <Image
                src={STYLE_STUDIO_LOGO_WHITE}
                alt="Style Studio Branding"
                fill
                className="object-contain object-center hidden dark:block"
                sizes="(max-width: 640px) 240px, 280px"
              />
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4 break-words">
              Ready for marketing assets that convert?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto break-words min-w-0">
              Book a strategy call. We'll align on your goals and outline clear next steps—no pressure.
            </p>
            <Button asChild size="lg" className="gap-2 min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold">
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
