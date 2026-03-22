"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSEO } from "@/components/SEO";
import {
  ArrowRight,
  Search,
  Smartphone,
  Zap,
  Target,
  CheckCircle2,
} from "lucide-react";
import { FaqSection } from "@/components/FaqSection";
import { PersonaServiceHeroAccent } from "@/components/persona-journey/PersonaServiceHeroAccent";
import {
  PRIMARY_CTA,
  PRIMARY_CTA_SHORT,
  SECONDARY_CTA as BOOK_CALL_CTA,
  AUDIT_PATH,
  BOOK_CALL_HREF,
} from "@/lib/funnelCtas";

const VIEW_WORK_CTA = "View Our Work";

const CONTRACTOR_FAQ = [
  { q: "How long does a project usually take?", a: "Timeline depends on scope. A focused lead-generation site or refresh might take a few weeks; a full system with forms and follow-up can take a few months. We'll give you a clear timeline after the audit." },
  { q: "Do you work with local Atlanta businesses only?", a: "We work with contractors and trades businesses in and beyond Atlanta. Remote collaboration is standard, and we can align with your schedule." },
  { q: "What kind of businesses is this best for?", a: "Electricians, HVAC, plumbers, locksmiths, security installers, roofing companies, and other local trades and service businesses that want more calls and qualified leads from their website." },
  { q: "How do I get started?", a: "Request your free website growth audit. We'll review your current site, identify conversion gaps, and show you where you may be losing leads. From there you can book a strategy call to plan next steps." },
];

