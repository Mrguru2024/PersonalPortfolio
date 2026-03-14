import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LeadMagnetSlug } from "@/lib/authorityContent";
import { LEAD_MAGNET_BY_SLUG } from "@/lib/authorityContent";
import { AUDIT_PATH } from "@/lib/funnelCtas";

export interface LeadMagnetCTAProps {
  /** Primary lead magnet for this content */
  leadMagnetSlug: LeadMagnetSlug;
  /** Show secondary CTA to Digital Growth Audit */
  showAuditCta?: boolean;
  /** Optional short intro line above the buttons */
  intro?: string;
  /** Compact (single row) or default (stacked) */
  variant?: "default" | "compact";
}

export function LeadMagnetCTA({
  leadMagnetSlug,
  showAuditCta = true,
  intro,
  variant = "default",
}: LeadMagnetCTAProps) {
  const primary = LEAD_MAGNET_BY_SLUG[leadMagnetSlug];
  const isAudit = leadMagnetSlug === "digital-growth-audit";

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardContent className="p-5 sm:p-6">
        {intro && (
          <p className="text-sm text-muted-foreground mb-4">{intro}</p>
        )}
        <div
          className={
            variant === "compact"
              ? "flex flex-wrap items-center gap-3"
              : "flex flex-col sm:flex-row flex-wrap gap-3"
          }
        >
          <Button asChild className="gap-2 min-h-[44px]">
            <Link href={primary.href}>
              {primary.cta}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
          {showAuditCta && !isAudit && (
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href={AUDIT_PATH}>Request Digital Growth Audit</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
