"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineItemBlock } from "@/components/client-growth/growthSnapshotParts";

export interface GrowthBuildSectionProps {
  readonly build: ClientGrowthSnapshot["build"];
}

export function GrowthBuildSection({ build }: GrowthBuildSectionProps) {
  return (
    <section id="build" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-600 shrink-0" aria-hidden />
        <h2 className="text-lg sm:text-xl font-semibold">Build</h2>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <p className="text-sm text-muted-foreground">{build.activationSummary}</p>
          <LineItemBlock title="Funnel" items={build.funnel} />
          <LineItemBlock title="Messaging" items={build.messaging} />
          <LineItemBlock title="Capture" items={build.capture} />
          <LineItemBlock title="Follow-up" items={build.followUp} />
          <Button variant="secondary" asChild className="w-full sm:w-auto">
            <Link href={build.nextCta.href}>
              {build.nextCta.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
