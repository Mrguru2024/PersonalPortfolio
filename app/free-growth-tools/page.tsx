import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Calculator, Gauge, BarChart3, Layout, BookOpen, Sparkles } from "lucide-react";
import { TrackPageView } from "@/components/TrackPageView";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { STARTUP_GROWTH_KIT_PATH, STARTUP_WEBSITE_SCORE_PATH, GROWTH_DIAGNOSIS_ENGINE_PATH } from "@/lib/funnelCtas";

export const metadata: Metadata = {
  title: "Free growth tools | Ascendra Technologies",
  description:
    "Free tools to help you see where your business stands: growth audit, competitor snapshot, homepage blueprint, and more. One coordinated ecosystem—brand, web, and marketing.",
};

const LEAD_MAGNETS = [
  {
    id: "growth-diagnosis",
    title: "Website growth diagnosis",
    who: "Business owners who want a clear, automated audit of their site's performance and conversion readiness.",
    problem: "You want to see where your site stands without waiting for a human review.",
    get: "An automated scan and Growth Readiness Score: performance, SEO, conversion, trust, and mobile. Plus top blockers and quick wins.",
    cta: "Run free diagnosis",
    href: GROWTH_DIAGNOSIS_ENGINE_PATH,
    icon: Sparkles,
  },
  {
    id: "audit",
    title: "Digital growth audit",
    who: "Business owners ready for a tailored review and clear next steps.",
    problem: "You're not sure what's holding you back or what to fix first.",
    get: "A straight-talk review of brand clarity, visual trust, and website conversion—with recommended next steps.",
    cta: "Get your free audit",
    href: "/digital-growth-audit",
    icon: Search,
  },
  {
    id: "revenue-calculator",
    title: "Website revenue loss calculator",
    who: "Anyone feeling pain from poor site performance and missed opportunities.",
    problem: "You suspect your site is costing you leads and revenue but don't know how much.",
    get: "A framework to think through lost traffic, conversion gaps, and opportunity cost—plus a path to fix it.",
    cta: "Use the calculator",
    href: "/website-revenue-calculator",
    icon: Calculator,
  },
  {
    id: "performance-score",
    title: "Website performance score",
    who: "Visitors curious how strong or weak their site is.",
    problem: "You want an honest view of where your site stands on clarity, trust, and conversion.",
    get: "A structured review of how your site scores on key areas—and what to improve first.",
    cta: "See the score",
    href: "/website-performance-score",
    icon: Gauge,
  },
  {
    id: "competitor-snapshot",
    title: "Competitor position snapshot",
    who: "Business owners worried about losing work to competitors or blending in.",
    problem: "You don't know how you show up next to others in your space.",
    get: "A structured snapshot of brand position, visual trust, conversion readiness, and market opportunity questions.",
    cta: "Get my snapshot",
    href: "/competitor-position-snapshot",
    icon: BarChart3,
  },
  {
    id: "homepage-blueprint",
    title: "Homepage conversion blueprint",
    who: "Anyone who knows their site is unclear and wants a structure to fix it.",
    problem: "Your homepage doesn't clearly turn visitors into leads.",
    get: "A practical blueprint: the sections, messaging, and conversion elements most homepages are missing—plus a self-check.",
    cta: "View the blueprint",
    href: "/homepage-conversion-blueprint",
    icon: Layout,
  },
  {
    id: "startup-growth-kit",
    title: "Startup growth kit",
    who: "New business owners building a business online with little or no budget.",
    problem: "You're not sure where to begin or how to grow without a big agency budget.",
    get: "Educational guide: why most startup websites fail, assets vs systems, the 4 layers of online growth, and a simple roadmap.",
    cta: "Read the kit",
    href: STARTUP_GROWTH_KIT_PATH,
    icon: BookOpen,
  },
  {
    id: "startup-website-score",
    title: "Startup website score",
    who: "Founders who want to know if their site is ready to capture leads.",
    problem: "You don't know how your website stacks up on clarity, trust, and conversion.",
    get: "A simple questionnaire and readiness score (0–100) with improvement suggestions and a path to your Startup Action Plan.",
    cta: "Get my score",
    href: STARTUP_WEBSITE_SCORE_PATH,
    icon: Sparkles,
  },
];

export default function FreeGrowthToolsPage() {
  return (
    <>
      <TrackPageView path="/free-growth-tools" />
      <PageSEO
        title="Free growth tools | Ascendra Technologies"
        description="Free tools to help you see where your business stands: growth audit, competitor snapshot, homepage blueprint, and more."
        canonicalPath="/free-growth-tools"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-10 sm:space-y-12">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Free growth tools
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10">
                Practical resources to help you see where your business stands and what to do next. From the Brand Growth ecosystem—strategy, design, and technology in one place.
              </p>
              {/* Hero visual: contained, professional focal point */}
              <div className="relative w-full max-w-3xl mx-auto aspect-[21/9] sm:aspect-[2/1] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                <Image
                  src="/Video Content_Ascendra_Files/Ascendra_Business Launch Promo/(Footage)/Asset/Growth_10.jpg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" aria-hidden />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {LEAD_MAGNETS.map((magnet) => {
                const Icon = magnet.icon;
                return (
                  <Card key={magnet.id} className="border-border bg-card h-full flex flex-col">
                    <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                          {magnet.title}
                        </h2>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Who it's for
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {magnet.who}
                      </p>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Problem it helps solve
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {magnet.problem}
                      </p>
                      <p className="text-sm font-medium text-foreground mb-1">
                        What you get
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">
                        {magnet.get}
                      </p>
                      <Button asChild className="w-full sm:w-auto gap-2 min-h-[44px]">
                        <TrackedCtaLink href={magnet.href} ctaLabel={magnet.id} pageVisited="/free-growth-tools" className="inline-flex items-center gap-2">
                          {magnet.cta}
                          <ArrowRight className="h-4 w-4" />
                        </TrackedCtaLink>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                Not sure which tool fits? Start with the <Link href="/digital-growth-audit" className="font-medium text-primary hover:underline">Digital Growth Audit</Link>—we'll help you see your best next move.
              </p>
              <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                <Link href="/contact">Book a free call</Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
