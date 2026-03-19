"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ECOSYSTEM_PILLARS } from "@/lib/funnel-content";
export default function GrowthLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        {/* Hero with contained visual */}
        <section className="text-center mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover What&apos;s Slowing Your Business Growth
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get a personalized diagnosis across your brand, website, and lead system.
          </p>
          <div className="relative w-full max-w-3xl mx-auto aspect-[21/9] sm:aspect-[2/1] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5 mb-8">
            <Image src="/stock images/Growth_8.jpeg" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-transparent" aria-hidden />
          </div>
          <Button asChild size="lg" className="min-h-[48px] px-8 text-base">
            <Link href="/diagnosis">
              Run Growth Diagnosis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Problem */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4 text-center">
            Why most businesses don&apos;t convert
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-6">
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
        <section className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8 text-center">
            One ecosystem. Three specialties.
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
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

        {/* How it works */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8 text-center">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Step 1: Answer questions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Quick questions across brand, design, and systems.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Step 2: Get growth score</h3>
              <p className="text-sm text-muted-foreground mt-1">
                See your scores and your primary bottleneck.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Step 3: Get solution</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We recommend the right partner and next steps.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Ready to find your bottleneck?
          </h2>
          <Button asChild size="lg" className="min-h-[48px] px-8 text-base">
            <Link href="/diagnosis">
              Run Growth Diagnosis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
