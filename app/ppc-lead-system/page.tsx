import type { Metadata } from "next";
import Link from "next/link";
import { LineChart, Target, Database, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { PpcLeadMagnetForm } from "@/components/funnel/PpcLeadMagnetForm";
import { RecommendedNextStep } from "@/components/funnel/RecommendedNextStep";
import { InsightsFromEcosystem } from "@/components/authority";
import { getOneInsightForPage } from "@/lib/partnerFounders";
import { TrackPageView } from "@/components/TrackPageView";
import { DIGITAL_GROWTH_AUDIT_PATH, FREE_GROWTH_TOOLS_PATH } from "@/lib/funnelCtas";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";

export const metadata: Metadata = {
  title: "PPC, CRM & Lead Conversion | Consultation for ads, prospecting, and pipeline",
  description:
    "Request a consultation on lead prospecting, CRM built for your process, conversion paths, and paid ad management—Google, Meta, LinkedIn, and more.",
};

const PILLARS = [
  {
    title: "Lead prospecting",
    icon: Target,
    description:
      "Outbound lists, enrichment, and handoffs that don’t die in the inbox. We align how you find and qualify opportunities with how your team actually works.",
  },
  {
    title: "CRM & pipeline",
    icon: Database,
    description:
      "Off-the-shelf tools are fine until they fight your workflow. We design and build CRM-shaped systems—stages, fields, automations—that match how you sell.",
  },
  {
    title: "Conversion & ads",
    icon: Megaphone,
    description:
      "Landing pages, forms, tracking, and ad accounts that tie spend to pipeline. Clear attribution and follow-up so paid traffic turns into booked conversations.",
  },
];

export default function PpcLeadSystemPage() {
  return (
    <>
      <WebPageJsonLd
        title="PPC, CRM & Lead Conversion | Consultation for ads, prospecting, and pipeline"
        description="Lead magnet: prospecting, custom CRM, conversion, and ad management. Share your context—we’ll respond with a clear next step."
        path="/ppc-lead-system"
      />
      <TrackPageView path="/ppc-lead-system" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl marketing-stack">
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LineChart className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Turn ad spend and outbound effort into a pipeline you can run—not a spreadsheet you hope is right.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-0">
                For teams focused on{" "}
                <strong className="text-foreground font-medium">prospecting</strong>, a{" "}
                <strong className="text-foreground font-medium">CRM that fits the business</strong>,{" "}
                <strong className="text-foreground font-medium">conversion</strong>, and{" "}
                <strong className="text-foreground font-medium">paid ads</strong>. Request a short consultation;
                we’ll review your context and suggest practical next steps.
              </p>
              <FunnelHeroMedia
                src="/stock images/Growth_12.jpeg"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">What we help with</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {PILLARS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title} className="border-border bg-card h-full">
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-primary shrink-0" />
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 text-center">How this differs from the growth audit</h2>
              <p className="text-center text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                The{" "}
                <Link
                  href={DIGITAL_GROWTH_AUDIT_PATH}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Digital Growth Audit
                </Link>{" "}
                emphasizes brand, design, and site conversion. This page is for teams who are already buying traffic
                or running outbound and need{" "}
                <span className="text-foreground">pipeline architecture, CRM, and ad operations</span> aligned with
                revenue.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                Request your PPC &amp; lead-system consultation
              </h2>
              <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto mb-6">
                No obligation. We use your answers to prepare for a useful conversation—not to auto-spam you.
              </p>
              <PpcLeadMagnetForm />
            </section>

            <section>
              <InsightsFromEcosystem
                insights={(() => {
                  const one = getOneInsightForPage("ppc-lead-system");
                  return one ? [one] : [];
                })()}
                subtext="One perspective from the ecosystem."
                variant="compact"
                showFoundersLink={true}
              />
            </section>

            <LeadMagnetRelatedWorkSection leadMagnetKey="ppc-lead-system" />

            <section>
              <p className="text-center text-sm text-muted-foreground mb-4">
                More free tools and worksheets live on the{" "}
                <Link href={FREE_GROWTH_TOOLS_PATH} className="font-medium text-primary underline-offset-4 hover:underline">
                  free growth tools
                </Link>{" "}
                hub.
              </p>
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
