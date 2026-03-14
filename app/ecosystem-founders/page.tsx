import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { FOUNDERS, getFounderImageUrl } from "@/lib/partnerFounders";
import { AUDIT_PATH } from "@/lib/funnelCtas";

export const metadata: Metadata = {
  title: "Ecosystem founders | Ascendra Technologies",
  description:
    "Meet the founders behind the Ascendra ecosystem: strategy (Style Studio Branding), design (Macon Designs®), and technology (Ascendra Technologies). One coordinated team for brand and growth.",
};

const DISCIPLINE_LABEL: Record<string, string> = {
  strategy: "Strategy",
  design: "Design",
  technology: "Technology",
};

export default function EcosystemFoundersPage() {
  return (
    <>
      <PageSEO
        title="Ecosystem founders | Ascendra Technologies"
        description="Meet the founders behind the Ascendra ecosystem: strategy, design, and technology working together for your brand and growth."
        canonicalPath="/ecosystem-founders"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-12 sm:space-y-16">
            {/* Introduction */}
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Built by specialists in strategy, design, and technology
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                The Ascendra ecosystem brings together three disciplines that most businesses need to grow: brand strategy and messaging, visual design and presentation, and technology and conversion systems. Each is led by an experienced founder who focuses on that area every day.
              </p>
            </section>

            {/* Founder profiles */}
            <section className="space-y-12 sm:space-y-16">
              {FOUNDERS.map((founder) => {
                const imageUrl = getFounderImageUrl(founder);
                const isExternal = imageUrl.startsWith("http");
                return (
                  <Card key={founder.slug} className="border-border bg-card overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-6 p-5 sm:p-6">
                        <div className="relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-xl overflow-hidden bg-muted">
                          {imageUrl ? (
                            isExternal ? (
                              <img
                                src={imageUrl}
                                alt={founder.imageAlt ?? founder.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Image
                                src={imageUrl}
                                alt={founder.imageAlt ?? founder.name}
                                fill
                                className={founder.useLogo ? "object-contain p-3" : "object-cover"}
                                sizes="144px"
                              />
                            )
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                              {founder.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                            {DISCIPLINE_LABEL[founder.discipline] ?? founder.discipline}
                          </p>
                          <h2 className="mt-1 text-xl sm:text-2xl font-bold text-foreground">
                            {founder.name}
                          </h2>
                          <Link
                            href={founder.companyHref}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {founder.company}
                          </Link>
                          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                            {founder.intro}
                          </p>
                          <p className="mt-3 text-sm text-muted-foreground">
                            <strong className="text-foreground">In the ecosystem:</strong>{" "}
                            {founder.roleInEcosystem}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            {founder.perspective}
                          </p>
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {founder.focus.map((item) => (
                              <li
                                key={item}
                                className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                          <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5">
                            <Link href={founder.companyHref}>
                              Visit {founder.company}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {/* Collaboration */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                How the three disciplines work together
              </h2>
              <Card className="border-border bg-card">
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-3 text-sm sm:text-base text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Strategy</strong> clarifies who you serve and what you're known for. That clarity guides every message and design decision.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Design</strong> turns that strategy into a visual identity and presentation that builds trust and looks professional.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Technology</strong> delivers the website and systems that capture leads, run smoothly, and support your growth.</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>When all three are aligned, you get a coherent brand, a credible presence, and a site that converts—without the chaos of juggling separate vendors.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* CTA */}
            <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Ready to see how we can help?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
                Start with a Digital Growth Audit for a clear view of your brand, design, and conversion opportunities.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild className="min-h-[44px]">
                  <Link href={AUDIT_PATH}>
                    Request Digital Growth Audit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/brand-growth">Brand Growth hub</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
