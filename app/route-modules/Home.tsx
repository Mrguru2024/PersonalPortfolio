"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/sections/HeroSection";
import {
  ECOSYSTEM_PILLARS,
  PREMIUM_OFFERS,
  FUNNEL_STORY_STEPS,
} from "@/lib/funnel-content";
import { projects } from "@/lib/data";
import { FREE_TRIAL_PATH, PERSONA_JOURNEY_PATH } from "@/lib/funnelCtas";
import { PersonaJourneySelector } from "@/components/persona-journey/PersonaJourneySelector";
import type { PersonaJourneyId } from "@shared/personaJourneys";
import { getLatestBlogPostsForBusiness } from "@/lib/blogSeedData";
import { getOneInsightPerFounder } from "@/lib/partnerFounders";
import {
  SectionReveal,
  SectionRevealStagger,
  SectionRevealItem,
  SpotlightCard,
  AnimatedCard,
  MagneticButton,
  BeforeAfterToggle,
  SectionConnector,
  StatsStrip,
} from "@/components/motion";
import { OutcomeLandingFramework } from "@/components/marketing/OutcomeLandingFramework";
import { OUTCOME_FRAMEWORK_COPY_HOME } from "@/lib/landingPageOutcomeFramework";
import { ASCENDRA_VIDEO } from "@/lib/ascendraMedia";

const AscendraPromoVideo = dynamic(
  () => import("@/components/media/AscendraPromoVideo").then((m) => ({ default: m.AscendraPromoVideo })),
  {
    loading: () => (
      <div className="mx-auto max-w-5xl w-full aspect-video rounded-2xl bg-muted/40 animate-pulse" aria-hidden />
    ),
  },
);

const StickyStorySection = dynamic(
  () => import("@/components/motion/StickyStorySection").then((m) => ({ default: m.StickyStorySection })),
  {
    loading: () => (
      <div className="min-h-[240px] max-w-5xl mx-auto rounded-xl bg-muted/30 animate-pulse" aria-hidden />
    ),
  },
);

const ProcessExplorer = dynamic(
  () => import("@/components/motion/ProcessExplorer").then((m) => ({ default: m.ProcessExplorer })),
  {
    loading: () => (
      <div className="min-h-[200px] max-w-5xl mx-auto rounded-xl bg-muted/30 animate-pulse" aria-hidden />
    ),
  },
);

const InsightsFromEcosystem = dynamic(
  () => import("@/components/authority/InsightsFromEcosystem").then((m) => ({ default: m.InsightsFromEcosystem })),
  {
    loading: () => (
      <div className="min-h-[180px] max-w-5xl mx-auto rounded-xl bg-muted/30 animate-pulse" aria-hidden />
    ),
  },
);

const processStepItems = [
  {
    id: "diagnose",
    title: "Diagnose",
    description:
      "We diagnose the current bottleneck across strategy, design, and website conversion so you know exactly where to focus.",
  },
  {
    id: "define",
    title: "Define",
    description:
      "We define the right offer path and implementation scope for your stage so effort goes to the highest-impact work.",
  },
  {
    id: "execute",
    title: "Execute",
    description:
      "We execute in clear phases with measurable next-step priorities so you see progress and stay aligned.",
  },
];

const trustHighlights = [
  "Conversion-focused website and funnel execution",
  "Cross-functional strategy, design, and implementation support",
  "Practical delivery model for businesses starting lean",
];

