import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import type { InsightArticle } from "@/lib/authorityContent";
import { INSIGHT_CATEGORIES } from "@/lib/authorityContent";

export interface ArticleHeaderProps {
  article: InsightArticle;
  /** Optional back link (e.g. to /insights) */
  backHref?: string;
  backLabel?: string;
}

export function ArticleHeader({
  article,
  backHref = "/insights",
  backLabel = "Insights",
}: ArticleHeaderProps) {
  const categoryLabel =
    INSIGHT_CATEGORIES.find((c) => c.slug === article.category)?.label ??
    article.category;

  return (
    <header className="space-y-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      <p className="text-sm font-medium text-primary uppercase tracking-wide">
        {categoryLabel}
      </p>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
        {article.title}
      </h1>
      {article.subhead && (
        <p className="text-lg text-muted-foreground max-w-2xl">
          {article.subhead}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {format(new Date(article.publishedAt), "MMMM d, yyyy")}
      </p>
    </header>
  );
}
