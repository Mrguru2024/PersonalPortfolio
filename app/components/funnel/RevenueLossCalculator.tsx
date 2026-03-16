"use client";

import { useState } from "react";
import Link from "next/link";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";

const EXPECTED_CONVERSION_RATE = 3;

/** Industry benchmark used for comparison (many sites sit at 1–2%; 3% is a solid target). */
const BENCHMARK_NOTE =
  "3% is used as a common conversion benchmark for comparison. Your industry and offer may vary.";

function formatCurrency(value: number): string {
  if (Number.isNaN(value) || value < 0) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  if (value < 1 && value > 0) return `$${value.toFixed(2)}`;
  return `$${Math.round(value).toLocaleString()}`;
}

function clampVisitors(n: number): number {
  return Math.max(0, Number.isFinite(n) ? Math.floor(n) : 0);
}
function clampRate(n: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}
function clampSaleValue(n: number): number {
  return Math.max(0, Number.isFinite(n) ? n : 0);
}

export function RevenueLossCalculator() {
  const { track } = useVisitorTracking();
  const [monthlyVisitors, setMonthlyVisitors] = useState<string>("");
  const [conversionRate, setConversionRate] = useState<string>("");
  const [averageSaleValue, setAverageSaleValue] = useState<string>("");
  const [hasCalculated, setHasCalculated] = useState(false);

  const visitors = clampVisitors(Number.parseInt(monthlyVisitors, 10));
  const rate = clampRate(Number.parseFloat(conversionRate));
  const saleValue = clampSaleValue(Number.parseFloat(averageSaleValue));

  const currentRevenue = visitors * (rate / 100) * saleValue;
  const potentialRevenue = visitors * (EXPECTED_CONVERSION_RATE / 100) * saleValue;
  const revenueLoss = Math.max(0, potentialRevenue - currentRevenue);
  const atOrAboveBenchmark = rate >= EXPECTED_CONVERSION_RATE;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitors > 0 && saleValue > 0) {
      track("tool_used", { pageVisited: "/website-revenue-calculator", metadata: { tool: "revenue_calculator" } });
      setHasCalculated(true);
    }
  };

  const showResults = hasCalculated && visitors > 0 && saleValue > 0;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Estimate your revenue opportunity
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your monthly visitors, current conversion rate, and average sale value. We'll show you the potential revenue you may be missing.
        </p>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyVisitors">Monthly visitors</Label>
              <Input
                id="monthlyVisitors"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="e.g. 2000"
                value={monthlyVisitors}
                onChange={(e) => setMonthlyVisitors(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversionRate">Current conversion rate (%)</Label>
              <Input
                id="conversionRate"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 1"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageSaleValue">Average sale value ($)</Label>
              <Input
                id="averageSaleValue"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="e.g. 500"
                value={averageSaleValue}
                onChange={(e) => setAverageSaleValue(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={visitors <= 0 || saleValue <= 0}>
            Calculate
          </Button>
        </form>

        {showResults && (
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground mb-1">
                {atOrAboveBenchmark
                  ? "At or above benchmark"
                  : "Estimated monthly revenue loss"}
              </p>
              <p className="text-2xl font-bold text-primary">
                {atOrAboveBenchmark ? (
                  "—"
                ) : (
                  <AnimatedCounter
                    end={Math.round(revenueLoss)}
                    format={formatCurrency}
                    duration={1200}
                  />
                )}
              </p>
              {atOrAboveBenchmark ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Your current conversion rate ({rate}%) is at or above the {EXPECTED_CONVERSION_RATE}% benchmark. Focus on growing traffic or average order value, or request an audit to find further gains.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Based on your inputs, your website could be missing approximately{" "}
                  <strong className="text-foreground">
                    <AnimatedCounter
                      end={Math.round(revenueLoss)}
                      format={formatCurrency}
                      duration={1200}
                    />
                  </strong>{" "}
                  per month in potential revenue.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {BENCHMARK_NOTE}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-md border border-border">
                <p className="text-muted-foreground">Current estimated revenue</p>
                <p className="font-semibold text-foreground">{formatCurrency(currentRevenue)}</p>
              </div>
              <div className="p-3 rounded-md border border-border">
                <p className="text-muted-foreground">Potential revenue (at {EXPECTED_CONVERSION_RATE}%)</p>
                <p className="font-semibold text-foreground">{formatCurrency(potentialRevenue)}</p>
              </div>
              <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
                <p className="text-muted-foreground">Improvement opportunity</p>
                <p className="font-semibold text-primary">
                  {atOrAboveBenchmark ? "—" : `${formatCurrency(revenueLoss)}/mo`}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-foreground mb-2">Next steps</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/digital-growth-audit">
                    Request Digital Growth Audit
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/services">See Growth Systems</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
