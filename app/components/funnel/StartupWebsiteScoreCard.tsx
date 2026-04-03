"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gauge, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STARTUP_ACTION_PLAN_PATH, REVENUE_CALCULATOR_PATH } from "@/lib/funnelCtas";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { markFunnelSurfaceComplete } from "@/lib/funnelMicroCommitment";

const QUESTIONS = [
  {
    id: "offer-clear",
    label: "Does your homepage clearly explain what you offer?",
    hint: "A visitor should understand what you do and who it's for within a few seconds.",
  },
  {
    id: "capture-leads",
    label: "Do you capture leads (email or contact)?",
    hint: "A simple form or clear way for visitors to take the next step.",
  },
  {
    id: "cta-clear",
    label: "Is your call to action clear and visible?",
    hint: "One primary action (e.g. Book a call, Get the guide) that stands out.",
  },
  {
    id: "builds-trust",
    label: "Does your website build trust?",
    hint: "Proof, credentials, testimonials, or clear positioning.",
  },
  {
    id: "mobile-friendly",
    label: "Is your website mobile friendly?",
    hint: "Readable and usable on phones and small screens.",
  },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getSuggestions(answers: Record<string, number>): string[] {
  const suggestions: string[] = [];
  if ((answers["offer-clear"] ?? 0) < 2) suggestions.push("Clarify your offer and who it's for in the hero section.");
  if ((answers["capture-leads"] ?? 0) < 2) suggestions.push("Add a simple lead capture (email or contact form) with one clear next step.");
  if ((answers["cta-clear"] ?? 0) < 2) suggestions.push("Make one primary call-to-action obvious and above the fold.");
  if ((answers["builds-trust"] ?? 0) < 2) suggestions.push("Add trust signals: proof, credentials, or social proof.");
  if ((answers["mobile-friendly"] ?? 0) < 2) suggestions.push("Test and improve your site on mobile; many visitors are on phones.");
  if (suggestions.length === 0) suggestions.push("You're in good shape. Focus on traffic and small conversion improvements.");
  return suggestions;
}

export function StartupWebsiteScoreCard() {
  const router = useRouter();
  const { track } = useVisitorTracking();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const completionLogged = useRef(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined);
  const total = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
  const maxTotal = QUESTIONS.length * 3;
  const score = allAnswered ? Math.round((total / maxTotal) * 100) : 0;
  const suggestions = getSuggestions(answers);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allAnswered) setSubmitted(true);
  };

  useEffect(() => {
    if (!submitted || typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (u.searchParams.get("quiz_complete") === "1") return;
    u.searchParams.set("quiz_complete", "1");
    router.replace(`${u.pathname}${u.search}`, { scroll: false });
  }, [submitted, router]);

  useEffect(() => {
    if (!submitted || completionLogged.current) return;
    completionLogged.current = true;
    markFunnelSurfaceComplete("startup-website-score");
    track("tool_used", {
      pageVisited: "/tools/startup-website-score",
      metadata: { urgencySurface: "startup-website-score", step: "score_complete", tool: "startup_website_score" },
    });
  }, [submitted, track]);

  if (submitted) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Website readiness score</h3>
          </div>
          <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="font-medium text-foreground">Your score</span>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score} / 100
            </span>
          </div>
          <h4 className="font-medium text-foreground mb-2">Improvement suggestions</h4>
          <ul className="space-y-2 mb-6">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mb-4">
            Get a step-by-step action plan to improve your online presence—without a full agency budget.
          </p>
          <Button asChild className="w-full sm:w-auto gap-2 min-h-[44px]">
            <Link href={STARTUP_ACTION_PLAN_PATH}>
              View startup action plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div className="mt-4 pt-4 border-t border-border">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={REVENUE_CALCULATOR_PATH}>
                Estimate revenue opportunity
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Startup website score</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Answer five quick questions about your current website. We'll give you a readiness score (0–100) and improvement suggestions.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-foreground mb-2">
                {q.label}
              </label>
              <p className="text-xs text-muted-foreground mb-2">{q.hint}</p>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      answers[q.id] === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {value === 0 && "No"}
                    {value === 1 && "Somewhat"}
                    {value === 2 && "Yes"}
                    {value === 3 && "Strongly yes"}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button type="submit" disabled={!allAnswered} className="gap-2 min-h-[44px]">
            <CheckCircle2 className="h-4 w-4" />
            Get my score
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
