import type { Metadata } from "next";
import Link from "next/link";
import { Search, MessageSquare, Palette, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { AuditRequestForm } from "@/components/funnel/AuditRequestForm";
import { RecommendedNextStep } from "@/components/funnel/RecommendedNextStep";
import { InsightsFromEcosystem } from "@/components/authority";
import { getOneInsightForPage } from "@/lib/partnerFounders";

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
      <PageSEO
        title="Digital Growth Audit | Find out why your website isn't generating customers"
        description="Get a Digital Growth Audit reviewing your brand, design, and website performance. One coordinated ecosystem—Style Studio, Macon Designs, Ascendra."
        canonicalPath="/digital-growth-audit"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-10 sm:space-y-12">
            {/* Hero */}
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Find out why your website may not be generating the customers it should.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Our Digital Growth Audit reviews your brand clarity, visual presentation, and website performance to uncover opportunities for improvement.
              </p>
            </section>

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

            {/* Qualification form */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                Request Your Digital Growth Audit
              </h2>
              <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto mb-6">
                Share a few details. We'll review your brand, design, and website and send you clear next steps.
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
