"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { TrendingUp, Calculator, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeJobRevenueImpact, recommendOfferTier } from "@shared/ascendraOfferStack";

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export interface JobRevenueImpactCalculatorProps {
  /** When true, hide the “see recommendation” CTA (e.g. if embedded on recommendation page). */
  hideRecommendationCta?: boolean;
  className?: string;
  /** Pre-fill from linked Offer Engine template inputs (e.g. /growth-platform snapshot). */
  calculatorDefaults?: {
    averageJobValue?: number | null;
    jobsPerMonthGoal?: number | null;
  };
}

function initialField(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "";
  return String(Math.round(n));
}

export function JobRevenueImpactCalculator({
  hideRecommendationCta = false,
  className,
  calculatorDefaults,
}: JobRevenueImpactCalculatorProps) {
  const { track } = useVisitorTracking();
  const [avgJob, setAvgJob] = useState(() => initialField(calculatorDefaults?.averageJobValue));
  const [goalJobs, setGoalJobs] = useState(() => initialField(calculatorDefaults?.jobsPerMonthGoal));
  const [leads, setLeads] = useState("");
  const [closePct, setClosePct] = useState("25");
  const [ran, setRan] = useState(false);

  const result = useMemo(() => {
    const job = Number.parseFloat(avgJob);
    const goal = Number.parseFloat(goalJobs);
    const L = Number.parseFloat(leads);
    const pct = Number.parseFloat(closePct);
    const rate = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) / 100 : 0.25;
    if (!Number.isFinite(job) || !Number.isFinite(goal) || !Number.isFinite(L) || job <= 0) return null;
    return computeJobRevenueImpact({
      averageJobValue: job,
      jobsPerMonthGoal: Math.max(0, goal),
      qualifiedLeadsPerMonth: Math.max(0, L),
      leadToJobCloseRate: rate,
    });
  }, [avgJob, goalJobs, leads, closePct]);

  const tier = useMemo(() => {
    const job = Number.parseFloat(avgJob);
    const goal = Number.parseFloat(goalJobs);
    const L = Number.parseFloat(leads);
    const pct = Number.parseFloat(closePct);
    const rate = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) / 100 : 0.25;
    if (!Number.isFinite(job) || job <= 0 || !Number.isFinite(goal)) return null;
    return recommendOfferTier({
      averageJobValue: job,
      jobsPerMonthGoal: Math.max(0, goal),
      qualifiedLeadsPerMonth: Number.isFinite(L) ? Math.max(0, L) : 0,
      leadToJobCloseRate: rate,
    });
  }, [avgJob, goalJobs, leads, closePct]);

  const recommendationHref = useMemo(() => {
    const job = Number.parseFloat(avgJob);
    const goal = Number.parseFloat(goalJobs);
    const L = Number.parseFloat(leads);
    const pct = Number.parseFloat(closePct);
    if (!Number.isFinite(job) || job <= 0) return "/growth-platform/recommendation";
    const q = new URLSearchParams();
    q.set("job", String(job));
    if (Number.isFinite(goal)) q.set("goal", String(goal));
    if (Number.isFinite(L)) q.set("leads", String(L));
    if (Number.isFinite(Number.parseFloat(closePct))) q.set("close", closePct);
    return `/growth-platform/recommendation?${q.toString()}`;
  }, [avgJob, goalJobs, leads, closePct]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRan(true);
    if (result) {
      track("tool_used", {
        pageVisited: "/growth-platform",
        metadata: { tool: "job_revenue_impact_calculator" },
      });
    }
  };

  const show = ran && result != null;

  return (
    <Card className={className ?? "border-primary/25 shadow-sm"}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <CardTitle className="text-lg sm:text-xl">Revenue impact (jobs)</CardTitle>
        </div>
        <CardDescription>
          Estimate monthly revenue at your job goal, what current lead flow might produce, and the gap—
          <strong className="text-foreground font-medium"> before we talk price</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gpi-job">Average job value ($)</Label>
              <Input
                id="gpi-job"
                inputMode="decimal"
                min={0}
                placeholder="e.g. 2500"
                value={avgJob}
                onChange={(e) => setAvgJob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpi-goal">Jobs per month goal</Label>
              <Input
                id="gpi-goal"
                inputMode="numeric"
                min={0}
                placeholder="e.g. 10"
                value={goalJobs}
                onChange={(e) => setGoalJobs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpi-leads">Qualified leads / month (today)</Label>
              <Input
                id="gpi-leads"
                inputMode="numeric"
                min={0}
                placeholder="e.g. 20"
                value={leads}
                onChange={(e) => setLeads(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpi-close">Lead → job close rate (%)</Label>
              <Input
                id="gpi-close"
                inputMode="decimal"
                min={0}
                max={100}
                placeholder="default 25"
                value={closePct}
                onChange={(e) => setClosePct(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <TrendingUp className="h-4 w-4 mr-2" aria-hidden />
            Show revenue picture
          </Button>
        </form>

        {show && result && (
          <div className="mt-6 space-y-4 rounded-lg border bg-muted/30 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">At your goal</p>
                <p className="text-xl sm:text-2xl font-bold tabular-nums">{formatUsd(result.potentialMonthlyRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">potential monthly revenue</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From today’s leads</p>
                <p className="text-xl sm:text-2xl font-bold tabular-nums">{formatUsd(result.estimatedCurrentMonthlyRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ~{result.impliedJobsFromLeads.toFixed(1)} jobs/mo at your close rate
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gap (illustrative)</p>
                <p className="text-xl sm:text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {formatUsd(result.estimatedMonthlyGap)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">not “lost forever”—fixable with systems</p>
              </div>
            </div>
            {result.breakEvenMonthsOnSetupMid != null && (
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Illustrative break-even on setup:</strong> ~{result.breakEvenMonthsOnSetupMid}{" "}
                month{result.breakEvenMonthsOnSetupMid === 1 ? "" : "s"} of closing the gap—if the gap stayed similar and
                setup landed near a mid-range DFY investment. {result.disclaimer}
              </p>
            )}
            {!hideRecommendationCta && tier && (
              <Button asChild className="w-full sm:w-auto">
                <Link href={recommendationHref}>
                  View your recommendation
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden />
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
