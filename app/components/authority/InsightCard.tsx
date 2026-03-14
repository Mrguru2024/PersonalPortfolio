import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InsightArticle, LeadMagnetSlug } from "@/lib/authorityContent";
import { INSIGHT_CATEGORIES, LEAD_MAGNET_BY_SLUG } from "@/lib/authorityContent";
import { format } from "date-fns";

export interface InsightCardProps {
  article: InsightArticle;
  /** If true, show a CTA to the article's lead magnet. Set to false to hide. */
  showLeadMagnetCta?: boolean;
}

export function InsightCard({ article, showLeadMagnetCta = true }: InsightCardProps) {
  const categoryLabel =
    INSIGHT_CATEGORIES.find((c) => c.slug === article.category)?.label ??
    article.category;

  const ctaConfig =
    showLeadMagnetCta && LEAD_MAGNET_BY_SLUG[article.leadMagnetSlug as LeadMagnetSlug]
      ? {
          href: LEAD_MAGNET_BY_SLUG[article.leadMagnetSlug as LeadMagnetSlug].href,
          label: LEAD_MAGNET_BY_SLUG[article.leadMagnetSlug as LeadMagnetSlug].cta,
        }
      : null;

  return (
    <Card className="border-border bg-card h-full flex flex-col">
      <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
          {categoryLabel}
        </p>
        <h2 className="text-lg font-semibold text-foreground leading-tight mb-2">
          <Link
            href={`/insights/${article.slug}`}
            className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
          >
            {article.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-3">
          {article.description}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {format(new Date(article.publishedAt), "MMM d, yyyy")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary p-0 h-auto font-medium">
            <Link href={`/insights/${article.slug}`}>
              Read article
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {ctaConfig && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={ctaConfig.href}>{ctaConfig.label}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
