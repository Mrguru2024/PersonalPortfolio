"use client";

import Link from "next/link";
import { ArrowRight, GitBranch, LineChart, Play, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTooltip } from "@/components/aee/MetricTooltip";

const steps = [
  {
    n: 1,
    title: "Define hypothesis",
    body: "Name the change and what you expect (conversion, revenue, or engagement).",
    href: "/admin/experiments/new",
    icon: Plus,
    cta: "New experiment",
  },
  {
    n: 2,
    title: "Assign variants",
    body: "Control + challengers with allocation weights map to growth_variants.",
    href: "/admin/experiments/new",
    icon: GitBranch,
    cta: "Configure variants",
  },
  {
    n: 3,
    title: "Run & measure",
    body: "Set status to running; rollups populate aee_experiment_metrics_daily.",
    href: "/admin/experiments/reports",
    icon: Play,
    cta: "Reports hub",
  },
  {
    n: 4,
    title: "Decide",
    body: "Use rollups, CRM ties, and PPC links on each experiment detail page.",
    href: "/admin/experiments/patterns",
    icon: LineChart,
    cta: "Patterns",
  },
] as const;

export function ExperimentsWorkflowCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Workflow</CardTitle>
          <MetricTooltip
            label="How it fits"
            explanation="A/B and multivariate tests share one datastore: growth_experiments, variants, visitor assignment, then CRM and paid media for closed-loop readouts."
          />
        </div>
        <CardDescription>From draft → running → readout without leaving this area.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.n}
                className="relative rounded-lg border bg-card/80 p-3 shadow-sm dark:bg-card/50"
              >
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {s.n}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-1 text-sm font-medium leading-tight">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">{s.body}</p>
                    <Link
                      href={s.href}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {s.cta}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
