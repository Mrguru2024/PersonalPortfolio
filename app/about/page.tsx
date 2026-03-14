import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ECOSYSTEM_PILLARS, POSITIONING_STATEMENT } from "@/lib/funnel-content";

export const metadata: Metadata = {
  title: "About the Ecosystem | Ascendra Technologies",
  description:
    "Learn how Ascendra Technologies, Macon Designs®, and Style Studio Branding work together as one coordinated growth ecosystem.",
};

const collaborationSteps = [
  "We align on business goals and current bottlenecks.",
  "We diagnose positioning, visual trust, and conversion structure.",
  "We assign the right delivery mix across strategy, design, and technology.",
  "We execute in coordinated phases with clear next-step priorities.",
];

export default function AboutPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-10 sm:space-y-12">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
              One ecosystem. Three specialized partners.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {POSITIONING_STATEMENT}
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <Card key={pillar.name} className="border-border bg-card h-full overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  {pillar.logo ? (
                    <div className="relative h-12 sm:h-14 w-full max-w-[180px] mb-4">
                      <Image
                        src={pillar.logo}
                        alt={pillar.name}
                        fill
                        className={`object-contain object-left ${pillar.logoDark ? "dark:hidden" : ""}`}
                        sizes="180px"
                      />
                      {pillar.logoDark ? (
                        <Image
                          src={pillar.logoDark}
                          alt={pillar.name}
                          fill
                          className="object-contain object-left hidden dark:block"
                          sizes="180px"
                        />
                      ) : null}
                    </div>
                  ) : null}
                  <h2 className="text-xl font-semibold text-foreground">
                    {pillar.name}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-primary">
                    {pillar.role}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {pillar.summary}
                  </p>
                  {pillar.href ? (
                    <Link
                      href={pillar.href}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">
              Why the ecosystem model works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Most businesses do not need random tactics. They need strategy,
              presentation, and execution to work together. That is what this
              model is designed to do.
            </p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
              {collaborationSteps.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">
              Start with clarity, then scale delivery.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              A free audit is the fastest way to see your strongest next move.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild className="min-h-[44px]">
                <Link href="/digital-growth-audit">
                  Request your free audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/ecosystem-founders">Meet the founders</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/services">See how we can help</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
