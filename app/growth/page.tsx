"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ECOSYSTEM_PILLARS } from "@/lib/funnel-content";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING } from "@/lib/landingPageOutcomeFramework";

export default function GrowthLandingPage() {
  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-gradient-to-b from-section to-background pb-24 lg:pb-8">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 marketing-page-y max-w-4xl min-w-0">
        {/* Hero with contained visual */}
        <section className="text-center mb-14 fold:mb-16 sm:mb-20 md:mb-24">
          <h1 className="text-2xl fold:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-5 md:mb-6 leading-tight">
            Discover What&apos;s Slowing Your Business Growth
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Get a personalized diagnosis across your brand, website, and lead system.
          </p>
          <FunnelHeroMedia
            src="/stock images/Growth_8.jpeg"
            sizes="(max-width: 768px) 100vw, 672px"
            gradientClassName="from-background/75 via-transparent to-transparent"
          />
          <Button asChild size="lg" className="min-h-[48px] px-8 text-base">
            <Link href="/diagnosis">
              Run Growth Diagnosis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6 sm:mt-8 max-w-lg mx-auto leading-relaxed">
            Prefer an automated scan or a full project assessment instead?{" "}
            <Link href="/diagnostics" className="text-primary font-medium underline-offset-4 hover:underline">
              Compare all diagnosis options
            </Link>
            .
          </p>
        </section>

        <div className="mb-14 sm:mb-16">
          <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING} />
        </div>

        {/* Problem */}
        <section className="mb-20 sm:mb-24 md:mb-28">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-5 sm:mb-6 text-center">
            Why most businesses don&apos;t convert
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            There&apos;s often a disconnect between brand, design, and systems. Your message might be unclear,
            your visual identity might not build trust, or your website might not capture and nurture leads.
            Until you know where the gap is, it&apos;s hard to fix it.
          </p>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Our diagnosis tool asks targeted questions across brand clarity, visual identity, website performance,
            lead generation, and automation—so you get a clear picture of your biggest bottleneck and the right
            next step.
          </p>
        </section>

        {/* Authority: three pillars */}
        <section className="mb-20 sm:mb-24 md:mb-28">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-10 sm:mb-12 text-center">
            One ecosystem. Three specialties.
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <Card key={pillar.name} className="border-border/80">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground">{pillar.name}</h3>
                  <p className="text-sm text-primary mt-1">{pillar.role}</p>
                  <p className="text-sm text-muted-foreground mt-3">{pillar.summary}</p>
                  {pillar.href && (
                    <Link
                      href={pillar.href}
                      className="text-sm font-medium text-primary hover:underline mt-2 inline-block"
                    >
                      Learn more →
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16 sm:mb-20">
          <Card className="border-primary/25 bg-gradient-to-br from-primary/10 to-background">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
                Ascendra Growth System Guarantee
              </h2>
              <ul className="space-y-3 text-sm sm:text-base text-muted-foreground list-disc pl-5 sm:pl-6">
                <li>If you don&apos;t receive qualified leads → we keep working until you do</li>
                <li>If leads don&apos;t turn into booked jobs → we fix the system at no cost</li>
                <li>If your current traffic doesn&apos;t improve → we optimize until it does</li>
                <li>If the system doesn&apos;t pay for itself → we continue working until it does</li>
              </ul>
              <div className="flex flex-col items-center gap-3">
                <Button asChild className="min-h-[44px] w-full sm:w-auto">
                  <Link href="/market-score">See How Your System Would Perform</Link>
                </Button>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center w-full sm:w-auto">
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link href="/website-performance-score">Website Score Tool</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link href="/diagnosis">Lead Funnel Entry</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How it works */}
        <section className="mb-20 sm:mb-24 md:mb-28">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-10 sm:mb-12 text-center">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Step 1: Answer questions</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Quick questions across brand, design, and systems.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Step 2: Get growth score</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                See your scores and your primary bottleneck.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Step 3: Get solution</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                We recommend the right partner and next steps.
              </p>
            </div>
          </div>
        </section>

        <LeadMagnetRelatedWorkSection leadMagnetKey="growth-landing" />

        {/* CTA */}
        <section className="text-center pt-4 sm:pt-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-5 sm:mb-6">
            Ready to find your bottleneck?
          </h2>
          <Button asChild size="lg" className="min-h-[48px] px-8 text-base">
            <Link href="/diagnosis">
              Run Growth Diagnosis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-5 sm:mt-6">
            <Link href="/diagnostics" className="text-primary font-medium underline-offset-4 hover:underline">
              See other diagnosis paths
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
