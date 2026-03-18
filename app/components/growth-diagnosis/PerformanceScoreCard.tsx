"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceScoreCardProps {
  score: number;
  label: string;
  explanation: string;
  className?: string;
}

function getColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function PerformanceScoreCard({
  score,
  label,
  explanation,
  className,
}: PerformanceScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{label}</h3>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn("text-2xl font-bold", getColor(score))}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </motion.div>
  );
}
