import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layout, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { RecommendedNextStep } from "@/components/funnel/RecommendedNextStep";

export const metadata: Metadata = {
  title: "Homepage conversion blueprint | Free growth tool",
  description:
    "What your homepage needs to turn more visitors into leads. A practical blueprint: sections, messaging, and conversion elements most business homepages are missing.",
};

const BLUEPRINT_FLOW = [
  { step: 1, label: "Hero message" },
  { step: 2, label: "Trust section" },
  { step: 3, label: "Problem explanation" },
  { step: 4, label: "Solution section" },
  { step: 5, label: "Offer / CTA" },
  { step: 6, label: "Proof" },
  { step: 7, label: "Final CTA" },
];

const WHAT_MOST_GET_WRONG = [
  "Unclear messaging—visitors can't tell what you do or who it's for",
  "Weak CTAs—no obvious next step or too many competing options",
  "No trust signals—no proof, credentials, or social proof",
  "Confusing layout—competing messages and no clear hierarchy",
  "No conversion path—visitors don't know how to take the next step",
];

const SELF_CHECK = [
  "Is your value obvious in 5 seconds?",
  "Is your CTA visible above the fold?",
  "Do visitors know what to do next?",
  "Does the page build trust quickly?",
  "Does the page support mobile users well?",
];

export default function HomepageConversionBlueprintPage() {
  return (
    <>
      <PageSEO
        title="Homepage conversion blueprint | Free growth tool"
        description="What your homepage needs to turn more visitors into leads. A practical blueprint: sections, messaging, and conversion elements most business homepages are missing."
        canonicalPath="/homepage-conversion-blueprint"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-10 sm:space-y-12">
            {/* Hero */}
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layout className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                What your homepage needs to turn more visitors into leads
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                A practical blueprint showing the sections, messaging, and conversion elements most business homepages are missing.
              </p>
              <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5 mt-8">
                <Image
                  src="/stock images/Graphic Design_15.jpeg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" aria-hidden />
              </div>
            </section>

            {/* Blueprint overview */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Blueprint overview
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                An effective homepage follows a clear flow. Use this as a checklist for your own.
              </p>
              <Card className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <ol className="space-y-3">
                    {BLUEPRINT_FLOW.map(({ step, label }) => (
                      <li
                        key={step}
                        className="flex items-center gap-3 text-sm sm:text-base"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          {step}
                        </span>
                        <span className="text-foreground">{label}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </section>

            {/* What most get wrong */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What most businesses get wrong
              </h2>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                {WHAT_MOST_GET_WRONG.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Why this matters */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Why this matters
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Homepage clarity affects everything downstream: trust, conversions, lead quality, and how professional you appear. A confused visitor leaves. A clear page earns the next step.
              </p>
              <Card className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Trust</strong> — First impression sets the tone for the whole relationship.</li>
                    <li>• <strong className="text-foreground">Conversions</strong> — One clear CTA beats five vague options.</li>
                    <li>• <strong className="text-foreground">Lead generation</strong> — Visitors who know what to do next are more likely to act.</li>
                    <li>• <strong className="text-foreground">Perceived professionalism</strong> — A structured, intentional page signals that you take growth seriously.</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Quick self-check */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Quick self-check
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Run through these questions for your current homepage.
              </p>
              <Card className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-3">
                    {SELF_CHECK.map((q) => (
                      <li key={q} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-foreground">{q}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* CTA section */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Next step
              </h2>
              <p className="text-sm text-muted-foreground">
                Get a tailored review of your site and a clear plan—or talk through a homepage rebuild.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2 min-h-[48px]">
                  <Link href="/digital-growth-audit">
                    Get Help Improving Your Homepage
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-h-[48px]">
                  <Link href="/contact">Book a free call</Link>
                </Button>
              </div>
            </section>

            <RecommendedNextStep
              offerSlug="website-optimization"
              ctaText="Get Help Improving Your Homepage"
              ctaHref="/digital-growth-audit"
              secondaryCtaText="See growth systems"
              secondaryCtaHref="/services"
            />
          </div>
        </div>
      </div>
    </>
  );
}
