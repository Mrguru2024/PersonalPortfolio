"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FunnelCtaItem } from "@/lib/funnelConversionCtas";
import { markFunnelSurfaceComplete } from "@/lib/funnelMicroCommitment";
import { useVisitorTracking } from "@/lib/useVisitorTracking";

export function GrowthKitNextStepsClient({ ctas }: { ctas: FunnelCtaItem[] }) {
  const { track } = useVisitorTracking();
  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      {ctas.map((cta) => (
        <Button key={cta.href + cta.label} asChild variant={cta.variant} className="gap-2 min-h-[44px]">
          <Link
            href={cta.href}
            onClick={() => {
              markFunnelSurfaceComplete("startup-growth-kit", { asFirstTouch: true });
              track("funnel_micro_step", {
                pageVisited: "/resources/startup-growth-kit",
                metadata: { urgencySurface: "startup-growth-kit", step: "next_step_click", targetHref: cta.href },
              });
            }}
          >
            {cta.label}
            {cta.variant === "default" ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </Link>
        </Button>
      ))}
    </div>
  );
}
