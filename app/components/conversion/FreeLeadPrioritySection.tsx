"use client";

import Link from "next/link";
import { ArrowRight, Target, Sparkles, Search, LayoutGrid } from "lucide-react";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FREE_LEAD_OFFERS_IN_ORDER } from "@/lib/funnelCtas";

const ICONS = {
  free_trial: Target,
  free_diagnosis: Sparkles,
  free_audit: Search,
  free_toolkit: LayoutGrid,
} as const;

export interface FreeLeadPrioritySectionProps {
  /** When true, “Free toolkit” links to `#all-tools` on the current page (hub only). */
  toolkitHashOnThisPage?: boolean;
  pageVisited: string;
  className?: string;
}

/**
 * Renders the four ordered free leads (value-first trial → diagnosis → audit → toolkit) for hubs and landing pages.
 */
export function FreeLeadPrioritySection({
  toolkitHashOnThisPage = false,
  pageVisited,
  className = "",
}: FreeLeadPrioritySectionProps) {
  return (
    <section
      className={`rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5 sm:p-8 ${className}`}
      aria-label="Recommended free offers in priority order"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
        Start here — value first, then depth
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-6 sm:mb-8">
        Start on the free trial page for the value-first path (call + audit). After that, use the audit link, automated
        diagnosis, and toolkit in order when you want more depth—not as a substitute for experiencing how we work.
      </p>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0">
        {FREE_LEAD_OFFERS_IN_ORDER.map((offer) => {
          const Icon = ICONS[offer.id];
          const href =
            toolkitHashOnThisPage && offer.id === "free_toolkit" ? "#all-tools" : offer.href;
          const ctaLabel =
            offer.id === "free_trial"
              ? "Start free trial"
              : offer.id === "free_diagnosis"
                ? "Run free diagnosis"
                : offer.id === "free_audit"
                  ? "Get free audit"
                  : "Browse free toolkit";
          return (
            <li key={offer.id}>
              <Card className="h-full border-border/80 bg-card shadow-sm">
                <CardContent className="px-5 py-5 sm:px-7 sm:py-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {offer.rank}
                    </span>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{offer.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{offer.description}</p>
                  <Button asChild className="w-full sm:w-auto gap-2 min-h-[44px] mt-auto">
                    {href.startsWith("#") ? (
                      <Link href={href} className="inline-flex items-center gap-2">
                        {ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <TrackedCtaLink
                        href={href}
                        ctaLabel={`priority_${offer.id}`}
                        pageVisited={pageVisited}
                        className="inline-flex items-center gap-2"
                      >
                        {ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </TrackedCtaLink>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
