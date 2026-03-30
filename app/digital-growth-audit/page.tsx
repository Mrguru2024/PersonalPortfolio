import type { Metadata } from "next";
import Link from "next/link";
import { Search, MessageSquare, Palette, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { AuditRequestForm } from "@/components/funnel/AuditRequestForm";
import { RecommendedNextStep } from "@/components/funnel/RecommendedNextStep";
import { InsightsFromEcosystem } from "@/components/authority";
import { getOneInsightForPage } from "@/lib/partnerFounders";
import { TrackPageView } from "@/components/TrackPageView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { FREE_TRIAL_PATH, GROWTH_DIAGNOSIS_ENGINE_PATH } from "@/lib/funnelCtas";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_DIGITAL_AUDIT } from "@/lib/landingPageOutcomeFramework";
import { WhatToExpectList } from "@/components/marketing/EmbeddedAssurance";
import {
  WHAT_TO_EXPECT_AUDIT_ITEMS,
  WHAT_TO_EXPECT_AUDIT_TITLE,
} from "@/lib/embeddedAssuranceCopy";

export const metadata: Metadata = {
  title: "Digital Growth Audit | Find out why your website isn't generating customers",
  description:
    "Get a Digital Growth Audit reviewing your brand, design, and website performance. Brand clarity (Style Studio), visual experience (Macon Designs), conversion (Ascendra).",
};

const AUDIT_INCLUDES = [
  {
    title: "Brand clarity review",
    partner: "Style Studio Branding",
    icon: MessageSquare,
    description:
      "How clear is your positioning and messaging? We look at whether visitors quickly understand what you do, who it's for, and why you're the right choice. Messaging that's vague or generic costs trust and conversions.",
  },
  {
    title: "Visual experience review",
    partner: "Macon Designs®",
    icon: Palette,
    description:
      "Does your site look credible and current? We review visual consistency, hierarchy, and first impression. Dated or inconsistent design undermines trust; strong presentation supports it.",
  },
  {
    title: "Website conversion review",
    partner: "Ascendra Technologies",
    icon: Layout,
    description:
      "Is your site built to capture leads? We look at structure, CTAs, lead path, and friction. Many sites get traffic but lack a clear next step or make it hard to take action.",
  },
];

export default function DigitalGrowthAuditPage() {
  return (
    <>
      <WebPageJsonLd
        title="Digital Growth Audit | Find out why your website isn't generating customers"
        description="Get a Digital Growth Audit reviewing your brand, design, and website performance. One coordinated ecosystem—Style Studio, Macon Designs, Ascendra."
        path="/digital-growth-audit"
      />
      <TrackPageView path="/digital-growth-audit" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl marketing-stack">
            {/* Hero */}
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Find out why your website may not be generating the customers it should.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-0">
                Our Digital Growth Audit reviews your brand clarity, visual presentation, and website performance to uncover opportunities for improvement.
              </p>
              <FunnelHeroMedia
                src="/stock images/Digital_18.jpeg"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </section>

            <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_DIGITAL_AUDIT} className="py-6 sm:py-8" />

            {/* What the audit reviews */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                What the audit reviews
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {AUDIT_INCLUDES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title} className="border-border bg-card h-full">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-primary shrink-0" />
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                        </div>
                        <p className="text-xs font-medium text-primary mb-2">{item.partner}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* What you'll receive */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 text-center">
                What you'll receive
              </h2>
              <ul className="text-center text-sm sm:text-base text-muted-foreground max-w-xl mx-auto space-y-2">
                <li>• Growth insights across brand, design, and conversion</li>
                <li>• Opportunities for improvement with clear priorities</li>
                <li>• Recommended next steps tailored to your situation</li>
              </ul>
            </section>

            {/* Qualification form — human-led audit (not the automated URL crawler) */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                Request Your Digital Growth Audit
              </h2>
              <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
                Share a few details so we can prioritize the review. You get a human-led read across brand clarity,
                presentation, and conversion—not an auto-generated fluff report.
              </p>
              <WhatToExpectList
                title={WHAT_TO_EXPECT_AUDIT_TITLE}
                items={WHAT_TO_EXPECT_AUDIT_ITEMS}
                compact
                className="max-w-xl mx-auto mb-6"
              />
              <Alert className="max-w-2xl mx-auto mb-6 border-primary/25 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm">Different from the instant website scan</AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground">
                  This form is for the{" "}
                  <strong className="text-foreground">Digital Growth Audit</strong>—a human-led review across
                  brand, design, and conversion. For an{" "}
                  <strong className="text-foreground">automated URL diagnosis</strong> (crawl, SEO, imagery, and
                  rule-based findings), use{" "}
                  <Link href={GROWTH_DIAGNOSIS_ENGINE_PATH} className="font-medium text-primary underline-offset-4 hover:underline">
                    Website Growth Diagnosis
                  </Link>
                  .
                </AlertDescription>
              </Alert>
              <p className="text-center text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mb-6">
                New here? The{" "}
                <Link href={FREE_TRIAL_PATH} className="font-medium text-primary underline-offset-4 hover:underline">
                  free trial
                </Link>{" "}
                path walks call + audit before digging into self-serve tools—same ecosystem, clearer sequence.
              </p>
              <AuditRequestForm />
            </section>

            {/* Insights from the Ecosystem */}
            <section>
              <InsightsFromEcosystem
                insights={(() => {
                  const one = getOneInsightForPage("digital-growth-audit");
                  return one ? [one] : [];
                })()}
                subtext="One perspective from the ecosystem."
                variant="compact"
                showFoundersLink={true}
              />
            </section>

            <LeadMagnetRelatedWorkSection leadMagnetKey="digital-growth-audit" />

            {/* Bridge to paid offers */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Recommended next step</h2>
              <RecommendedNextStep
                offerSlug="business-growth"
                ctaText="See growth systems"
                ctaHref="/services"
                secondaryCtaText="Book a call"
                secondaryCtaHref="/strategy-call"
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
