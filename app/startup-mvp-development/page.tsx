"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSEO } from "@/components/SEO";
import {
  ArrowRight,
  Search,
  Layers,
  Rocket,
  Code2,
  CheckCircle2,
} from "lucide-react";
import { FaqSection } from "@/components/FaqSection";
import { PersonaServiceHeroAccent } from "@/components/persona-journey/PersonaServiceHeroAccent";
import {
  PRIMARY_CTA,
  PRIMARY_CTA_SHORT,
  SECONDARY_CTA,
  AUDIT_PATH,
  STRATEGY_CALL_PATH,
  STARTUP_GROWTH_KIT_PATH,
} from "@/lib/funnelCtas";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";

const VIEW_WORK_HREF = "/partners/ascendra-technologies#projects";

const STARTUP_MVP_FAQ = [
  { q: "How long does an MVP usually take?", a: "Typical MVP timelines range from a few weeks to a few months depending on scope. We'll give you a clear timeline and milestones after the audit and strategy discussion." },
  { q: "Do you work with non-technical founders?", a: "Yes. We're used to working with founders who want to focus on product and growth while we handle architecture, development, and technical decisions." },
  { q: "What kind of products do you build?", a: "SaaS products, marketplaces, web apps, and custom platforms. We focus on MVPs and scalable architecture so you can iterate and grow." },
  { q: "How do I get started?", a: "Request your free website growth audit (or share your product idea). We'll review and outline a path. From there you can book a strategy call to define scope and next steps." },
];

export default function StartupMvpDevelopmentPage() {
  return (
    <>
      <PageSEO
        title="Startup & MVP Development | Ascendra Technologies"
        description="MVP development and scalable architecture for SaaS founders, product builders, and marketplace creators. Ship faster with an experienced development partner."
        keywords={[
          "MVP development",
          "SaaS development",
          "startup development",
          "product development",
          "scalable architecture",
          "Atlanta developer",
        ]}
        canonicalPath="/startup-mvp-development"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Hero — modern SaaS aesthetic */}
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-3 py-1.5 text-xs sm:text-sm font-medium">
                For startup founders & product builders
              </Badge>
            </motion.div>
            <PersonaServiceHeroAccent />
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 leading-tight"
            >
              Ship Your MVP With{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Scalable Architecture
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-0"
            >
              MVP development and scalable platforms for SaaS founders, product builders, and marketplace creators—built to grow with you from day one.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="w-full"
            >
              <FunnelHeroMedia
                src="/stock images/Web Design_3.jpeg"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center"
            >
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 min-h-[48px] sm:min-h-[52px] text-base sm:text-lg bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all">
                <Link href={AUDIT_PATH}>{PRIMARY_CTA}<ArrowRight className="h-4 w-4 shrink-0" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-h-[44px] opacity-90 hover:opacity-100 text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                <Link href={VIEW_WORK_HREF}>View Our Work</Link>
              </Button>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              Free audit · No obligation · Results in 24–48 hours
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Building on a tight budget?{" "}
              <Link href={STARTUP_GROWTH_KIT_PATH} className="font-medium text-primary hover:underline">
                Start with our free Startup Growth Kit
              </Link>
            </motion.p>
          </div>
        </section>

        {/* Problem awareness */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Why Startups Need the Right Dev Partner
            </h2>
            <Card className="border-destructive/20 bg-card/80 dark:bg-card/60 shadow-sm overflow-hidden">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6">
                <ul className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                  {[
                    "MVPs that can’t scale without a full rewrite.",
                    "Unclear architecture and technical debt from day one.",
                    "Missing an experienced development partner who’s shipped products.",
                    "Timeline and scope creep without a clear process.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-destructive mt-0.5 font-bold">×</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border text-center">
                  <p className="text-foreground font-semibold text-sm sm:text-base">Most early-stage products don’t have a feature problem.</p>
                  <p className="mt-1 text-primary font-semibold text-base sm:text-lg">They have a system and partner problem.</p>
                  <Button asChild size="sm" className="mt-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                    <Link href={AUDIT_PATH}>Get your free audit →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Solutions */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10 md:mb-12">
              Built for Founders Who Need to Move Fast and Scale
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              {[
                { icon: Rocket, title: "MVP Development", body: "Ship a validated product quickly with a clear scope, modern stack, and a path to scale—without overbuilding." },
                { icon: Layers, title: "Scalable Architecture", body: "Architecture and patterns that grow with you: clear structure, APIs, and deployment so you can iterate with confidence." },
                { icon: Code2, title: "Experienced Dev Partner", body: "Full-stack expertise and product thinking so you spend less time on technical decisions and more on growth." },
              ].map(({ icon: Icon, title, body }, i) => (
                <Card key={i} className="border-border bg-card h-full flex flex-col shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                  <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-2 shrink-0 ring-1 ring-primary/10">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              What This Helps You Do
            </h2>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6">
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "Ship an MVP that’s ready to validate and iterate",
                    "Avoid costly rewrites with scalable architecture",
                    "Work with a partner who’s built and shipped products",
                    "Keep a clear timeline and scope",
                    "Scale users and features without breaking the foundation",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm sm:text-base">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="text-foreground font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Process */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10 md:mb-12">
              How We Build With You
            </h2>
            <ol className="space-y-6 sm:space-y-8">
              {[
                { step: "1", title: "Audit and strategy", desc: "We review your idea, current state (if any), and goals, then outline a clear MVP scope and architecture." },
                { step: "2", title: "Build and iterate", desc: "We build your MVP with a modern stack and clear structure so you can ship, learn, and scale." },
                { step: "3", title: "Launch and scale", desc: "We launch with you and support iteration so your product grows without hitting technical walls." },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-3 sm:gap-4">
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base">{step}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg">{title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Authority */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-section">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl text-center">
            <Card className="border-border bg-card/80 dark:bg-card/60 shadow-sm text-left sm:text-center overflow-hidden">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6">
                <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                  Your Technical Co-Founder for the Build
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-2xl mx-auto">
                  Ascendra is your full-stack development partner—focused on scalable systems and product outcomes. We help startup founders and product builders ship MVPs and scale without the usual technical debt.
                </p>
                <div className="flex flex-col xs:flex-row flex-wrap justify-center gap-3 sm:gap-4 items-stretch xs:items-center">
                  <Button asChild className="w-full xs:w-auto min-h-[44px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                    <Link href={AUDIT_PATH}>{PRIMARY_CTA_SHORT}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full xs:w-auto min-h-[44px] sm:min-h-0 text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                    <Link href={STRATEGY_CALL_PATH}>{SECONDARY_CTA}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <FaqSection items={STARTUP_MVP_FAQ} />

        {/* Final CTA */}        {/* Final CTA */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Search className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{PRIMARY_CTA}</h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto">
              We’ll review your current website or product idea, identify gaps, and show you a clear path to launch or scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[52px] bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
                <Link href={AUDIT_PATH}>{PRIMARY_CTA_SHORT}<ArrowRight className="h-4 w-4 shrink-0" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto min-h-[44px] bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/15 focus-visible:ring-primary-foreground/50">
                <Link href={STRATEGY_CALL_PATH}>{SECONDARY_CTA}</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-primary-foreground/80">Free · No obligation · Response within 24–48 hours</p>
          </div>
        </section>
      </div>
    </>
  );
}
