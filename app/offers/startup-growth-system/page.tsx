import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, MessageSquare, Map, Layout, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { STRATEGY_CALL_PATH } from "@/lib/funnelCtas";

export const metadata: Metadata = {
  title: "Startup growth system | Affordable audit for founders",
  description:
    "A practical startup growth audit for founders who can't yet afford a full agency build. Website audit, messaging clarity, conversion roadmap, and actionable plan. $249–$399.",
};

const DELIVERABLES = [
  { icon: FileText, title: "Website audit", desc: "Review of your current site: clarity, structure, conversion gaps, and trust signals." },
  { icon: MessageSquare, title: "Messaging clarity suggestions", desc: "Concrete recommendations so your offer and audience are clear and consistent." },
  { icon: Map, title: "Conversion improvement roadmap", desc: "Prioritized steps to improve lead capture and conversion without a full rebuild." },
  { icon: Layout, title: "Page structure blueprint", desc: "A simple blueprint for your homepage (and key pages) so you know what to add or reorder." },
  { icon: ClipboardList, title: "Actionable growth plan", desc: "A written plan you can follow step-by-step or hand to a freelancer or team." },
];

export default function StartupGrowthSystemOfferPage() {
  return (
    <>
      <PageSEO
        title="Startup growth system | Affordable audit for founders"
        description="Practical startup growth audit: website audit, messaging clarity, conversion roadmap, page blueprint, growth plan. $249–$399."
        canonicalPath="/offers/startup-growth-system"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-10 sm:space-y-12">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Startup growth system
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                A practical startup growth audit designed for founders who cannot yet afford a full agency build. Get clarity, a roadmap, and an actionable plan—without the big-ticket price.
              </p>
            </section>

            <section className="rounded-xl border-2 border-primary/20 bg-card p-6 sm:p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Price range
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                $249 – $399
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                One-time audit and deliverable set. No ongoing retainer. You get the plan; you choose how to execute it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                What you get
              </h2>
              <div className="space-y-4">
                {DELIVERABLES.map(({ icon: Icon, title, desc }) => (
                  <Card key={title} className="border-border bg-card">
                    <CardContent className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  No long-term commitment—one deliverable set.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  Clear, written output you can use yourself or hand to a freelancer.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  Focused on what matters most for early-stage growth.
                </li>
              </ul>
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 min-h-[48px]">
                <Link href={STRATEGY_CALL_PATH}>
                  Get startup growth system
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You'll be taken to book a short call. We'll confirm scope and next steps—no pressure.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
