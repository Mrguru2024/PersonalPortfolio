import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrackPageView } from "@/components/TrackPageView";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import OfferValuationTool from "@/components/offer-valuation";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offer audit | Find why your offer is not converting",
  description:
    "Score your offer with the 100M value equation and unlock practical fixes, upgrades, and strategy direction.",
};

export default function OfferAuditPage() {
  return (
    <>
      <TrackPageView path="/offer-audit" />
      <WebPageJsonLd
        title="Offer audit | Find why your offer is not converting"
        description="Run a free offer audit, unlock your full diagnosis, and map strategic fixes."
        path="/offer-audit"
      />
      <div className="w-full min-w-0 max-w-full marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl space-y-5">
          <section className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Find out why your offer is not converting
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Run a fast valuation, see your score, and unlock a full breakdown with
              strategic fixes tailored to your weakest variables.
            </p>
          </section>

          <OfferValuationTool surface="public" />

          <section className="text-center rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Need direct help improving your offer and funnel?
            </p>
            <Button asChild>
              <Link href="/strategy-call">
                Fix your offer with Ascendra
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}

