"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/client-growth/growthSnapshotParts";

export interface GrowthScaleSectionProps {
  readonly scale: ClientGrowthSnapshot["scale"];
}

export function GrowthScaleSection({ scale }: GrowthScaleSectionProps) {
  return (
    <section id="scale" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
        <h2 className="text-lg sm:text-xl font-semibold">Scale</h2>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard label="Leads (est. week)" value={scale.leadsThisWeekApprox} />
            <MetricCard label="Bookings tracked" value={scale.bookingsCount} />
            <div className="rounded-lg border bg-card/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Top channel signal</p>
              <p className="text-sm font-semibold mt-1">{scale.topChannelLabel ?? "—"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{scale.trendHint}</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {scale.improvementBullets.map((t, idx) => (
              <li key={`${idx}-${t.slice(0, 40)}`}>{t}</li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full sm:w-auto border-emerald-500/40">
            <Link href={scale.nextCta.href}>{scale.nextCta.label}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
