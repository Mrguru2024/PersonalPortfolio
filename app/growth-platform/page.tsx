import type { Metadata } from "next";
import Link from "next/link";
import { TrackPageView } from "@/components/TrackPageView";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { JobRevenueImpactCalculator } from "@/components/growth-platform/JobRevenueImpactCalculator";
import { OfferStackTierCards } from "@/components/growth-platform/OfferStackTierCards";
import { ThreeStepSystemPreview } from "@/components/growth-platform/ThreeStepSystemPreview";
import { ASCENDRA_OFFER_STACK } from "@shared/ascendraOfferStack";
import { ASCENDRA_CORE_GUARANTEE_BODY, ASCENDRA_CORE_GUARANTEE_TITLE } from "@shared/ascendraCoreGuarantee";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CTAReassuranceLine } from "@/components/marketing/EmbeddedAssurance";
import { CTA_REASSURANCE_GROWTH_PLATFORM } from "@/lib/embeddedAssuranceCopy";

const growthPlatformPageMeta = buildMarketingMetadata({
  title: "Ascendra Growth System | Diagnose, build, scale",
  description:
    "Three steps framed around outcomes—clarify why leads are inconsistent, install capture and booking systems, then scale what works. Value before price: calculators, tools, DFY/DWY/DIY stack. Results depend on your market and execution.",
  path: "/growth-platform",
  keywords: ["growth system", "Ascendra", "DFY", "DWY", "DIY", "revenue calculator", "service business"],
});

export const metadata: Metadata = growthPlatformPageMeta;

export default function GrowthPlatformPage() {
  const dfy = ASCENDRA_OFFER_STACK.DFY;
  return (
    <>
      <WebPageJsonLd
        title="Ascendra Growth System"
        description={String(growthPlatformPageMeta.description ?? "")}
        path="/growth-platform"
      />
      <TrackPageView path="/growth-platform" />
      <div className="w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-teal-500/10 via-background to-background dark:from-teal-950/30">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-5xl space-y-12 sm:space-y-16">
          <header className="text-center space-y-4 max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
              System installation platform
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Attract leads, diagnose the business, show value fast—then install what actually ships results
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              This isn&apos;t a generic website. It&apos;s a connected path: free tools and scores → CRM-qualified follow-up
              → offers with clear scope—so you&apos;re not gambling on vibes.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="#value-first">
                  Start with value
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/strategy-call">Book strategy call</Link>
              </Button>
            </div>
            <CTAReassuranceLine className="max-w-2xl mx-auto">{CTA_REASSURANCE_GROWTH_PLATFORM}</CTAReassuranceLine>
          </header>

          <section id="value-first" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold">Value before price</h2>
            <p className="text-muted-foreground max-w-3xl">
              If you&apos;re dealing with{" "}
              <strong className="text-foreground">inconsistent jobs</strong>,{" "}
              <strong className="text-foreground">not enough calls</strong>, or{" "}
              <strong className="text-foreground">wasted ad spend</strong>, quantify the gap in plain numbers first.
            </p>
            <JobRevenueImpactCalculator />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Offer stack</h2>
            <p className="text-muted-foreground max-w-3xl">
              Three ways to work together. Pricing is shown as{" "}
              <strong className="text-foreground">ranges</strong>; exact quotes depend on scope after diagnosis.{" "}
              {dfy.roiFramingExample}
            </p>
            <OfferStackTierCards />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3-step growth system (preview)</h2>
            <p className="text-muted-foreground max-w-3xl">
              Each step is framed in <strong className="text-foreground">outcomes</strong>—more booked work, fewer
              wrong-fit leads, systems that don&apos;t depend on daily heroics. Below, links show what you can run today;
              active clients get deeper workspaces as scope opens.
            </p>
            <ThreeStepSystemPreview />
          </section>

          <section
            className="rounded-xl border border-teal-500/25 bg-teal-500/[0.06] dark:bg-teal-950/25 p-6 sm:p-8 max-w-3xl mx-auto space-y-3 text-center"
            aria-labelledby="ascendra-core-guarantee-heading"
          >
            <h2 id="ascendra-core-guarantee-heading" className="text-xl font-semibold text-balance">
              {ASCENDRA_CORE_GUARANTEE_TITLE}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-balance">
              {ASCENDRA_CORE_GUARANTEE_BODY}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card/80 p-6 sm:p-8 text-center space-y-3">
            <h2 className="text-xl font-semibold">Legal &amp; expectations</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Outcome-oriented language on this page describes aims and typical system design—not guaranteed business
              results. Engagements use written scope, payment terms, and limitation clauses—see{" "}
              <Link href="/service-engagement" className="underline text-primary">
                service engagement overview
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="underline text-primary">
                terms
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
