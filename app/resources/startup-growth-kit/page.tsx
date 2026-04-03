import type { Metadata } from "next";
import {
  BookOpen,
  AlertCircle,
  Layers,
  Cpu,
  Map,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { getFunnelContent } from "@/lib/funnelContent.server";
import { parseFunnelConversionSettings } from "@shared/funnelConversionSettings";
import { growthKitNextStepCtas } from "@/lib/funnelConversionCtas";
import { ASCENDRA_VIDEO } from "@/lib/ascendraMedia";
import { AscendraPromoVideo } from "@/components/media/AscendraPromoVideo";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_STARTUP_KIT } from "@/lib/landingPageOutcomeFramework";
import { LeadMagnetUrgencyZone } from "@/components/urgency-conversion/LeadMagnetUrgencyZone";
import { GrowthKitNextStepsClient } from "@/components/funnel/GrowthKitNextStepsClient";

export const metadata: Metadata = {
  title: "Startup growth kit | Where to begin building your business online",
  description:
    "A practical guide for new business owners: why most startup websites fail, assets vs systems, how AI fits in, the 4 layers of online growth, and a simple roadmap—even on a tight budget.",
};

const FOUR_LAYERS = [
  {
    icon: Layers,
    title: "Clarity",
    desc: "Your offer, audience, and message must be clear before anything else. Confusion here undermines every other layer.",
  },
  {
    icon: BookOpen,
    title: "Presentation",
    desc: "How you look and communicate—brand, design, copy. This builds trust and helps visitors take you seriously.",
  },
  {
    icon: Cpu,
    title: "Systems",
    desc: "Your website, lead capture, and conversion path. The machinery that turns visitors into leads and customers.",
  },
  {
    icon: Map,
    title: "Traffic & iteration",
    desc: "Getting the right people to your site and improving based on what works. Growth compounds when the first three layers are solid.",
  },
];

export default async function StartupGrowthKitPage() {
  const stored = await getFunnelContent("growth-kit");
  const storedObj =
    stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {};
  const { accessModel } = parseFunnelConversionSettings(storedObj);
  const nextStepCtas = growthKitNextStepCtas(accessModel);
  const heroTitle: string =
    (stored && typeof stored === "object" && typeof (stored as Record<string, unknown>).heroTitle === "string")
      ? (stored as Record<string, unknown>).heroTitle as string
      : "Where to begin when building a business online";
  const heroSubtitle: string =
    (stored && typeof stored === "object" && typeof (stored as Record<string, unknown>).heroSubtitle === "string")
      ? (stored as Record<string, unknown>).heroSubtitle as string
      : "A practical guide for new business owners with little or no budget. Learn why most startup websites fail, what to build first, and how to grow without a full agency.";

  return (
    <>
      <WebPageJsonLd
        title="Startup growth kit | Where to begin building your business online"
        description="Educational guide for founders: why startup sites fail, assets vs systems, the 4 layers of online growth, and a simple roadmap."
        path="/resources/startup-growth-kit"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl marketing-stack">
            <section className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-7 w-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                {heroTitle}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-0">
                {heroSubtitle}
              </p>
              <FunnelHeroMedia
                src="/stock images/Web Design_4.jpeg"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </section>

            <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_STARTUP_KIT} className="py-6 sm:py-8" />

            <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
              <LeadMagnetUrgencyZone surfaceKey="startup-growth-kit" />
            </div>

            {/* Why most startup websites fail */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Why most startup websites fail
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Startups often jump straight to building a site or buying templates before clarifying who they serve and what they offer. The result: a site that looks fine but doesn’t convert, or that tries to do too much and confuses visitors. The fix isn’t more features—it’s clarity first, then a simple structure that turns visitors into leads.
              </p>
            </section>

            {/* Assets vs systems */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Assets vs systems
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                An <strong className="text-foreground">asset</strong> is a single deliverable: a logo, a landing page, a PDF. A <strong className="text-foreground">system</strong> is how those pieces work together to attract, convert, and follow up. Startups often collect assets (templates, AI-generated copy, stock visuals) without a system. You need both, but the system—clear offer, one primary CTA, lead capture, and a next step—should drive what assets you create.
              </p>
            </section>

            {/* AI and templates */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                How AI tools and templates fit in
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                AI and templates can speed up execution, but they work best when you’ve already decided on your message, audience, and conversion path. Use them to draft copy, suggest structures, or generate ideas—then edit for clarity and consistency. They don’t replace the work of knowing what you offer and who it’s for; they support it.
              </p>
            </section>

            <section aria-label="Ascendra tips for founders">
              <h2 className="text-xl font-semibold text-foreground mb-2 text-center">Video tips</h2>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-xl mx-auto">
                A short walkthrough of ideas that pair well with this guide—watch before you build.
              </p>
              <AscendraPromoVideo
                src={ASCENDRA_VIDEO.tips}
                ariaLabel="Ascendra tips video for startups"
                objectFit="cover"
                maxWidthClassName="max-w-5xl"
                playback="clickToPlay"
              />
            </section>

            {/* 4 layers */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                The 4 layers of online growth
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Growth online rests on four layers. Build from the bottom up; skipping layers leads to wasted effort.
              </p>
              <div className="space-y-3">
                {FOUR_LAYERS.map(({ icon: Icon, title, desc }) => (
                  <Card key={title} className="border-border bg-card">
                    <CardContent className="px-5 py-5 sm:px-7 sm:py-6 flex gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Simple growth roadmap */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                A simple growth roadmap
              </h2>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">1.</span>
                  Clarify your offer and who it’s for (one sentence).
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">2.</span>
                  Structure your homepage: hero message, trust, problem/solution, one clear CTA.
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">3.</span>
                  Capture leads with a simple form and one primary next step.
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">4.</span>
                  Improve trust (proof, credentials, clarity) and conversion (fewer distractions, clearer CTA).
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">5.</span>
                  Then focus on traffic and iteration—with a system that can receive and convert it.
                </li>
              </ol>
            </section>

            <LeadMagnetRelatedWorkSection leadMagnetKey="startup-growth-kit" />

            {/* Next steps */}
            <section>
              <Card className="border-primary/20 bg-card">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Your next steps
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    See how your current site stacks up, then get a practical action plan—without spending a fortune.
                  </p>
                  <GrowthKitNextStepsClient ctas={nextStepCtas} />
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
