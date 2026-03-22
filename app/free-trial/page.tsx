import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Search, Sparkles, LayoutGrid, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { TrackPageView } from "@/components/TrackPageView";
import {
  CHALLENGE_LANDING_PATH,
  DIGITAL_GROWTH_AUDIT_PATH,
  FREE_GROWTH_TOOLS_PATH,
  GROWTH_DIAGNOSIS_ENGINE_PATH,
  STRATEGY_CALL_PATH,
} from "@/lib/funnelCtas";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";

export const metadata: Metadata = {
  title: "Free growth starter | Clarity call & snapshot audit | Ascendra Technologies",
  description:
    "Start free with a clarity call, a human-led Digital Growth Snapshot across brand and conversion, or both—know what to fix first before any paid build. Optional tools after.",
};

const VALUE_TRIAL_STEPS = [
  {
    title: "Free clarity call",
    outcome: "Leave with your best next step—even if we’re not a fit.",
    description:
      "A focused conversation on your site, funnel, and goals. You hear how we’d prioritize work and sequence a build so you can judge fit fast—without a generic pitch deck.",
    href: STRATEGY_CALL_PATH,
    cta: "Claim my free call",
    icon: Calendar,
  },
  {
    title: "Digital Growth Snapshot (audit)",
    outcome: "See what’s working, what’s costing leads, and what to fix first.",
    description:
      "Human review across brand clarity, visual trust, and conversion—not an auto checklist. Depth you can act on, so you understand our standard before any high-ticket implementation.",
    href: DIGITAL_GROWTH_AUDIT_PATH,
    cta: "Get my free snapshot",
    icon: Search,
  },
] as const;

export default function FreeTrialPage() {
  return (
    <>
      <PageSEO
        title="Free trial | Ascendra Technologies"
        description="Experience Ascendra’s approach through a call and audit first; self-serve scans and tools are optional follow-ons—not the front door."
        canonicalPath="/free-trial"
      />
      <TrackPageView path="/free-trial" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-10 sm:space-y-12">
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-7 w-7" aria-hidden />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Your free growth starter: clarity, then a real read on your site
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Pick a <span className="text-foreground font-medium">free call</span>, a{" "}
                <span className="text-foreground font-medium">human-led snapshot audit</span>, or both—so you know
                what to fix first and whether we&apos;re the team to build it. No maze of downloads up front; optional
                scans and tools come after you&apos;ve seen how we think.
              </p>
            </section>

            <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
              <CardContent className="p-5 sm:p-6 text-left">
                <h2 className="text-lg font-semibold text-foreground mb-3">Why this is the offer—not another tool list</h2>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 mb-4">
                  <li>Traffic that never turns into qualified conversations.</li>
                  <li>Messaging that sounds fine to you but doesn&apos;t convert strangers.</li>
                  <li>Brand, design, and site pulling in different directions—with no single prioritized plan.</li>
                </ul>
                <p className="text-sm text-foreground font-medium">
                  Free tools add noise until someone helps you rank what matters. Below you get the same front door as our
                  paid clients: conversation and/or a human snapshot—so the outcome is obvious before you invest.
                </p>
              </CardContent>
            </Card>

            <section aria-label="Primary trial: value firsthand">
              <h2 className="text-xl font-semibold text-foreground mb-2 text-center">Choose how you want value first</h2>
              <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto mb-6">
                One or both—each path ends with something concrete: next steps from a call, or prioritized findings from
                an audit. Same front door our paid clients use.
              </p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
                {VALUE_TRIAL_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title}>
                      <Card className="h-full border-primary/25 bg-card shadow-sm ring-1 ring-primary/10">
                        <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {index + 1}
                            </span>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" aria-hidden />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-2">{step.outcome}</p>
                          <p className="text-sm text-muted-foreground flex-1 mb-4">{step.description}</p>
                          <Button asChild className="w-full sm:w-auto gap-2 min-h-[44px] mt-auto">
                            <Link href={step.href} className="inline-flex items-center gap-2">
                              {step.cta}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ol>
              <p className="text-center mt-6">
                <Button asChild variant="outline" className="min-h-[44px] gap-2">
                  <Link href="/services">
                    See high-ticket services &amp; systems
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </p>
            </section>

            <section
              className="rounded-2xl border border-border bg-muted/20 dark:bg-muted/10 p-5 sm:p-8"
              aria-label="Optional self-serve tools after your trial"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2 text-center sm:text-left">
                Optional: self-serve depth later
              </h2>
              <p className="text-sm text-muted-foreground mb-6 text-center sm:text-left max-w-2xl">
                Automated scans and the toolkit are useful—but they work best{" "}
                <span className="text-foreground font-medium">after</span> you&apos;ve seen how we interpret results and
                build a plan. Use these when you want extra signal on your own timeline—not as a substitute for the
                trial above.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-border/80 bg-card">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Sparkles className="h-4 w-4" aria-hidden />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Website growth diagnosis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1 mb-4">
                      Automated crawl and score when you want machine-generated benchmarks—not a replacement for the
                      human audit.
                    </p>
                    <Button asChild variant="secondary" className="w-full sm:w-auto gap-2 min-h-[44px] mt-auto">
                      <Link href={GROWTH_DIAGNOSIS_ENGINE_PATH}>
                        Run diagnosis
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-border/80 bg-card">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" aria-hidden />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Free growth toolkit</h3>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1 mb-4">
                      Calculators, blueprints, and snapshots—helpful add-ons once you already understand how we work.
                    </p>
                    <Button asChild variant="secondary" className="w-full sm:w-auto gap-2 min-h-[44px] mt-auto">
                      <Link href={FREE_GROWTH_TOOLS_PATH}>
                        Browse tools
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            <LeadMagnetRelatedWorkSection leadMagnetKey="free-trial" />

            <Card className="border-border/80 bg-muted/30 dark:bg-muted/15">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Not the same as the 5-day challenge</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  The{" "}
                  <Link href={CHALLENGE_LANDING_PATH} className="font-medium text-primary underline-offset-4 hover:underline">
                    website system challenge
                  </Link>{" "}
                  is a separate, paid guided sprint. This free trial page is for experiencing Ascendra&apos;s advisory
                  and audit value first; the challenge is for buyers who want a structured, paid program.
                </p>
                <Button asChild variant="outline" className="gap-2 min-h-[44px]">
                  <Link href={CHALLENGE_LANDING_PATH}>
                    Learn about the challenge
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
