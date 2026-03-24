import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { PageSEO } from "@/components/SEO";
import {
  getBreakdownBySlug,
  WEBSITE_BREAKDOWNS,
} from "@/lib/authorityContent";
import { BreakdownSection, InsightsFromEcosystem } from "@/components/authority";
import { getOneInsightForPage } from "@/lib/partnerFounders";
import { Button } from "@/components/ui/button";
import { AUDIT_PATH } from "@/lib/funnelCtas";
import { Card, CardContent } from "@/components/ui/card";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return WEBSITE_BREAKDOWNS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const breakdown = getBreakdownBySlug(slug);
  if (!breakdown) return { title: "Website breakdown | Ascendra Technologies" };
  return {
    title: `${breakdown.title} | Website breakdown | Ascendra Technologies`,
    description: breakdown.businessContext,
  };
}

export default async function WebsiteBreakdownPage({ params }: Props) {
  const { slug } = await params;
  const breakdown = getBreakdownBySlug(slug);
  if (!breakdown) notFound();

  return (
    <>
      <PageSEO
        title={`${breakdown.title} | Ascendra Technologies`}
        description={breakdown.businessContext}
        canonicalPath={`/website-breakdowns/${breakdown.slug}`}
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10">
            <header className="space-y-4">
              <Link
                href="/website-breakdowns"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
                Website breakdowns
              </Link>
              <p className="text-xs text-muted-foreground">
                {format(new Date(breakdown.publishedAt), "MMMM d, yyyy")}
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                {breakdown.title}
              </h1>
              <p className="text-base text-muted-foreground">
                {breakdown.businessContext}
              </p>
              {breakdown.contextSummary && (
                <p className="text-sm text-muted-foreground">
                  {breakdown.contextSummary}
                </p>
              )}
            </header>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                What works well
              </h2>
              <BreakdownSection
                title=""
                items={breakdown.whatWorksWell}
                variant="positive"
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                What could be improved
              </h2>
              <BreakdownSection
                title=""
                items={breakdown.whatCouldBeImproved}
                variant="improvement"
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Conversion opportunities
              </h2>
              <BreakdownSection
                title=""
                items={breakdown.conversionOpportunities}
                variant="opportunity"
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Quick fix suggestions
              </h2>
              <BreakdownSection
                title=""
                items={breakdown.quickFixSuggestions}
                variant="default"
              />
            </section>

            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Want a breakdown of your own site?
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Our Digital Growth Audit reviews your brand clarity, visual presentation, and website performance—then gives you clear next steps.
                </p>
                <Button asChild className="gap-2 min-h-[44px]">
                  <Link href={AUDIT_PATH}>
                    Request Digital Growth Audit
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <section className="pt-8 border-t border-border">
              <InsightsFromEcosystem
                insights={(() => {
                const one = getOneInsightForPage(`breakdown-${slug}`);
                return one ? [one] : [];
              })()}
                subtext="One perspective from the ecosystem."
                variant="compact"
                showFoundersLink={true}
              />
            </section>

            <footer className="pt-6 border-t border-border">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/website-breakdowns">
                  All breakdowns
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
