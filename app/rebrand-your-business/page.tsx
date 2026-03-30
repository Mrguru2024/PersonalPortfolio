"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaqSection } from "@/components/FaqSection";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  BRAND_GROWTH_PATH,
  STRATEGY_CALL_PATH,
  ECOSYSTEM_CTA_REBRAND,
} from "@/lib/funnelCtas";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_REBRAND } from "@/lib/landingPageOutcomeFramework";

const REBRAND_FAQ = [
  { q: "How long does a rebrand take?", a: "It depends on scope. Most rebrands run from a few weeks to a few months. Book a strategy call and we'll outline a timeline for your situation." },
  { q: "Can we keep our name and just refresh the look?", a: "Yes. Many rebrands keep the business name and focus on visual identity, messaging, and website." },
  { q: "Do you work with businesses outside my region?", a: "Yes. We work with growth-ready businesses remotely." },
  { q: "What if we only need a website refresh?", a: "We can scope a website rebuild separately or as part of a larger rebrand. The strategy call is the place to clarify scope." },
];

const REBRAND_SERVICES = [
  "Brand redesign — logo, colors, typography, and guidelines that reflect where you are now",
  "Website rebuild — a modern, conversion-focused site that supports growth",
  "Updated marketing visuals — ads, social, and promotional assets that match the new brand",
];

export default function RebrandYourBusinessPage() {
  return (
    <>
      <div className="w-full min-w-0 max-w-full overflow-x-hidden" data-funnel="rebrand">
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 overflow-hidden border-t-4 border-primary/80">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 px-3 py-1.5 text-xs sm:text-sm font-medium">
                Rebrand & website upgrade
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 leading-tight"
            >
              Your Business Grew —{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                But Your Brand Didn’t
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              Outdated branding and weak websites hurt credibility and reduce conversion. Get a complete rebrand and website upgrade—brand, site, and marketing visuals aligned.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full flex flex-col items-center gap-4">
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_REBRAND}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Link href="/partners/macon-designs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <div className="relative w-16 h-7 shrink-0">
                  <Image src="/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png" alt="Macon Designs" fill className="object-contain object-left" sizes="64px" />
                </div>
                <span>Brand identity by Macon Designs</span>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-8 sm:py-10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_REBRAND} />
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <FunnelHeroMedia
              src="/stock images/Graphic Design_15.jpeg"
              aspect="wide"
              maxWidth="2xl"
              spacing="none"
              sizes="(max-width: 768px) 100vw, 512px"
              className="mb-6 sm:mb-8"
              gradientClassName="from-section/90 via-section/20 to-transparent"
            />
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Signs You've Outgrown Your Brand
            </h2>
            <Card className="border-destructive/20 bg-card/80 shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base mb-4 break-words min-w-0">
                  Your offer and audience have evolved—but your brand and website still look like the old you. That gap costs trust and sales. (See signs below.) A coordinated rebrand and website rebuild positions you for the growth you’re ready for.
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground mt-4">
                  {[
                    "Your logo feels dated and no longer reflects your offer.",
                    "Your website doesn't reflect where your business is today.",
                    "Marketing materials don't match each other—or your ambitions.",
                    "You're embarrassed to send clients or partners to your site.",
                    "You've expanded but your look hasn't.",
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
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-6 sm:mb-8">A Rebrand That Matches Where You Are Now</h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base mb-8 max-w-2xl mx-auto break-words min-w-0">Your offer and audience have evolved. A coordinated rebrand and website rebuild positions you for growth.</p>
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">What's Included</h3>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {REBRAND_SERVICES.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">The Rebrand Process</h2>
            <ol className="space-y-6 sm:space-y-8 min-w-0">
              {[
                { title: "Discovery & strategy", desc: "Clarify where you are now and where you want your brand to take you." },
                { title: "Visual identity", desc: "Redesign logo, colors, typography, and guidelines that reflect your current positioning." },
                { title: "Website build", desc: "Modern, conversion-focused site that supports growth." },
                { title: "Marketing asset updates", desc: "Ads, social, and promotional materials that match the new brand." },
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

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">What This Does for Your Business</h2>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                  {["Credibility that matches your offer and audience", "A site that converts—not just looks better", "Consistent look across website, ads, and social", "Confidence when you send clients and partners to your brand"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-foreground font-medium break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <FaqSection items={REBRAND_FAQ} title="Common Questions" className="bg-section" />

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl text-center">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 break-words">
              Ready to align your brand with your growth?
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8">
              Book a rebrand strategy call. We’ll review where you are and outline a clear path forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center w-full max-w-full">
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_REBRAND}
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
