"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, HelpCircle, AlertCircle, Globe, FileSearch } from "lucide-react";
import type { CrawlTargets, VerificationSummary, ExtractedPageSummary } from "@/lib/growth-diagnosis/types";
import { cn } from "@/lib/utils";

interface CrawlAndAccuracyProps {
  crawlTargets?: CrawlTargets | null;
  verificationSummary?: VerificationSummary | null;
  extractedSummaries?: ExtractedPageSummary[] | null;
  className?: string;
}

function stripPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === "/" || u.pathname === "" ? "Home" : u.pathname;
  } catch {
    return url;
  }
}

export function CrawlAndAccuracy({
  crawlTargets,
  verificationSummary,
  extractedSummaries,
  className,
}: CrawlAndAccuracyProps) {
  const hasCrawl = crawlTargets && crawlTargets.urlsAnalyzed.length > 0;
  const hasVerification = verificationSummary && verificationSummary.total > 0;
  const hasExtracted = extractedSummaries && extractedSummaries.length > 0;

  if (!hasCrawl && !hasVerification && !hasExtracted) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <FileSearch className="h-5 w-5 text-muted-foreground" />
        Crawl & accuracy
      </h2>
      <p className="text-sm text-muted-foreground">
        What we analyzed and how findings were verified — for diagnostics and audit transparency.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasCrawl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Pages analyzed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">
                We requested {crawlTargets!.urlsRequested.length} URL{crawlTargets!.urlsRequested.length !== 1 ? "s" : ""} and successfully analyzed {crawlTargets!.pagesAnalyzed}:
              </p>
              <ul className="text-xs font-mono text-foreground/90 space-y-0.5 mt-1">
                {crawlTargets!.urlsAnalyzed.map((u) => (
                  <li key={u} className="truncate" title={u}>
                    {stripPath(u)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {hasVerification && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Finding verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Each finding is checked against the crawled data to confirm accuracy.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span><strong>{verificationSummary!.verified}</strong> verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span><strong>{verificationSummary!.partial}</strong> partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span><strong>{verificationSummary!.lowConfidence ?? verificationSummary!.failed}</strong> low confidence</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {hasExtracted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">What we found (per page)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Key metrics we use for scoring — confirms crawling and extraction accuracy.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Page</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Title</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Meta</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">H1</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Words</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">CTA</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Form</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Viewport</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Imgs</th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Schema</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedSummaries!.map((p) => (
                    <tr key={p.url} className="border-b border-border/60">
                      <td className="py-1.5 px-2 font-mono truncate max-w-[120px]" title={p.url}>{stripPath(p.url)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{p.titleLength}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{p.metaDescLength}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{p.h1Count}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{p.wordCount}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{p.ctaCount}</td>
                      <td className="py-1.5 px-2 text-center">{p.hasForm ? "✓" : "—"}</td>
                      <td className="py-1.5 px-2 text-center">{p.viewportMeta ? "✓" : "—"}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{p.imagesWithAlt}/{p.imageCount}</td>
                      <td className="py-1.5 px-2 text-center">{p.hasSchema ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.section>
  );
}
