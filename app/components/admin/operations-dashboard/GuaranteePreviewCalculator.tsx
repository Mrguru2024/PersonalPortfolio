"use client";

import { useMemo, useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PreviewOut = {
  projectedLeads: number;
  projectedJobs: number;
  projectedRevenue: number;
  projectedRoiPercentage: number;
};

function parseNum(raw: string): number {
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function GuaranteePreviewCalculator() {
  const [monthlyTraffic, setMonthlyTraffic] = useState("5000");
  const [estimatedConversionRate, setEstimatedConversionRate] = useState("2.5");
  const [avgJobValue, setAvgJobValue] = useState("3500");
  const [systemCost, setSystemCost] = useState("2500");
  const [result, setResult] = useState<PreviewOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formattedRevenue = useMemo(() => {
    if (!result) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      result.projectedRevenue / 100,
    );
  }, [result]);

  async function runPreview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guarantee-preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyTraffic: parseNum(monthlyTraffic),
          estimatedConversionRate: parseNum(estimatedConversionRate),
          avgJobValue: Math.round(parseNum(avgJobValue) * 100),
          systemCost: Math.round(parseNum(systemCost) * 100),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(null);
        setError(typeof data.message === "string" ? data.message : "Could not run preview");
        return;
      }
      setResult(data as PreviewOut);
    } catch {
      setResult(null);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calculator className="h-4 w-4 shrink-0" />
          Guarantee preview calculator
        </CardTitle>
        <CardDescription>
          Sales and proposals: rough modeled leads, booked jobs, and ROI from traffic and funnel assumptions.
          Uses the same preview API as the guarantee engine (not a contractual forecast).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gp-traffic">Monthly traffic</Label>
            <Input
              id="gp-traffic"
              inputMode="numeric"
              value={monthlyTraffic}
              onChange={(e) => setMonthlyTraffic(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gp-rate">Est. visit → lead conversion (%)</Label>
            <Input
              id="gp-rate"
              inputMode="decimal"
              value={estimatedConversionRate}
              onChange={(e) => setEstimatedConversionRate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gp-job">Avg job value (USD)</Label>
            <Input
              id="gp-job"
              inputMode="decimal"
              value={avgJobValue}
              onChange={(e) => setAvgJobValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gp-cost">Monthly system cost (USD)</Label>
            <Input
              id="gp-cost"
              inputMode="decimal"
              value={systemCost}
              onChange={(e) => setSystemCost(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={() => void runPreview()} disabled={loading} className="min-h-[44px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Calculating
            </>
          ) : (
            "Calculate preview"
          )}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {result ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Projected leads:</span>{" "}
              <span className="font-medium">{result.projectedLeads}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Projected booked jobs:</span>{" "}
              <span className="font-medium">{result.projectedJobs}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Projected revenue:</span>{" "}
              <span className="font-medium">{formattedRevenue}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Projected ROI:</span>{" "}
              <span className="font-medium">{result.projectedRoiPercentage.toFixed(1)}%</span>
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
