import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, Radar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { TrackPageView } from "@/components/TrackPageView";
import {
  GROWTH_DIAGNOSIS_ENGINE_PATH,
  GROWTH_DIAGNOSIS_PATH,
  PERSONA_JOURNEY_PATH,
} from "@/lib/funnelCtas";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Choose your diagnosis | Ascendra Technologies",
  description:
    "Pick the right path: automated website scan, self-serve growth questionnaire, or full project assessment with pricing.",
  path: "/diagnostics",
  keywords: ["diagnostics", "website scan", "growth questionnaire", "assessment"],
});

const PATHS = [
  {
    title: "Automated website scan",
    description:
      "Fast machine-style check: performance, SEO, conversion signals, and a Growth Readiness Score. Best when you want benchmarks without a long questionnaire.",
    href: GROWTH_DIAGNOSIS_ENGINE_PATH,
    cta: "Run free scan",
    icon: Radar,
    badge: "Fastest",
  },
  {
    title: "Growth questionnaire",
    description:
      "Step through brand, design, site, leads, and automation. You get scores, your primary bottleneck, and a recommended partner lane—then you can apply for a plan.",
    href: "/diagnosis",
    cta: "Start questionnaire",
    icon: Sparkles,
    badge: "Self-serve",
  },
  {
    title: "Full project assessment",
    description:
      "Scoped for real builds: project type, requirements, and a structured proposal range. Use when you are ready to talk budget and timeline—not just a free scan.",
    href: "/assessment",
    cta: "Start assessment",
    icon: ClipboardList,
    badge: "Scoped pricing",
  },
] as const;

export default function DiagnosticsHubPage() {
  return (
    <>
      <WebPageJsonLd
        title="Choose your diagnosis | Ascendra Technologies"
        description="Three clear paths: automated scan, questionnaire, or full assessment—so you land in the right funnel."
        path="/diagnostics"
      />
      <TrackPageView path="/diagnostics" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
            <header className="text-center space-y-3 sm:space-y-4">
              <p className="text-sm font-medium text-primary uppercase tracking-wide">
                Find the right entry
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Choose your diagnosis
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                We grouped similar-sounding experiences into three intents. Pick one—each leads to a different depth of
                insight and next step.
              </p>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Looking for calculators, blueprints, and more? Visit the{" "}
                <Link href="/free-growth-tools" className="text-primary font-medium underline-offset-4 hover:underline">
                  free tools hub
                </Link>
                .
              </p>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Want a path matched to your business type first?{" "}
                <Link href={PERSONA_JOURNEY_PATH} className="text-primary font-medium underline-offset-4 hover:underline">
                  Start the persona journey
                </Link>
                .
              </p>
            </header>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-1">
              {PATHS.map((p) => {
                const Icon = p.icon;
                return (
                  <Card
                    key={p.href}
                    className="border-border/80 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-foreground">{p.title}</h2>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{p.description}</p>
                        <Button asChild className="mt-2 w-full sm:w-auto gap-2">
                          <Link href={p.href}>
                            {p.cta}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border-dashed bg-section/60 dark:bg-section/25">
              <CardContent className="p-5 sm:p-6 text-center text-sm text-muted-foreground">
                <p>
                  The shorter{" "}
                  <Link href={GROWTH_DIAGNOSIS_PATH} className="text-primary font-medium underline-offset-4 hover:underline">
                    /growth
                  </Link>{" "}
                  landing still leads into the questionnaire if you arrived from campaigns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
