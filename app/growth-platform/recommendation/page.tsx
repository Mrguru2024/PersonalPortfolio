"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ASCENDRA_OFFER_STACK,
  computeJobRevenueImpact,
  recommendOfferTier,
  type AscendraOfferTier,
} from "@shared/ascendraOfferStack";
import { JobRevenueImpactCalculator } from "@/components/growth-platform/JobRevenueImpactCalculator";
import { OfferStackTierCards } from "@/components/growth-platform/OfferStackTierCards";
import { PurchaseLegalAcknowledgment } from "@/components/growth-platform/PurchaseLegalAcknowledgment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AscendraBehaviorMount } from "@/components/tracking/AscendraBehaviorMount";

function RecommendationInner() {
  const searchParams = useSearchParams();
  const [legalOk, setLegalOk] = useState(false);

  const inputs = useMemo(() => {
    const job = Number.parseFloat(searchParams.get("job") ?? "");
    const goal = Number.parseFloat(searchParams.get("goal") ?? "");
    const leads = Number.parseFloat(searchParams.get("leads") ?? "");
    const closeRaw = searchParams.get("close");
    const closePct = closeRaw != null ? Number.parseFloat(closeRaw) : 25;
    const rate = Number.isFinite(closePct) ? Math.max(0, Math.min(100, closePct)) / 100 : 0.25;
    if (!Number.isFinite(job) || job <= 0) return null;
    return {
      averageJobValue: job,
      jobsPerMonthGoal: Number.isFinite(goal) ? Math.max(0, goal) : 0,
      qualifiedLeadsPerMonth: Number.isFinite(leads) ? Math.max(0, leads) : 0,
      leadToJobCloseRate: rate,
    };
  }, [searchParams]);

  const tier: AscendraOfferTier | null = inputs ? recommendOfferTier(inputs) : null;
  const impact = inputs ? computeJobRevenueImpact(inputs) : null;

  const problems = useMemo(() => {
    const out: string[] = [];
    if (!inputs) {
      out.push("We don’t have your numbers yet—use the calculator above or go back to add job value and goals.");
      return out;
    }
    if (inputs.qualifiedLeadsPerMonth <= 0) {
      out.push("Lead flow looks thin or unmeasured—calls and forms need a clear capture path before scaling spend.");
    }
    if (inputs.jobsPerMonthGoal > 0 && inputs.qualifiedLeadsPerMonth > 0) {
      const impliedJobs = inputs.qualifiedLeadsPerMonth * (inputs.leadToJobCloseRate ?? 0.25);
      if (impliedJobs + 0.001 < inputs.jobsPerMonthGoal * 0.5) {
        out.push("Your current lead volume likely won’t hit the job goal without better conversion or more qualified demand.");
      }
    }
    if ((inputs.leadToJobCloseRate ?? 0) < 0.15) {
      out.push("Close rate from lead to booked job is conservative in your inputs—if it’s accurate, sales follow-up may need tightening.");
    }
    if (out.length === 0) {
      out.push("Main focus: keep measurement honest—tie every lead to source and stage so optimization isn’t guessing.");
    }
    return out;
  }, [inputs]);

  const recommended = tier ? ASCENDRA_OFFER_STACK[tier] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-teal-500/[0.04]">
      <AscendraBehaviorMount />
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl space-y-8">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/growth-platform">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to growth system
          </Link>
        </Button>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System recommendation</h1>
          <p className="text-muted-foreground">
            Grounded summary from your inputs— not a guaranteed forecast. Your strategist confirms scope after a call.
          </p>
        </header>

        {!inputs && (
          <JobRevenueImpactCalculator hideRecommendationCta />
        )}

        {impact && (
          <Card>
            <CardHeader>
              <CardTitle>Scorecard (illustrative)</CardTitle>
              <CardDescription>{impact.disclaimer}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Potential at goal:</strong> ${Math.round(impact.potentialMonthlyRevenue).toLocaleString()} / mo
              </p>
              <p>
                <strong>Estimated from current leads:</strong> $
                {Math.round(impact.estimatedCurrentMonthlyRevenue).toLocaleString()} / mo
              </p>
              <p>
                <strong>Illustrative gap:</strong> ${Math.round(impact.estimatedMonthlyGap).toLocaleString()} / mo
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Problems we’d pressure-test first</CardTitle>
            <CardDescription>Plain language—not a formal audit.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {problems.map((p, i) => (
                <li key={`${i}-${p.slice(0, 24)}`}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {recommended && tier && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>Recommended path: {recommended.title}</CardTitle>
              <CardDescription>{recommended.headlineOutcome}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{recommended.riskReversalSummary}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/strategy-call">Book strategy call</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Start system setup</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">All tiers</h2>
          <OfferStackTierCards highlightTier={tier} />
        </div>

        <PurchaseLegalAcknowledgment checked={legalOk} onCheckedChange={setLegalOk} />
        <p className="text-xs text-muted-foreground">
          Checking the box is practice for checkout flows; it does not obligate you to purchase. Custom agreements are
          issued per engagement.
        </p>
      </div>
    </div>
  );
}

export default function GrowthPlatformRecommendationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Loading…</div>
      }
    >
      <RecommendationInner />
    </Suspense>
  );
}
