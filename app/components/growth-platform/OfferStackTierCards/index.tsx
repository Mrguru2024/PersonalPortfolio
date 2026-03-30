"use client";

import Link from "next/link";
import { ASCENDRA_OFFER_STACK, type AscendraOfferTier, formatUsdRange } from "@shared/ascendraOfferStack";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ORDER: AscendraOfferTier[] = ["DFY", "DWY", "DIY"];

export function OfferStackTierCards({ highlightTier }: { highlightTier?: AscendraOfferTier | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ORDER.map((tier) => {
        const o = ASCENDRA_OFFER_STACK[tier];
        const primary = o.ctas.find((c) => c.variant === "primary");
        const secondary = o.ctas.find((c) => c.variant === "secondary");
        const highlight = highlightTier === tier;
        return (
          <Card
            key={tier}
            className={
              highlight
                ? "border-primary shadow-md ring-2 ring-primary/25"
                : tier === "DFY"
                  ? "border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] to-card"
                  : undefined
            }
          >
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={tier === "DFY" ? "default" : "secondary"}>{o.tier}</Badge>
                {tier === "DFY" ?
                  <span className="text-xs text-muted-foreground">Primary revenue</span>
                : null}
              </div>
              <CardTitle className="text-lg">{o.title}</CardTitle>
              <CardDescription>{o.headlineOutcome}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome focus</p>
                <p className="text-foreground/90">{o.roiFramingExample}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timeline</p>
                <p>{o.timelineSummary}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deliverables</p>
                <p>{o.deliverablesSummary}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing (ranges)</p>
                {o.pricing.setup ?
                  <p>
                    Setup: {formatUsdRange(o.pricing.setup)} · Monthly: {formatUsdRange(o.pricing.monthly)}
                  </p>
                : null}
                {o.pricing.program ?
                  <p>Program: {formatUsdRange(o.pricing.program)}</p>
                : null}
                {!o.pricing.setup && !o.pricing.program ?
                  <p>{o.pricing.note}</p>
                : (
                  <p className="text-xs text-muted-foreground mt-1">{o.pricing.note}</p>
                )}
              </div>
              <div className="rounded-md border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-relaxed">
                <strong className="text-foreground">Risk clarity:</strong> {o.riskReversalSummary}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              {primary ?
                <Button asChild className="w-full sm:flex-1" size="sm">
                  <Link href={primary.href}>{primary.label}</Link>
                </Button>
              : null}
              {secondary ?
                <Button asChild variant="outline" className="w-full sm:flex-1" size="sm">
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              : null}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
