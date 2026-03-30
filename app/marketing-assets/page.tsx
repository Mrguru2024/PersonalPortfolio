"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Image as ImageIcon, Package, Share2, Megaphone } from "lucide-react";
import {
  BRAND_GROWTH_PATH,
  STRATEGY_CALL_PATH,
  ECOSYSTEM_CTA_MARKETING,
} from "@/lib/funnelCtas";
import { PersonaServiceHeroAccent } from "@/components/persona-journey/PersonaServiceHeroAccent";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_MARKETING_ASSETS } from "@/lib/landingPageOutcomeFramework";
import { CTAReassuranceLine, WhatToExpectList } from "@/components/marketing/EmbeddedAssurance";
import {
  ICP_MARKETING_ASSETS_CTA_REASSURANCE,
  ICP_MARKETING_ASSETS_FINAL_REASSURANCE,
  ICP_MARKETING_ASSETS_WHAT_TO_EXPECT_ITEMS,
  ICP_MARKETING_ASSETS_WHAT_TO_EXPECT_TITLE,
} from "@/lib/embeddedAssuranceCopy";

const SERVICES = [
  { icon: Megaphone, title: "Ad creatives", desc: "Paid social and display ads that stop the scroll and convert." },
  { icon: Share2, title: "Social media graphics", desc: "Consistent, on-brand visuals for feeds and stories." },
  { icon: Package, title: "Packaging design", desc: "Product and packaging that looks premium on the shelf." },
  { icon: ImageIcon, title: "Promotional & campaign assets", desc: "Campaign visuals, sales sheets, and promotional materials." },
];

export default function MarketingAssetsPage() {
  return (
    <>
      <div className="w-full min-w-0 max-w-full overflow-x-hidden" data-funnel="marketing-assets">
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 overflow-hidden border-t-4 border-red-500/30 dark:border-red-400/25">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-6xl">
            <div className="text-center">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 px-3 py-1.5 text-xs sm:text-sm font-medium">
                  Marketing & promotional design
                </Badge>
              </motion.div>
              <PersonaServiceHeroAccent />
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 md:gap-10 lg:gap-12 xl:gap-14 items-center">
              <div className="text-center md:text-left space-y-4 sm:space-y-6 min-w-0 order-2 md:order-1">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight"
                >
                  Professional Marketing Assets That{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Actually Convert
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0"
                >
                  You have a website and basic branding—now you need stronger ongoing marketing visuals. Ad creatives, social graphics, packaging, and campaign assets led by Style Studio Branding.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="flex flex-col items-center md:items-stretch gap-4 pt-1"
                >
                  <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto md:self-start bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg">
                    <Link href={STRATEGY_CALL_PATH}>
                      {ECOSYSTEM_CTA_MARKETING}
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </Button>
                  <Link
                    href="/partners/style-studio-branding"
                    className="inline-flex items-center justify-center md:justify-start gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    <div className="relative w-20 h-8 shrink-0">
                      <Image src="/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png" alt="Style Studio Branding" fill className="object-contain object-left dark:hidden" sizes="80px" />
                      <Image src="/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png" alt="Style Studio Branding" fill className="object-contain object-left hidden dark:block" sizes="80px" />
                    </div>
                    <span className="text-left">Marketing & production by Style Studio Branding</span>
                  </Link>
                  <CTAReassuranceLine dense className="max-w-xl mx-auto md:mx-0">
                    {ICP_MARKETING_ASSETS_CTA_REASSURANCE}
                  </CTAReassuranceLine>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="order-1 md:order-2 w-full"
              >
                <FunnelHeroMedia
                  src="/stock images/Graphic Design_16.jpeg"
                  spacing="none"
                  maxWidth="full"
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                  className="max-w-lg mx-auto md:max-w-none aspect-[4/3] md:aspect-[5/4]"
                  gradientClassName="from-background/60 via-transparent to-transparent md:from-background/40"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-8 sm:py-10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_MARKETING_ASSETS} />
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Why Weak Marketing Visuals Cost You Trust and Sales
            </h2>
            <Card className="border-destructive/20 bg-card/80 shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {[
                    "Inconsistent ads and social that don't match your brand.",
                    "DIY graphics that look amateur and reduce credibility.",
                    "Campaigns that don't match your brand or convert.",
                    "Lost trust when assets don't hold up in the real world.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <span className="text-destructive font-bold shrink-0">×</span>
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              What We Create
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
              {SERVICES.map(({ icon: Icon, title, desc }, i) => (
                <Card key={i} className="border-border bg-card shadow-sm hover:border-primary/20 transition-all overflow-hidden min-w-0">
                  <CardHeader className="pb-2 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base sm:text-lg break-words">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 min-w-0">
                    <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-6 sm:mb-8 mt-12">
              Production-Ready Assets That Perform
            </h2>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden min-w-0 max-w-3xl mx-auto">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0 mb-4">
                  Style Studio Branding specializes in production design—assets that are on-brand, print- and digital-ready, and built for real campaigns. Led by <strong className="text-foreground">Kristopher Williams</strong>, production artist with 12+ years across design, production, and marketing.
                </p>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href="/partners/style-studio-branding">
                    Meet Kristopher <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <p className="text-center text-muted-foreground text-sm mt-6 break-words min-w-0 max-w-full">
              Primary lead: <strong className="text-foreground">Style Studio Branding</strong> — production design, packaging, and ad creatives. We work with the broader brand growth team when you need full ecosystem support.
            </p>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              When to Bring In a Production Partner
            </h2>
            <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {[
                    "Product launch or rebrand rollout",
                    "Ongoing social content that needs to stay on-brand",
                    "Paid ad campaigns that need to convert",
                    "Events or trade shows",
                    "Packaging refresh or new product line",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <span className="text-primary font-bold shrink-0">•</span>
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              How It Works
            </h2>
            <ol className="space-y-6 sm:space-y-8 min-w-0">
              {[
                { title: "Brief & brand alignment", desc: "We align on your brand, goals, and what you need." },
                { title: "Concepts or templates", desc: "We create concepts or templates for your approval." },
                { title: "Production-ready files", desc: "Final assets delivered in the formats you need (print, digital, etc.)." },
                { title: "Revisions and delivery", desc: "Revisions as needed, then handoff and any usage guidance." },
              ].map(({ title, desc }, i) => (
                <li key={i} className="flex gap-3 sm:gap-4 min-w-0">
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg break-words">{title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1 break-words min-w-0">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl text-center">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 break-words">
              Ready for marketing assets that convert?
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8">
              Start your marketing upgrade. Book a strategy call and we’ll align on goals and next steps.
            </p>
            <CTAReassuranceLine dense className="text-primary-foreground/85 max-w-lg mx-auto mb-6">
              {ICP_MARKETING_ASSETS_FINAL_REASSURANCE}
            </CTAReassuranceLine>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center w-full max-w-full">
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_MARKETING}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-[44px] w-full sm:w-auto bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/15">
                <Link href={BRAND_GROWTH_PATH}>Back to Brand Growth</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
