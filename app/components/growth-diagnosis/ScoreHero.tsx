"use client";

import { motion } from "framer-motion";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreHeroProps {
  overallScore: number;
  gradeLabel: string;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getRingColor(score: number): string {
  if (score >= 75) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  if (score >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

export function ScoreHero({ overallScore, gradeLabel, className }: ScoreHeroProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (overallScore / 100) * circumference;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-2xl border bg-card p-6 sm:p-8 shadow-sm", className)}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="relative flex-shrink-0">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={getRingColor(overallScore)}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
              {overallScore}
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Growth Readiness Score</h2>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{gradeLabel}</p>
          <p className="text-sm text-muted-foreground">
            This score reflects how well your site supports growth across performance, clarity, trust, and conversion.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
