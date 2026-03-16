"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/sections/HeroSection";
import {
  ECOSYSTEM_PILLARS,
  PREMIUM_OFFERS,
  FUNNEL_STORY_STEPS,
} from "@/lib/funnel-content";
import { projects } from "@/lib/data";
import { getLatestBlogPostsForBusiness } from "@/lib/blogSeedData";
import { InsightsFromEcosystem } from "@/components/authority";
import { getOneInsightPerFounder } from "@/lib/partnerFounders";
import {
  SectionReveal,
  SectionRevealStagger,
  SectionRevealItem,
  SpotlightCard,
  AnimatedCard,
  MagneticButton,
  ProcessExplorer,
  StickyStorySection,
  BeforeAfterToggle,
  SectionConnector,
  StatsStrip,
} from "@/components/motion";

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
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-10 sm:space-y-12 pb-10 sm:pb-14">
      <HeroSection />
      <SectionConnector variant="gradient" />

      <section id="skills" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
            Why most business websites fail—and how we fix it
          </h2>
          <BeforeAfterToggle
            beforeLabel="The problem"
            afterLabel="The solution"
            beforeContent={
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
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

      <section id="about" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
          <h2 className="text-3xl font-semibold text-foreground text-center mb-4 sm:mb-6">
            A coordinated approach to improving your digital presence
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-6">
            Three pillars work together: <strong className="text-foreground">Brand Strategy</strong> (messaging and positioning), <strong className="text-foreground">Visual Experience</strong> (design and presentation), and <strong className="text-foreground">Technology & Conversion Systems</strong> (websites and lead capture). Style Studio Branding, Macon Designs®, and Ascendra Technologies coordinate so your business improves how it looks, how it communicates, and how it converts visitors into customers.
          </p>
          <SectionRevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <SectionRevealItem key={pillar.name}>
                <AnimatedCard className="h-full">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold text-foreground">
                      {pillar.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-primary">{pillar.role}</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {pillar.summary}
                    </p>
                  </CardContent>
                </AnimatedCard>
              </SectionRevealItem>
            ))}
          </SectionRevealStagger>
        </SectionReveal>
      </section>

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
        <SectionReveal className="mx-auto max-w-5xl space-y-6">
          <SpotlightCard className="p-5 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 sm:mb-4">
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
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
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
            heading="Built by specialists in strategy, design, and technology"
            subtext="Practical perspectives from the founders behind the ecosystem."
            variant="card"
            showFoundersLink={true}
          />
        </SectionReveal>
      </section>

      <section id="insights" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-foreground text-center mb-3 sm:mb-4">
            Insights for business owners
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-6">
            Practical articles on website conversion, brand clarity, and growth. No fluff—what works and what to fix.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
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
          <h2 className="text-3xl font-semibold text-foreground text-center mb-4 sm:mb-6">
            Growth systems that fit where you are
          </h2>
          <SectionRevealStagger className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {PREMIUM_OFFERS.map((offer) => (
              <SectionRevealItem key={offer.slug}>
                <SpotlightCard className="h-full">
                  <CardContent className="p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{offer.outcome}</p>
                    <p className="mt-3 text-sm font-medium text-foreground">Best for</p>
                    <p className="text-sm text-muted-foreground">{offer.audience}</p>
                    <Button asChild variant="outline" className="mt-4 min-h-[44px] w-full">
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
            trustCta={{ label: "Review results and work", href: "/results" }}
          />
        </SectionReveal>
      </section>

      <section id="projects" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4 sm:mb-5">
            Selected project examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {projects.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors"
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
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Request a Digital Growth Audit for a clear view of brand, design, and conversion opportunities—then decide your next step.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
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
