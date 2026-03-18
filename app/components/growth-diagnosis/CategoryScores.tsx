"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AuditCategoryScore } from "@/lib/growth-diagnosis/types";
import { cn } from "@/lib/utils";

interface CategoryScoresProps {
  categoryScores: AuditCategoryScore[];
  className?: string;
}

function getBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function CategoryScores({ categoryScores, className }: CategoryScoresProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className={className}
    >
      <h2 className="text-xl font-semibold text-foreground mb-4">Scores by category</h2>
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">
            How your site stacks up across performance, clarity, trust, and conversion.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {categoryScores.map((cat, i) => (
              <AccordionItem key={cat.key} value={cat.key}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between gap-4 w-full pr-2">
                    <span className="font-medium text-foreground">{cat.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", getBarColor(cat.score))}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-8">{cat.score}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-2">{cat.explanation}</p>
                  {cat.recommendedFixes.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {cat.recommendedFixes.map((fix, j) => (
                        <li key={j}>{fix}</li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.section>
  );
}
