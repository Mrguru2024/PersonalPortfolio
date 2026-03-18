"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFunnel } from "@/lib/funnel-store";
import {
  RECOMMENDATION_LABELS,
  type DiagnosisScores,
} from "@/lib/scoring";

const BOTTLENECK_LABELS: Record<DiagnosisScores["primaryBottleneck"], string> = {
  brand: "Brand clarity & messaging",
  design: "Visual identity & design",
  system: "Website & lead systems",
};

const RECOMMENDATION_DESCRIPTIONS: Record<DiagnosisScores["recommendation"], string> = {
  style_studio: "Strategy and positioning to clarify your message and stand out in your market.",
  macon_designs: "Visual identity and creative execution so your business looks professional and trustworthy.",
  ascendra: "Web systems, funnels, and automation to capture and convert more leads.",
};

export default function ResultsPage() {
  const router = useRouter();
  const { scores, answers } = useFunnel();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !scores && Object.keys(answers).length === 0) {
      router.replace("/diagnosis");
    }
  }, [mounted, scores, answers, router]);

  if (!mounted || !scores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading results…</div>
      </div>
    );
  }

  const { totalScore, brandScore, designScore, systemScore, primaryBottleneck, recommendation } = scores;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/diagnosis" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to diagnosis
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Your Growth Score
              </h1>
              <p className="text-muted-foreground">
                Based on your answers, here’s where you stand and what we recommend.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Overall</span>
                  <span>{totalScore}/100</span>
                </div>
                <Progress value={totalScore} className="h-3" />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Primary bottleneck</p>
                <p className="text-muted-foreground">{BOTTLENECK_LABELS[primaryBottleneck]}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Brand</p>
                  <p className="text-xl font-semibold text-foreground">{brandScore}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Design</p>
                  <p className="text-xl font-semibold text-foreground">{designScore}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">System</p>
                  <p className="text-xl font-semibold text-foreground">{systemScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Recommended next step</h2>
              <p className="text-primary font-medium">{RECOMMENDATION_LABELS[recommendation]}</p>
              <p className="text-sm text-muted-foreground">
                {RECOMMENDATION_DESCRIPTIONS[recommendation]}
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full sm:w-auto gap-2">
                <Link href="/apply">
                  Get Your Growth Plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
