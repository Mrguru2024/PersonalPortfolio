"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MetricTooltip } from "@/components/aee/MetricTooltip";
import { twoProportionZTest } from "@/lib/aee/abTestMath";

function parseNonnegInt(raw: string): number {
  const n = Number.parseInt(raw.replace(/,/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function AbTestingToolsPanel() {
  const [visA, setVisA] = useState("1000");
  const [convA, setConvA] = useState("120");
  const [visB, setVisB] = useState("1000");
  const [convB, setConvB] = useState("150");

  const result = useMemo(() => {
    const nA = parseNonnegInt(visA);
    const cA = parseNonnegInt(convA);
    const nB = parseNonnegInt(visB);
    const cB = parseNonnegInt(convB);
    return twoProportionZTest(cA, nA, cB, nB);
  }, [visA, convA, visB, convB]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <MetricTooltip
            label="A/B testing tools"
            explanation="Two-proportion z-test (pooled). Use control vs variant visitor and conversion counts from your rollup or analytics export. For production decisions, confirm with your stats process."
          />
        </CardTitle>
        <CardDescription>
          Quick significance readout between two arms.{" "}
          <Link href="/admin/experiments/new" className="text-primary hover:underline">
            Create a 2-variant test
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Arm A (e.g. control)</p>
            <div className="grid gap-2">
              <div>
                <Label htmlFor="ab-vis-a">Visitors</Label>
                <Input
                  id="ab-vis-a"
                  inputMode="numeric"
                  value={visA}
                  onChange={(e) => setVisA(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ab-conv-a">Conversions</Label>
                <Input
                  id="ab-conv-a"
                  inputMode="numeric"
                  value={convA}
                  onChange={(e) => setConvA(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Arm B (e.g. variant)</p>
            <div className="grid gap-2">
              <div>
                <Label htmlFor="ab-vis-b">Visitors</Label>
                <Input
                  id="ab-vis-b"
                  inputMode="numeric"
                  value={visB}
                  onChange={(e) => setVisB(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ab-conv-b">Conversions</Label>
                <Input
                  id="ab-conv-b"
                  inputMode="numeric"
                  value={convB}
                  onChange={(e) => setConvB(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-background p-3 text-sm">
          {!result ? (
            <p className="text-muted-foreground">
              Enter valid counts (conversions cannot exceed visitors).
            </p>
          ) : (
            <ul className="space-y-1.5 tabular-nums">
              <li>
                <span className="text-muted-foreground">Rate A:</span>{" "}
                <strong className="text-foreground">{(result.rateA * 100).toFixed(2)}%</strong>
              </li>
              <li>
                <span className="text-muted-foreground">Rate B:</span>{" "}
                <strong className="text-foreground">{(result.rateB * 100).toFixed(2)}%</strong>
              </li>
              <li>
                <span className="text-muted-foreground">Z-score:</span>{" "}
                <strong>{result.z.toFixed(3)}</strong>
              </li>
              <li>
                <span className="text-muted-foreground">Two-sided p-value:</span>{" "}
                <strong className={result.pValue < 0.05 ? "text-primary" : "text-foreground"}>
                  {result.pValue < 0.0001 ? "<0.0001" : result.pValue.toFixed(4)}
                </strong>
                {result.pValue < 0.05 ? (
                  <span className="text-xs text-muted-foreground ml-2">(often treated as significant at α=0.05)</span>
                ) : null}
              </li>
              {result.relativeLiftVsB != null ? (
                <li>
                  <span className="text-muted-foreground">Relative lift (A vs B):</span>{" "}
                  <strong>{(result.relativeLiftVsB * 100).toFixed(1)}%</strong>
                  <MetricTooltip
                    label="Lift vs B"
                    className="!inline-flex align-middle ml-1 text-xs font-normal"
                    explanation="(rateA − rateB) / rateB. Positive means A converts higher than B."
                  />
                </li>
              ) : null}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/admin/experiments/new">New A/B experiment</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/admin/experiments/reports">Read reports hub</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
