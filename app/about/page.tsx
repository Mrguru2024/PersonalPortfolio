import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { AboutFoundersQueryScroll } from "@/components/about/AboutFoundersQueryScroll";
import { EcosystemTeamSection } from "@/components/about/EcosystemTeamSection";
import { AscendraPromoVideo } from "@/components/media/AscendraPromoVideo";
import { ASCENDRA_VIDEO } from "@/lib/ascendraMedia";
import { ECOSYSTEM_PILLARS, POSITIONING_STATEMENT } from "@/lib/funnel-content";
import { AUDIT_PATH } from "@/lib/funnelCtas";

export const metadata: Metadata = {
  title: "About Ascendra & the ecosystem team | Ascendra Technologies",
  description:
    "One coordinated growth ecosystem: Ascendra Technologies, Macon Designs®, and Style Studio Branding. How we work together, plus the founders behind strategy, design, and technology.",
};

const collaborationSteps = [
  "We align on business goals and current bottlenecks.",
  "We diagnose positioning, visual trust, and conversion structure.",
  "We assign the right delivery mix across strategy, design, and technology.",
  "We execute in coordinated phases with clear next-step priorities.",
];

const anchorLinks = [
  { href: "#ecosystem-pillars", label: "Three partners" },
  { href: "#ecosystem-team", label: "Meet the team" },
  { href: "#ecosystem-model", label: "Why it works" },
  { href: "#how-disciplines-align", label: "How we align" },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageSEO
        title="About Ascendra & the ecosystem team | Ascendra Technologies"
        description="One coordinated growth ecosystem—strategy, design, and technology. Meet the founders and see how Ascendra, Macon Designs®, and Style Studio Branding work together."
        canonicalPath="/about"
      />
      <Suspense fallback={null}>
        <AboutFoundersQueryScroll />
      </Suspense>

      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/[0.06] via-background to-secondary/[0.06] dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-12 sm:space-y-16">
            {/* Hero */}
            <section className="text-center max-w-3xl mx-auto space-y-4">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">About Ascendra</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                One ecosystem. Three specialized partners. One team you can trust.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">{POSITIONING_STATEMENT}</p>
            </section>

            {/* In-page navigation */}
            <nav
              aria-label="On this page"
              className="flex flex-wrap justify-center gap-2 sm:gap-3 border-y border-border/60 py-4"
            >
              {anchorLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Brand video — wide 16:9, not phone-narrow */}
            <section className="space-y-3" aria-label="Ascendra brand video">
              <AscendraPromoVideo
                src={ASCENDRA_VIDEO.logoReveal}
                ariaLabel="Ascendra logo reveal"
                objectFit="contain"
                maxWidthClassName="max-w-5xl"
              />
            </section>

            {/* Pillars */}
            <section id="ecosystem-pillars" className="scroll-mt-24 space-y-6 sm:space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">The three pillars</h2>
                <p className="mt-2 text-muted-foreground">
                  Technology, brand identity, and marketing production—coordinated when you need the full stack.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                {ECOSYSTEM_PILLARS.map((pillar) => (
                  <Card key={pillar.name} className="border-border/80 bg-card/80 h-full overflow-hidden backdrop-blur-sm">
                    <CardContent className="p-5 sm:p-6">
                      {pillar.logo ? (
                        <div className="relative h-12 sm:h-14 w-full max-w-[180px] mb-4">
                          <Image
                            src={pillar.logo}
                            alt={pillar.name}
                            fill
                            className={`object-contain object-left ${pillar.logoDark ? "dark:hidden" : ""}`}
                            sizes="180px"
                          />
                          {pillar.logoDark ? (
                            <Image
                              src={pillar.logoDark}
                              alt={pillar.name}
                              fill
                              className="object-contain object-left hidden dark:block"
                              sizes="180px"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <h3 className="text-xl font-semibold text-foreground">{pillar.name}</h3>
                      <p className="mt-2 text-sm font-medium text-primary">{pillar.role}</p>
                      <p className="mt-3 text-sm text-muted-foreground">{pillar.summary}</p>
                      {pillar.href ? (
                        <Link
                          href={pillar.href}
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          Learn more
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Why ecosystem model */}
            <section
              id="ecosystem-model"
              className="scroll-mt-24 rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-sm shadow-sm"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 sm:mb-4">
                Why the ecosystem model works
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Most businesses do not need random tactics. They need strategy, presentation, and execution to work
                together. That is what this model is designed to do.
              </p>
              <ul className="mt-5 space-y-3 text-sm sm:text-base text-muted-foreground">
                {collaborationSteps.map((step) => (
                  <li key={step} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Founders — full content from former /ecosystem-founders */}
            <EcosystemTeamSection />

            {/* How disciplines work together — from former founders page */}
            <section id="how-disciplines-align" className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                How the three disciplines work together
              </h2>
              <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-4 text-sm sm:text-base text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Strategy</strong> clarifies who you serve and what
                        you&apos;re known for. That clarity guides every message and design decision.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Design</strong> turns that strategy into a visual identity
                        and presentation that builds trust and looks professional.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Technology</strong> delivers the website and systems that
                        capture leads, run smoothly, and support your growth.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        When all three are aligned, you get a coherent brand, a credible presence, and a site that
                        converts—without the chaos of juggling separate vendors.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* CTAs — merged from both pages */}
            <section
              id="about-cta"
              className="text-center rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card/80 p-6 sm:p-10 shadow-sm"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
                Start with clarity, then scale delivery
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                A free audit is the fastest way to see your strongest next move—brand, design, and conversion in one
                view.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                <Button asChild className="min-h-[44px]">
                  <Link href={AUDIT_PATH}>
                    Request Digital Growth Audit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/digital-growth-audit">Free growth audit (overview)</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/brand-growth">Brand Growth hub</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/services">See how we can help</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
