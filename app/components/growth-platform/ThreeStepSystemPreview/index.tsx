"use client";

import Link from "next/link";
import { Check, HelpCircle, Minus } from "lucide-react";
import { GROWTH_SYSTEM_STEP_OUTCOMES } from "@/lib/growthSystemOutcomeCopy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StepRow = {
  title: string;
  haveLabel: string;
  missLabel: string;
  haveHref: string;
  missHref: string;
  haveHint: string;
  missHint: string;
};

const STEPS: { step: 1 | 2 | 3; label: string; outcomeLine: string; rows: StepRow[] }[] = [
  {
    step: 1,
    label: "Diagnose",
    outcomeLine: GROWTH_SYSTEM_STEP_OUTCOMES[1],
    rows: [
      {
        title: "Market demand clarity",
        haveLabel: "You ran Market Score",
        missLabel: "Start Market Score",
        haveHref: "/market-score",
        missHref: "/market-score",
        haveHint: "Refresh when your market shifts.",
        missHint: "See demand, competition, and viability in one pass.",
      },
      {
        title: "Site conversion strength",
        haveLabel: "Website score done",
        missLabel: "Run website score",
        haveHref: "/website-performance-score",
        missHref: "/tools/startup-website-score",
        haveHint: "Compare clarity vs trust vs conversion.",
        missHint: "Spot what’s blocking calls and forms.",
      },
      {
        title: "Offer strength",
        haveLabel: "Offer check",
        missLabel: "Review your offer page",
        haveHref: "/offers/startup-growth-system",
        missHref: "/resources/startup-growth-kit",
        haveHint: "Tighten promise + proof together.",
        missHint: "Free kit first—then a sharper paid path if it fits.",
      },
    ],
  },
  {
    step: 2,
    label: "Build",
    outcomeLine: GROWTH_SYSTEM_STEP_OUTCOMES[2],
    rows: [
      {
        title: "Funnel preview",
        haveLabel: "See growth tools hub",
        missLabel: "Open growth tools",
        haveHref: "/free-growth-tools",
        missHref: "/free-growth-tools",
        haveHint: "Pick the next best lever.",
        missHint: "Choose a small win you can ship this week.",
      },
      {
        title: "Messaging breakdown",
        haveLabel: "Brand positioning hub",
        missLabel: "Explore brand growth",
        haveHref: "/brand-growth",
        missHref: "/launch-your-brand",
        haveHint: "Keep promise consistent across ads + site.",
        missHint: "Align headline with what you actually sell.",
      },
      {
        title: "Lead capture flow",
        haveLabel: "Diagnose funnel",
        missLabel: "Book a strategy call",
        haveHref: "/growth-diagnosis",
        missHref: "/strategy-call",
        haveHint: "Tighten one capture path at a time.",
        missHint: "We map capture + follow-up without guessing.",
      },
    ],
  },
  {
    step: 3,
    label: "Scale",
    outcomeLine: GROWTH_SYSTEM_STEP_OUTCOMES[3],
    rows: [
      {
        title: "Paid acquisition layer",
        haveLabel: "PPC module overview",
        missLabel: "Learn paid growth approach",
        haveHref: "/ppc-lead-system",
        missHref: "/ppc-lead-system",
        haveHint: "We only scale when foundations pass readiness gates.",
        missHint: "Understand how ads tie to CRM + bookings.",
      },
      {
        title: "Optimization rhythm",
        haveLabel: "Pick a focused free tool",
        missLabel: "Get an audit narrative",
        haveHref: "/free-growth-tools",
        missHref: "/digital-growth-audit",
        haveHint: "Small tests beat guessing—start with one lever.",
        missHint: "Clarify what to fix before spending on ads.",
      },
      {
        title: "Reporting snapshot",
        haveLabel: "Advertising results (clients)",
        missLabel: "Client workspace sign-in",
        haveHref: "/dashboard/ppc-results",
        missHref: "/portal",
        haveHint: "When enabled by your strategist—simple lead and booking counts.",
        missHint: "Paying clients: workspace, invoices, and updates.",
      },
    ],
  },
];

export function ThreeStepSystemPreview() {
  return (
    <div className="space-y-6">
      {STEPS.map(({ step, label, outcomeLine, rows }) => (
        <Card key={step} className="border-border/80 overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/60 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="rounded-full px-2.5">
                Step {step}
              </Badge>
              <CardTitle className="text-base sm:text-lg">{label}</CardTitle>
            </div>
            <CardDescription className="text-foreground/90 font-medium">{outcomeLine}</CardDescription>
            <p className="text-sm text-muted-foreground pt-1">
              What you can run today vs what usually still needs attention
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/70">
              {rows.map((row) => (
                <div key={row.title} className="grid grid-cols-1 md:grid-cols-2 gap-0 p-4 sm:p-5">
                  <div className="flex gap-2 md:border-r md:border-border/60 md:pr-4">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-sm">{row.title}</p>
                      <Link href={row.haveHref} className="text-sm text-primary font-medium hover:underline">
                        {row.haveLabel}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{row.haveHint}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 md:pt-0 md:pl-4">
                    <Minus className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                        Often missing
                        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                      </p>
                      <Button
                        variant="link"
                        asChild
                        className="h-auto min-h-0 p-0 justify-start text-sm font-medium text-foreground"
                      >
                        <Link href={row.missHref}>{row.missLabel}</Link>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">{row.missHint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