const problemListItems = [
  "Unclear messaging—visitors can't tell what you do or who it's for.",
  "Weak presentation—dated or inconsistent design undermines trust.",
  "Confusing navigation—people leave before they find what matters.",
  "No lead capture system—traffic comes in but nothing converts.",
  "Outdated design—your site looks behind the times and loses credibility.",
  "Lack of trust signals—no proof, credentials, or clear next step.",
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-stack pb-12 sm:pb-16 md:pb-20">
      <HeroSection />
      <section className="container mx-auto px-3 fold:px-4 sm:px-6 pb-6 sm:pb-10" aria-label="Outcomes and value">
        <SectionReveal className="mx-auto max-w-5xl">
          <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_HOME} id="outcome-framework" />
        </SectionReveal>
      </section>
      {/* Business Launch Promo — committed under public/Video Content_Ascendra_Files */}
      <section id="see-ascendra" className="container mx-auto px-3 fold:px-4 sm:px-6" aria-label="See Ascendra in action">
        <SectionReveal className="mx-auto max-w-5xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">See Ascendra in action</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
              Brand, design, and technology—one coordinated ecosystem for growth.
            </p>
          </div>
          <AscendraPromoVideo
            src={ASCENDRA_VIDEO.businessLaunchPromo}
            ariaLabel="Ascendra Business Launch promo"
            objectFit="cover"
            maxWidthClassName="max-w-5xl"
          />
        </SectionReveal>
      </section>
      <section
        id="persona-journey"
        className="container mx-auto px-3 fold:px-4 sm:px-6"
        aria-label="Find your growth path"
      >
        <SectionReveal className="mx-auto max-w-5xl marketing-stack-tight">
          <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
              Find your growth path
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              What best describes your business? We&apos;ll match you to lead systems, conversion paths, and automation
              — not a one-size-fits-all pitch.
            </p>
            <p className="text-xs text-muted-foreground">
              <Link
                href={PERSONA_JOURNEY_PATH}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Open full journey page
              </Link>
            </p>
          </div>
          <PersonaJourneySelector
            variant="compact"
            pageVisited="/"
            onSelect={(id: PersonaJourneyId) => router.push(`/journey?journey=${encodeURIComponent(id)}`)}
          />
        </SectionReveal>
      </section>
      <SectionConnector variant="gradient" />
      {/* Growth Diagnosis funnel hero — high-conversion CTA */}
      <section id="growth-diagnosis" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-background p-8 sm:p-10 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-5 md:mb-6">
              Discover What&apos;s Slowing Your Business Growth
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Get a personalized diagnosis across your brand, website, and lead system.
            </p>
            <MagneticButton>
              <Button asChild size="lg" className="gap-2 min-h-[48px] bg-primary text-primary-foreground">
                <Link href="/diagnosis">
                  Run Growth Diagnosis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </MagneticButton>
            <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
              Want a value-first trial (how we work—not just more free files)?{" "}
              <Link href={FREE_TRIAL_PATH} className="font-medium text-primary underline-offset-4 hover:underline">
                Start the free trial
              </Link>
              .
            </p>
          </div>
        </SectionReveal>
      </section>
      <SectionConnector variant="gradient" />

      {/* Problem: why most businesses don't convert; disconnect brand / design / systems */}
      <section id="funnel-problem" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl marketing-stack-tight">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
            Why most businesses don&apos;t convert
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            There&apos;s often a disconnect between <strong className="text-foreground">brand</strong> (who you are and who you serve), <strong className="text-foreground">design</strong> (how you look and feel), and <strong className="text-foreground">systems</strong> (how you capture and follow up with leads). When one is weak, growth stalls.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/diagnosis">Run Growth Diagnosis</Link>
            </Button>
          </div>
        </SectionReveal>
      </section>
      <SectionConnector />

      {/* Authority: branding (Macon), strategy (Style Studio), systems (Ascendra) */}
      <section id="funnel-authority" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl marketing-stack-tight">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
            Built by specialists in brand, design, and systems
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Branding work by Macon Designs®, strategy and positioning by Style Studio Branding, and web systems and automation by Ascendra Technologies. One rhythm: diagnose honestly, build what the diagnosis supports, then optimize from what you can measure.
          </p>
          <SectionRevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <SectionRevealItem key={pillar.name}>
                <AnimatedCard className="h-full">
                  <CardContent className="p-6 sm:p-7">
                    <h3 className="text-lg font-semibold text-foreground">{pillar.name}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{pillar.role}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{pillar.summary}</p>
                    {pillar.href && (
                      <Button asChild variant="ghost" size="sm" className="mt-3 p-0 h-auto text-primary">
                        <Link href={pillar.href}>Learn more</Link>
                      </Button>
                    )}
                  </CardContent>
                </AnimatedCard>
              </SectionRevealItem>
            ))}
          </SectionRevealStagger>
        </SectionReveal>
      </section>
      <SectionConnector />

      {/* How the Growth Diagnosis works: 3 steps + CTA */}
      <section id="funnel-how-it-works" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl marketing-stack">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
            How it works
          </h2>
          <SectionRevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            <SectionRevealItem>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-3">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground">Step 1 — Diagnose</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Short questions across brand clarity, presentation, site structure, leads, and follow-up—a clear read on where effort should go first.
                </p>
              </div>
            </SectionRevealItem>
            <SectionRevealItem>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground">Step 2 — Prioritize</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  See your score and primary bottleneck so you don&apos;t rebuild the wrong layer first.
                </p>
              </div>
            </SectionRevealItem>
            <SectionRevealItem>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground">Step 3 — Build &amp; refine</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  A concrete next step and the right partner lane—strategy, design, or web systems—with room to optimize once the foundation holds.
                </p>
              </div>
            </SectionRevealItem>
          </SectionRevealStagger>
          <div className="text-center pt-4">
            <MagneticButton>
              <Button asChild size="lg" className="gap-2 min-h-[48px]">
                <Link href="/diagnosis">
                  Run Growth Diagnosis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </MagneticButton>
          </div>
        </SectionReveal>
      </section>
      <SectionConnector />

      <section id="skills" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl marketing-stack-tight">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
            Why most business websites fail—and how we fix it
          </h2>
          <BeforeAfterToggle
            beforeLabel="The problem"
            afterLabel="The solution"
            beforeContent={
              <ul className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {problemListItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            }
            afterContent={
              <>
                <p className="text-sm sm:text-base text-muted-foreground">
                  We align brand strategy, visual experience, and technology so your business improves how it looks, how it communicates, and how it turns visitors into customers.
                </p>
                <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                  <Link href="/about">How the ecosystem works</Link>
                </Button>
              </>
            }
          />
        </SectionReveal>
      </section>
      <SectionConnector />

      <StickyStorySection
        headline="From traffic to customer"
        subline="How visitors become leads and customers—and where most sites break down."
        steps={FUNNEL_STORY_STEPS}
      />
      <SectionConnector />

      <StatsStrip
        items={[
          { value: projects.length, label: "Project examples", suffix: "+" },
          { value: 3, label: "Ecosystem partners" },
          { value: 1, label: "Digital Growth Audit" },
        ]}
      />
      <SectionConnector variant="gradient" />

      <section id="services" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl marketing-stack-tight">
          <SpotlightCard className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4 sm:mb-5">
              Digital Growth Audit
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-2">
              We review your brand clarity, visual presentation, website performance, and conversion opportunities—then give you clear next steps.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
              <li>• Brand clarity</li>
              <li>• Visual presentation</li>
              <li>• Website performance</li>
              <li>• Conversion opportunities</li>
            </ul>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2">
              <MagneticButton>
                <Button asChild className="min-h-[44px]">
                  <Link href="/digital-growth-audit">Request your audit</Link>
                </Button>
              </MagneticButton>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/services">See growth systems</Link>
              </Button>
              <Button asChild variant="ghost" className="min-h-[44px] text-muted-foreground">
                <Link href="/free-growth-tools">Explore free growth tools</Link>
              </Button>
            </div>
          </SpotlightCard>
          <SpotlightCard className="p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 sm:mb-3">
              Free growth tools
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Website Revenue Loss Calculator</strong> — Estimate how much potential business your site may be missing due to low conversion.
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Website Performance Score</strong> — See how your site stacks up on clarity, design, conversion, and speed.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              <strong className="text-foreground">Competitor Position Snapshot</strong> — Understand how your business may be showing up compared to competitors.
            </p>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/website-revenue-calculator">
                Use revenue calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </SpotlightCard>
        </SectionReveal>
      </section>

      <section id="partner-signal" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl">
          <InsightsFromEcosystem
            insights={getOneInsightPerFounder()}
            heading="From the founders"
            subtext="Practical perspectives on strategy, design, and technology from the people behind the ecosystem."
            variant="card"
            showFoundersLink={true}
          />
        </SectionReveal>
      </section>

      <section id="insights" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-foreground text-center mb-4 sm:mb-5">
            Insights for business owners
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Practical articles on website conversion, brand clarity, and growth. No fluff—what works and what to fix.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-14">
            {getLatestBlogPostsForBusiness(4).map((post) => (
              <Card key={post.slug} className="border-border bg-card h-full flex flex-col">
                <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-foreground leading-tight mb-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-4">
                    {post.summary}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary p-0 h-auto font-medium w-fit">
                    <Link href={`/blog/${post.slug}`}>
                      Read article
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/blog">Read the blog</Link>
            </Button>
          </div>
        </SectionReveal>
      </section>

      <section className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-foreground text-center mb-6 sm:mb-8 md:mb-10">
            Growth systems that fit where you are
          </h2>
          <SectionRevealStagger className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {PREMIUM_OFFERS.map((offer) => (
              <SectionRevealItem key={offer.slug}>
                <SpotlightCard className="h-full">
                  <CardContent className="p-6 sm:p-7">
                    <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-snug">
                      <span className="font-medium text-foreground">Typical investment:</span>{" "}
                      {offer.typicalInvestment}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{offer.outcome}</p>
                    <p className="mt-4 text-sm font-medium text-foreground">Best for</p>
                    <p className="text-sm text-muted-foreground">{offer.audience}</p>
                    <Button asChild variant="outline" className="mt-6 min-h-[44px] w-full">
                      <Link href="/services">Learn more</Link>
                    </Button>
                  </CardContent>
                </SpotlightCard>
              </SectionRevealItem>
            ))}
          </SectionRevealStagger>
        </SectionReveal>
      </section>

      <section className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center mb-6 sm:mb-8">
            How we work
          </h2>
          <ProcessExplorer
            steps={processStepItems}
            trustHighlights={trustHighlights}
            trustCta={{ label: "Run Growth Diagnosis", href: "/diagnosis" }}
          />
        </SectionReveal>
      </section>

      <section id="projects" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-6 sm:p-8 md:p-10">
          <h2 className="text-2xl font-semibold text-foreground mb-5 sm:mb-6">
            Selected project examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {projects.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-lg border border-border p-4 hover:bg-section/50 transition-colors"
              >
                <p className="font-medium text-foreground">{project.title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        </SectionReveal>
      </section>

      <section id="contact" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl">
          <SpotlightCard className="p-5 sm:p-6 md:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 sm:mb-4">
              Start by understanding where your website may be holding your business back.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Request a Digital Growth Audit for a clear view of brand, design, and conversion opportunities—then decide your next step.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <MagneticButton>
                <Button asChild className="min-h-[44px]">
                  <Link href="/digital-growth-audit">Request Digital Growth Audit</Link>
                </Button>
              </MagneticButton>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/contact">Book a free call</Link>
              </Button>
            </div>
          </SpotlightCard>
        </SectionReveal>
      </section>
    </div>
  );
}
