import type { Metadata } from "next";
import { PageSEO } from "@/components/SEO";
import { WebsiteScoreCard } from "@/components/funnel/WebsiteScoreCard";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";

export const metadata: Metadata = {
  title: "Website performance score | Free growth tool",
  description:
    "See how your website scores on brand clarity, design experience, performance, conversion, and speed. Request a Digital Growth Audit for a full review.",
};

export default function WebsitePerformanceScorePage() {
  return (
    <>
      <PageSEO
        title="Website performance score | Free growth tool"
        description="See how your website scores on key growth areas. Get a full Digital Growth Audit for a tailored review and next steps."
        canonicalPath="/website-performance-score"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-8">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Website performance score
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-0">
                See how your site stacks up on brand clarity, design, performance, conversion, and speed. A full audit gives you a real score and a clear improvement plan.
              </p>
              <FunnelHeroMedia
                src="/stock images/Web Design_5.jpeg"
                aspect="video"
                maxWidth="3xl"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </section>

            <WebsiteScoreCard />
          </div>
          <div className="mx-auto max-w-4xl mt-12 sm:mt-16">
            <LeadMagnetRelatedWorkSection leadMagnetKey="website-performance-score" />
          </div>
        </div>
      </div>
    </>
  );
}
