import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { PageSEO } from "@/components/SEO";
import { getAllBreakdowns } from "@/lib/authorityContent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AUDIT_PATH } from "@/lib/funnelCtas";
import { FileSearch, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Website breakdowns | Ascendra Technologies",
  description:
    "Real business website breakdowns: what works, what could be improved, and conversion opportunities. Learn from real examples—then get a breakdown of your own site.",
};

export default function WebsiteBreakdownsPage() {
  const breakdowns = getAllBreakdowns();

  return (
    <>
      <PageSEO
        title="Website breakdowns | Ascendra Technologies"
        description="Real business website breakdowns: what works, what could be improved, and conversion opportunities. Request a Digital Growth Audit for your own site."
        canonicalPath="/website-breakdowns"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl marketing-stack">
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileSearch className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Website breakdowns
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                We analyze real business websites and explain what works, what could be improved, and where the conversion opportunities are. No fluff—practical takeaways you can use.
              </p>
              <Button asChild size="lg" className="min-h-[44px]">
                <Link href={AUDIT_PATH}>
                  Want a breakdown of your own site?
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">
                Recent breakdowns
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {breakdowns.map((b) => (
                  <Card key={b.slug} className="border-border bg-card">
                    <CardContent className="p-5 sm:p-6">
                      <p className="text-xs text-muted-foreground mb-1">
                        {format(new Date(b.publishedAt), "MMM d, yyyy")}
                      </p>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        <Link
                          href={`/website-breakdowns/${b.slug}`}
                          className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                        >
                          {b.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {b.businessContext}
                      </p>
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href={`/website-breakdowns/${b.slug}`}>
                          Read breakdown
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {breakdowns.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  More breakdowns coming soon. Request a{" "}
                  <Link href={AUDIT_PATH} className="text-primary hover:underline">
                    Digital Growth Audit
                  </Link>{" "}
                  to get a tailored review of your site.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-5 sm:p-6 text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Want a breakdown of your own site?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
                Our Digital Growth Audit reviews your brand clarity, visual presentation, and website performance—and gives you clear next steps.
              </p>
              <Button asChild className="min-h-[44px]">
                <Link href={AUDIT_PATH}>Request Digital Growth Audit</Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
