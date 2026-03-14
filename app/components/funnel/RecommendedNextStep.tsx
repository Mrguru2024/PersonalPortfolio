import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AUDIT_PATH } from "@/lib/funnelCtas";
import { PREMIUM_OFFERS } from "@/lib/funnel-content";

interface RecommendedNextStepProps {
  /** Slug from PREMIUM_OFFERS or custom. */
  offerSlug?: "website-optimization" | "brand-website" | "business-growth";
  title?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  /** Optional second CTA. */
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export function RecommendedNextStep({
  offerSlug,
  title,
  description,
  ctaText = "Get your free audit",
  ctaHref = AUDIT_PATH,
  secondaryCtaText,
  secondaryCtaHref,
}: RecommendedNextStepProps) {
  const offer =
    offerSlug && PREMIUM_OFFERS
      ? PREMIUM_OFFERS.find((o) => o.slug === offerSlug)
      : null;
  const displayTitle = title ?? offer?.name ?? "Recommended next step";
  const displayDesc =
    description ?? offer?.outcome ?? "Get a clear path to your next step.";

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {displayTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{displayDesc}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm" className="gap-1.5">
            <Link href={ctaHref}>
              {ctaText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {secondaryCtaText && secondaryCtaHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
