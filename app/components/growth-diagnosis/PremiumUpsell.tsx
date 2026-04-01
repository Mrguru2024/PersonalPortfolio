"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PremiumUpsellState } from "@/lib/growth-diagnosis/types";
import { MARKETING_CTA_BOOK_STRATEGY_CALL } from "@shared/marketingCtaCopy";

interface PremiumUpsellProps {
  overallScore: number;
  className?: string;
}

function getUpsellCopy(score: number): PremiumUpsellState {
  if (score < 50) {
    return {
      showUpsell: true,
      variant: "low",
      ctaTitle: "Book a Human Growth Diagnosis",
      ctaDescription: "Your site has critical lead flow problems. Get a custom action plan and implementation priorities from our team.",
    };
  }
  if (score < 75) {
    return {
      showUpsell: true,
      variant: "mid",
      ctaTitle: "Get a Custom Action Plan",
      ctaDescription: "There are clear opportunities to improve. Schedule a strategy review for tailored next steps and conversion lift.",
    };
  }
  return {
    showUpsell: true,
    variant: "high",
    ctaTitle: "Request a Custom Audit + Strategy Review",
    ctaDescription: "Your site has a solid base. Unlock advanced growth opportunities and scaling strategy with a human diagnosis.",
  };
}

export function PremiumUpsell({ overallScore, className }: PremiumUpsellProps) {
  const { ctaTitle, ctaDescription } = getUpsellCopy(overallScore);
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.3 }}
      className={className}
    >
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg mb-1">{ctaTitle}</h3>
              <p className="text-sm text-muted-foreground">{ctaDescription}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button asChild className="gap-2">
                <Link href="/digital-growth-audit">
                  Request your audit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/strategy-call">
                  <Calendar className="h-4 w-4" />
                  {MARKETING_CTA_BOOK_STRATEGY_CALL}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
