"use client";

import Link from "next/link";
import { Gauge, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORIES = [
  { key: "brandClarity", label: "Brand clarity", score: 62 },
  { key: "visualPresentation", label: "Design experience", score: 70 },
  { key: "websitePerformance", label: "Website performance", score: 48 },
  { key: "conversionSystem", label: "Conversion system", score: 45 },
  { key: "speed", label: "Speed", score: 66 },
] as const;

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function WebsiteScoreCard() {
  const overallScore = Math.round(
    CATEGORIES.reduce((sum, c) => sum + c.score, 0) / CATEGORIES.length
  );

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Website performance score
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This is an <strong className="text-foreground">example</strong> breakdown. A real score for your site comes from a Digital Growth Audit, which reviews your brand, design, and conversion across these areas and gives you a clear improvement plan.
        </p>

        <div className="space-y-3 mb-4">
          {CATEGORIES.map(({ key, label, score }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-foreground">{label}</span>
              <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score >= 70
                        ? "bg-emerald-500"
                        : score >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold w-8 ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Example overall</span>
            <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore} / 100
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          In a real audit, scores below 60 in any area often point to lost trust, traffic, or conversions. Request a Digital Growth Audit to get your actual scores and a prioritized improvement plan.
        </p>

        <Button asChild className="w-full sm:w-auto gap-2">
          <Link href="/digital-growth-audit">
            Request your Digital Growth Audit
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
