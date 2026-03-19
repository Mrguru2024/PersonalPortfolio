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
import { PageSEO } from "@/components/SEO";
import { ArrowRight, CheckCircle2, Palette, Layout, Package } from "lucide-react";
import { FaqSection } from "@/components/FaqSection";
import {
  BRAND_GROWTH_PATH,
  STRATEGY_CALL_PATH,
  ECOSYSTEM_CTA_LAUNCH,
} from "@/lib/funnelCtas";

const LAUNCH_FAQ = [
  { q: "How long does a typical launch project take?", a: "Timeline depends on scope—brand only, brand + site, or full launch kit. Most launch projects run a few weeks to a few months. Book a call and we'll outline a timeline for your situation." },
  { q: "Do I need to have a business name and idea ready?", a: "It helps to have a direction, but we can work with you to clarify positioning and name as part of the strategy phase. The call is the place to discuss where you are and what you need." },
  { q: "What if I only need a logo right now?", a: "We can focus on brand identity first and add website or launch kit later. Many clients start with identity and then build out. Book a call to discuss the right sequence for you." },
  { q: "How do I get started?", a: "Book a brand launch call. We'll discuss your vision, clarify what you need, and outline next steps—no obligation." },
];

const WHAT_YOU_GET = [
  { icon: Palette, title: "Brand identity system", desc: "Logo, colors, typography, and guidelines so you look professional from day one." },
  { icon: Layout, title: "Website or landing page", desc: "A conversion-focused site that turns visitors into leads and customers." },
  { icon: Package, title: "Launch marketing kit", desc: "Core assets for social, email, and early campaigns so you launch with consistency." },
];

const PROCESS_STEPS = [
  { title: "Brand Strategy", desc: "Clarify your positioning, audience, and message so the brand supports growth." },
  { title: "Design", desc: "Visual identity and key assets designed to build trust and recognition." },
  { title: "Website Build", desc: "A fast, mobile-friendly site built to convert." },
  { title: "Launch Kit", desc: "Marketing assets and guidance so you can launch with confidence." },
];

export default function LaunchYourBrandPage() {
  return (
    <>
      <PageSEO
        title="Launch Your Business With a Brand That Looks Professional | Brand Launch"
        description="Complete business brand build for new entrepreneurs: brand identity, website, and marketing kit—built by one coordinated team. Book your brand launch call."
        keywords={["brand launch", "new business branding", "startup brand", "brand identity", "launch kit"]}
        canonicalPath="/launch-your-brand"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden" data-funnel="launch">
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 overflow-hidden border-t-4 border-amber-500/30 dark:border-amber-400/25">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 px-3 py-1.5 text-xs sm:text-sm font-medium">
                New business launch
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 leading-tight"
            >
              Launch Your Business With a Brand That{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Looks Professional From Day One
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              DIY branding makes businesses look amateur and untrustworthy. Get a full launch system: brand identity, website, and marketing assets—built together.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-full flex flex-col items-center gap-4">
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_LAUNCH}
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

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <div className="relative w-full max-w-2xl mx-auto aspect-[2/1] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-md mb-8">
              <Image src="/stock images/Diversity_16.jpeg" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 512px" />
              <div className="absolute inset-0 bg-gradient-to-t from-muted/80 via-muted/10 to-transparent" aria-hidden />
            </div>
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              The Problem With DIY Branding
            </h2>
            <Card className="border-destructive/20 bg-card/80 shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0">
                  Generic templates and DIY logos signal “side project,” not “serious business.” Customers judge you in seconds—inconsistent or amateur visuals cost trust and conversion. A coordinated brand identity, website, and launch kit show you’re ready to compete.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              What You Get
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              {WHAT_YOU_GET.map(({ icon: Icon, title, desc }, i) => (
                <Card key={i} className="border-border bg-card shadow-sm hover:border-primary/20 transition-all overflow-hidden min-w-0">
                  <CardHeader className="min-w-0">
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
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              The Process
            </h2>
            <ol className="space-y-6 sm:space-y-8">
              {PROCESS_STEPS.map(({ title, desc }, i) => (
                <li key={i} className="flex gap-3 sm:gap-4 min-w-0">
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {i + 1}
                  </span>
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
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Who This Is Best For
            </h2>
            <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {[
                    "New entrepreneurs and founders launching a product or service",
                    "Businesses that don't yet have a professional brand or website",
                    "Anyone who wants to start with a coordinated identity, site, and launch assets—not a DIY patchwork",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-6 sm:mb-8">
              One Team, One Launch
            </h2>
            <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 min-w-0">
                <p className="text-muted-foreground text-sm sm:text-base break-words min-w-0">
                  Brand, website, and launch assets are aligned from the start—no handoffs between separate vendors, no mismatched styles. You get one coordinated system so you can launch with confidence.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <FaqSection items={LAUNCH_FAQ} className="bg-muted/30 dark:bg-muted/10" />

        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl text-center">
            <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 break-words">
              Ready to launch with a brand that looks the part?
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8">
              Book a brand launch call. We’ll discuss your vision and outline the right path.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center w-full max-w-full">
              <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
                <Link href={STRATEGY_CALL_PATH}>
                  {ECOSYSTEM_CTA_LAUNCH}
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
