"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AuditRecommendation } from "@/lib/growth-diagnosis/types";

interface BlockersAndQuickWinsProps {
  topBlockers: AuditRecommendation[];
  quickWins: AuditRecommendation[];
}

export function BlockersAndQuickWins({ topBlockers, quickWins }: BlockersAndQuickWinsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card className="border-amber-200/50 dark:border-amber-900/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-foreground">Top growth blockers</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              These issues appear to be creating friction for visitors.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBlockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No major blockers identified.</p>
            ) : (
              topBlockers.map((b, i) => (
                <div key={b.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium text-foreground text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.recommendation ?? b.impact}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Card className="border-emerald-200/50 dark:border-emerald-900/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-foreground">Quick wins</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              These improvements can boost trust, clarity, and conversion.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickWins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quick wins in this run. Focus on the blockers above.</p>
            ) : (
              quickWins.map((q) => (
                <div key={q.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium text-foreground text-sm">{q.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{q.recommendation ?? q.impact}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
