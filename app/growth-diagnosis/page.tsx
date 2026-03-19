"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreHero } from "@/components/growth-diagnosis/ScoreHero";
import { PerformanceScoreCard } from "@/components/growth-diagnosis/PerformanceScoreCard";
import { StartupScoreCard } from "@/components/growth-diagnosis/StartupScoreCard";
import { BlockersAndQuickWins } from "@/components/growth-diagnosis/BlockersAndQuickWins";
import { CategoryScores } from "@/components/growth-diagnosis/CategoryScores";
import { CrawlAndAccuracy } from "@/components/growth-diagnosis/CrawlAndAccuracy";
import { AccuracyNotice } from "@/components/growth-diagnosis/AccuracyNotice";
import { PremiumUpsell } from "@/components/growth-diagnosis/PremiumUpsell";
import { BUSINESS_TYPES, PRIMARY_GOALS } from "@/lib/growth-diagnosis/constants";
import type { AuditReport } from "@/lib/growth-diagnosis/types";

const LOADING_STEPS = [
  "Scanning site structure",
  "Reviewing performance signals",
  "Checking trust and conversion elements",
  "Building your diagnosis",
  "Finalizing your score",
];

export default function GrowthDiagnosisPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"entry" | "loading" | "results">("entry");
  const [url, setUrl] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [email, setEmail] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prefillUrl = searchParams.get("url");
    if (prefillUrl) setUrl(prefillUrl);
  }, [searchParams]);

  const runAudit = async () => {
    const auditUrl = url.trim() || "https://example.com";
    setError(null);
    setStep("loading");
    setLoadingStepIndex(0);

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 1200);

    try {
      const res = await fetch("/api/growth-diagnosis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: auditUrl,
          businessType: businessType || undefined,
          primaryGoal: primaryGoal || undefined,
          email: email || undefined,
          demoMode: demoMode || !url.trim(),
        }),
      });
      clearInterval(stepInterval);
      setLoadingStepIndex(LOADING_STEPS.length - 1);

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        setStep("entry");
        return;
      }
      setReport(data.report);
      setStep("results");
    } catch (e) {
      clearInterval(stepInterval);
      setError("We couldn't complete the audit. Try demo mode or try again.");
      setStep("entry");
      if (e instanceof Error) console.error("Growth diagnosis error:", e.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAudit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <AnimatePresence mode="wait">
          {step === "entry" && (
            <motion.div
              key="entry"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <section className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Search className="h-7 w-7" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                  Website Growth Diagnosis
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
                  Get a clear picture of your site's performance, clarity, and growth opportunities. 
                  We'll scan your site and show you where you're strong and where to improve.
                </p>
                <div className="relative w-full max-w-2xl mx-auto aspect-[21/9] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                  <Image src="/stock images/Web Design_2.jpeg" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 512px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" aria-hidden />
                </div>
              </section>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">Run your diagnosis</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your website URL. Optionally tell us your business type and goal so we can tailor the results.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="url">Website URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://yoursite.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Business type (optional)</Label>
                        <Select value={businessType} onValueChange={setBusinessType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Primary goal (optional)</Label>
                        <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIMARY_GOALS.map((g) => (
                              <SelectItem key={g.value} value={g.value}>
                                {g.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional — to unlock full report later)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="demo"
                        checked={demoMode}
                        onChange={(e) => setDemoMode(e.target.checked)}
                        className="rounded border-input"
                        aria-label="Use demo mode (sample report without crawling)"
                      />
                      <Label htmlFor="demo" className="text-sm font-normal cursor-pointer">
                        Use demo mode (sample report without crawling)
                      </Label>
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button type="submit" className="gap-2" disabled={!url.trim() && !demoMode}>
                      Start diagnosis
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Analyzing your site</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {LOADING_STEPS.map((label, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 ${i <= loadingStepIndex ? "text-foreground" : ""}`}
                  >
                    {i < loadingStepIndex ? (
                      <span className="text-primary">✓</span>
                    ) : i === loadingStepIndex ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className="w-4" />
                    )}
                    {label}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {step === "results" && report && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => { setStep("entry"); setReport(null); }}>
                  ← Run another diagnosis
                </Button>
              </div>

              <ScoreHero
                overallScore={report.summary.overallScore}
                gradeLabel={report.summary.gradeLabel}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <PerformanceScoreCard
                  score={report.websitePerformanceScore.score}
                  label={report.websitePerformanceScore.label}
                  explanation={report.websitePerformanceScore.explanation}
                />
                <StartupScoreCard
                  score={report.startupWebsiteScore.score}
                  label={report.startupWebsiteScore.label}
                  explanation={report.startupWebsiteScore.explanation}
                />
              </div>

              <BlockersAndQuickWins
                topBlockers={report.summary.topBlockers}
                quickWins={report.summary.quickWins}
              />

              <CategoryScores categoryScores={report.summary.categoryScores} />

              <CrawlAndAccuracy
                crawlTargets={report.crawlTargets}
                verificationSummary={report.verificationSummary}
                extractedSummaries={report.extractedSummaries}
              />

              <AccuracyNotice variantIndex={0} />

              <PremiumUpsell overallScore={report.summary.overallScore} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
