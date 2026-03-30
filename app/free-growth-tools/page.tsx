import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Signpost } from "lucide-react";
import { TrackPageView } from "@/components/TrackPageView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { DIAGNOSTICS_HUB_PATH } from "@/lib/funnelCtas";
import { FreeLeadPrioritySection } from "@/components/conversion/FreeLeadPrioritySection";
import { FreeToolsQualifiedLeadCard } from "@/components/conversion/FreeToolsQualifiedLeadCard";
import { FreeGrowthToolsMoreToolsGrid } from "@/components/conversion/FreeGrowthToolsMoreToolsGrid";
import { ASCENDRA_VIDEO } from "@/lib/ascendraMedia";
import { AscendraPromoVideo } from "@/components/media/AscendraPromoVideo";
import { MemberFreeDownloads } from "@/components/MemberFreeDownloads";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_FREE_TOOLS } from "@/lib/landingPageOutcomeFramework";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Free growth tools | Ascendra Technologies",
  description:
    "Free tools with CRM-qualified follow-up: share your goal and timeline, then use diagnosis, calculators, blueprints, and more. Brand, web, and marketing in one ecosystem.",
  path: "/free-growth-tools",
  keywords: ["free tools", "growth tools", "website calculator", "audit"],
});

export default function FreeGrowthToolsPage() {
  return (
    <>
      <TrackPageView path="/free-growth-tools" />
      <WebPageJsonLd
        title="Free growth tools | Ascendra Technologies"
        description="Free tools with a short qualification for qualified CRM follow-up—then diagnosis, calculators, blueprints, and more."
        path="/free-growth-tools"
        schemaType="CollectionPage"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl marketing-stack">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Free growth tools
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
                Practical resources to help you see where your business stands and what to do next. From the Brand Growth ecosystem—strategy, design, and technology in one place.
              </p>
              <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_FREE_TOOLS} className="pb-8 text-left" />
              <Card className="max-w-2xl mx-auto mb-8 border-primary/20 bg-primary/5 dark:bg-primary/10">
                <CardContent className="px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Signpost className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-foreground">Not sure which diagnosis to use?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compare the automated scan, questionnaire, and full assessment on one page.
                    </p>
                  </div>
                  <Button asChild variant="secondary" className="shrink-0 w-full sm:w-auto">
                    <Link href={DIAGNOSTICS_HUB_PATH}>
                      Choose your path
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <div className="max-w-4xl mx-auto mb-10 sm:mb-12 space-y-6">
                <FreeToolsQualifiedLeadCard />
                <FreeLeadPrioritySection
                  toolkitHashOnThisPage
                  pageVisited="/free-growth-tools"
                />
              </div>
              {/* Hero visual: contained, professional focal point */}
              <FunnelHeroMedia
                src="/stock images/Growth_10.jpeg"
                sizes="(max-width: 768px) 100vw, 672px"
                spacing="none"
                priority
                gradientClassName="from-background/80 via-transparent to-transparent"
              />
            </section>

            <section className="text-center" aria-label="Ascendra growth tips video">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Quick tips from Ascendra</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
                Short, practical guidance before you dive into the tools below.
              </p>
              <AscendraPromoVideo
                src={ASCENDRA_VIDEO.tips}
                ariaLabel="Ascendra tips video"
                objectFit="cover"
                maxWidthClassName="max-w-5xl"
                playback="clickToPlay"
              />
            </section>

            <FreeGrowthToolsMoreToolsGrid />

            <MemberFreeDownloads className="shadow-sm" />

            <LeadMagnetRelatedWorkSection leadMagnetKey="free-growth-tools" />

            <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                Not sure where to start? Use the{" "}
                <Link href="#all-tools" className="font-medium text-primary hover:underline">
                  priority order at the top
                </Link>
                —free trial first (call + audit), then audit, diagnosis, and toolkit for extra depth. Or go straight to the{" "}
                <Link href="/digital-growth-audit" className="font-medium text-primary hover:underline">
                  Digital Growth Audit
                </Link>
                .
              </p>
              <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                <Link href="/contact">Book a free call</Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
