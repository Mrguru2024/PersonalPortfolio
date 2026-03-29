import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Layout, Mail, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import {
  STARTUP_GROWTH_KIT_PATH,
  STARTUP_WEBSITE_SCORE_PATH,
  REVENUE_CALCULATOR_PATH,
  STARTUP_GROWTH_SYSTEM_OFFER_PATH,
} from "@/lib/funnelCtas";
import { ASCENDRA_VIDEO } from "@/lib/ascendraMedia";
import { AscendraPromoVideo } from "@/components/media/AscendraPromoVideo";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";

export const metadata: Metadata = {
  title: "Startup action plan | Practical steps to improve your online presence",
  description:
    "Five practical steps for founders: clarify your offer, structure your homepage, capture leads, improve trust, and improve conversions. Get a Startup Growth System audit.",
};

const STEPS = [
  {
    icon: Target,
    title: "Clarify your offer",
    body: "Write one sentence that says who you help and what outcome you deliver. Use it everywhere: hero, meta description, and sales conversations. If you can't say it simply, visitors won't figure it out.",
  },
  {
    icon: Layout,
    title: "Structure your homepage",
    body: "Follow a clear flow: hero (offer + one CTA), trust (proof or credentials), problem/solution, and a final CTA. Remove competing messages. One primary action per section.",
  },
  {
    icon: Mail,
    title: "Capture leads",
    body: "Add one simple way for visitors to take the next step: email signup, contact form, or booking link. Make it visible and low-friction. One form above the fold is better than five scattered options.",
  },
  {
    icon: Shield,
    title: "Improve trust",
    body: "Add proof: testimonials, case results, credentials, or a clear \"why us.\" Trust signals near the top and near the CTA convert better. Even one or two strong signals help.",
  },
  {
    icon: TrendingUp,
    title: "Improve conversions",
    body: "Reduce distractions: fewer links, one clear CTA, and a path that leads to one next step. Test on mobile. Small changes (button text, placement, clarity) often have a big impact.",
  },
];

export default function StartupActionPlanPage() {
  return (
    <>
      <WebPageJsonLd
        title="Startup action plan | Practical steps to improve your online presence"
        description="Five steps for founders: clarify offer, structure homepage, capture leads, build trust, improve conversions."
        path="/resources/startup-action-plan"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-3xl marketing-stack">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Startup action plan
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-0">
                Practical steps to improve your online presence—without a full agency build. Work through these in order for the best results.
              </p>
              <FunnelHeroMedia
                src="/stock images/Digital_18.jpeg"
                aspect="video"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </section>

            <section className="text-center" aria-label="Ascendra tips video">
              <h2 className="text-xl font-semibold text-foreground mb-2">Watch: quick tips</h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
                Short guidance that lines up with the steps below—play before you work through the list.
              </p>
              <AscendraPromoVideo
                src={ASCENDRA_VIDEO.tips}
                ariaLabel="Ascendra tips video"
                objectFit="cover"
                maxWidthClassName="max-w-5xl"
                playback="clickToPlay"
              />
            </section>

            <section className="space-y-6">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <Card key={title} className="border-border bg-card">
                  <CardContent className="px-6 py-5 sm:px-8 sm:py-7 flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground mb-2">
                        {i + 1}. {title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            <LeadMagnetRelatedWorkSection leadMagnetKey="startup-action-plan" />

            <section className="rounded-xl border border-primary/20 bg-card p-5 sm:p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Want a tailored audit and roadmap?
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
                The Startup Growth System is a practical audit for founders who can't yet afford a full agency build. You get a website audit, messaging clarity suggestions, conversion roadmap, page structure blueprint, and an actionable growth plan.
              </p>
              <Button asChild className="gap-2 min-h-[44px]">
                <Link href={STARTUP_GROWTH_SYSTEM_OFFER_PATH}>
                  Get startup growth system
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </section>

            <section className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={STARTUP_GROWTH_KIT_PATH}>Startup growth kit</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={STARTUP_WEBSITE_SCORE_PATH}>Website score tool</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={REVENUE_CALCULATOR_PATH}>Revenue calculator</Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