export default function ContractorSystemsPage() {
  return (
    <>
      <PageSEO
        title="Contractor & Trades Website Lead System | Ascendra Technologies"
        description="Turn your contractor or trades business website into a lead machine. Custom websites and automation for electricians, HVAC, plumbers, locksmiths, and local service businesses."
        keywords={[
          "contractor website",
          "trades business",
          "lead generation",
          "electrician website",
          "HVAC website",
          "plumber website",
          "local service business",
        ]}
        canonicalPath="/contractor-systems"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        {/* 1. Hero — high-impact, single primary CTA */}
        <section className="w-full min-w-0 max-w-full relative py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.25),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-3 py-1.5 text-xs sm:text-sm font-medium">
                For contractors & trades
              </Badge>
            </motion.div>
            <PersonaServiceHeroAccent />
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl fold:text-3xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 sm:mb-6 leading-tight"
            >
              Turn Your Website Into a{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lead Machine
              </span>{" "}
              for Your Service Business
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              Custom websites and automation systems built to help contractors
              and trades businesses generate more calls, more qualified leads,
              and better conversion from their online traffic.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="w-full"
            >
              <div className="relative w-full max-w-3xl mx-auto aspect-[21/9] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                <Image
                  src="/stock images/Growth_6.jpeg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" aria-hidden />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center"
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto gap-2 min-h-[48px] sm:min-h-[52px] text-base sm:text-lg bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all"
              >
                <Link href={AUDIT_PATH}>
                  {PRIMARY_CTA}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-h-[44px] opacity-90 hover:opacity-100 text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                <Link href="/partners/ascendra-technologies#projects">{VIEW_WORK_CTA}</Link>
              </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground"
            >
              Free audit · No obligation · Results in 24–48 hours
            </motion.p>
          </div>
        </section>

        {/* 2. Problem awareness — visual card, clear bridge to solution */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              Why Most Contractor Websites Fail to Generate Leads
            </h2>
            <Card className="border-destructive/20 bg-card/80 dark:bg-card/60 shadow-sm overflow-hidden">
              <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6">
                <ul className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                  {[
                    "They do not capture leads properly.",
                    "They do not follow up effectively.",
                    "They perform poorly on mobile.",
                    "They lack local SEO structure.",
                    "They do not convert traffic into booked jobs.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-destructive mt-0.5 font-bold">×</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border text-center">
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    Most businesses do not have a design problem.
                  </p>
                  <p className="mt-1 text-primary font-semibold text-base sm:text-lg">
                    They have a system problem.
                  </p>
                  <Button asChild size="sm" className="mt-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                    <Link href={AUDIT_PATH}>Get your free audit →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Solution */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-4xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10 md:mb-12">
              A Website System Built to Help You Win More Jobs
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              {[
                {
                  icon: Target,
                  title: "Lead Capture",
                  body: "Forms and flows that capture call-ready leads and contact details so you follow up instead of losing them.",
                },
                {
                  icon: Zap,
                  title: "Automation",
                  body: "Follow-up and reminders that work while you focus on the job—so fewer leads fall through the cracks.",
                },
                {
                  icon: Smartphone,
                  title: "Conversion-Focused Structure",
                  body: "Mobile-friendly, fast pages and clear calls to action so visitors become leads instead of bouncing.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <Card
                  key={i}
                  className="border-border bg-card h-full flex flex-col shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-2 shrink-0 ring-1 ring-primary/10">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm sm:text-base">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Outcomes — benefit list in card */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10">
              What This Helps Your Business Do
            </h2>
            <Card className="border-primary/10 bg-card shadow-sm overflow-hidden">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6">
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "Generate more service calls",
                    "Capture more qualified leads",
                    "Improve online trust",
                    "Track what is working",
                    "Reduce missed opportunities",
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

        {/* 5. Process */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl">
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-10 md:mb-12">
              How We Build Your Growth System
            </h2>
            <ol className="space-y-6 sm:space-y-8">
              {[
                { step: "1", title: "Audit and strategy", desc: "We review your current site and goals, then outline a clear plan to capture and convert more leads." },
                { step: "2", title: "Build and optimize", desc: "We build or refine your website and systems so they work for your business and your customers." },
                { step: "3", title: "Launch and refine", desc: "We launch with you and tune based on real results so your system keeps working." },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-3 sm:gap-4">
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base">
                    {step}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg">{title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. Authority — card + primary CTA emphasis */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 bg-muted/30 dark:bg-muted/10">
          <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-3xl text-center">
            <Card className="border-border bg-card/80 dark:bg-card/60 shadow-sm text-left sm:text-center overflow-hidden">
              <CardContent className="py-6 sm:py-8 px-4 sm:px-6">
                <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                  Built for Real Businesses That Need Results
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-2xl mx-auto">
                  Ascendra is your full-stack development partner—focused on systems
                  and business outcomes, not just design. We help contractors and
                  trades companies turn their website into a reliable lead and
                  conversion tool.
                </p>
                <div className="flex flex-col xs:flex-row flex-wrap justify-center gap-3 sm:gap-4 items-stretch xs:items-center">
                  <Button asChild className="w-full xs:w-auto min-h-[44px] gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                    <Link href={AUDIT_PATH}>{PRIMARY_CTA_SHORT}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full xs:w-auto min-h-[44px] sm:min-h-0 text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                    <Link href="/partners/ascendra-technologies#projects">{VIEW_WORK_CTA}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <FaqSection items={CONTRACTOR_FAQ} />

        {/* 8. Final CTA */}        {/* 8. Final CTA */}
        <section className="w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 md:py-24 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
          <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Search className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
            <h2 className="text-xl fold:text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              {PRIMARY_CTA}
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 sm:mb-8 max-w-xl mx-auto">
              We’ll review your current website, identify conversion gaps, and
              show you where your business may be losing leads online.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Button asChild size="lg" className="gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[52px] bg-primary-foreground text-primary hover:bg-primary-foreground/95 shadow-xl font-semibold">
                <Link href={AUDIT_PATH}>
                  {PRIMARY_CTA_SHORT}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto min-h-[44px] bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/15 focus-visible:ring-primary-foreground/50">
                <Link href={BOOK_CALL_HREF}>{BOOK_CALL_CTA}</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-primary-foreground/80">Free · No obligation · Response within 24–48 hours</p>
          </div>
        </section>
      </div>
    </>
  );
}
