"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEAD_AUDIT_CATEGORY_KEYS, LEAD_AUDIT_CATEGORY_LABELS } from "@/lib/internal-audit/leadAuditCategories";
import type { LeadAuditCategoryKey, LeadAuditEvidenceItem } from "@/lib/internal-audit/leadAuditCategories";
import { priorityLabel, strengthStateLabel } from "@/lib/internal-audit/auditUiLabels";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";
import { useMemo, useState, useEffect } from "react";

const DB_SNAPSHOT_LABELS: Record<string, string> = {
  growthExperiments: "Growth experiments (rows)",
  visitorActivity: "Visitor activity events (rows)",
  crmContacts: "CRM contacts (rows)",
  funnelContentAssets: "Funnel content assets (rows)",
  siteOffers: "Site offers (rows)",
  publishedBlogPosts: "Published blog posts",
};

export function InternalAuditRunDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const categoryFilter = searchParams.get("categoryKey") ?? "";
  const pathFilter = searchParams.get("path") ?? "";
  const [pathDraft, setPathDraft] = useState(pathFilter);

  useEffect(() => {
    setPathDraft(pathFilter);
  }, [pathFilter]);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    if (categoryFilter) q.set("categoryKey", categoryFilter);
    if (pathFilter) q.set("path", pathFilter);
    return q.toString();
  }, [categoryFilter, pathFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/internal-audit/runs", id, queryString],
    queryFn: async () => {
      const path = queryString
        ? `/api/admin/internal-audit/runs/${id}?${queryString}`
        : `/api/admin/internal-audit/runs/${id}`;
      const res = await fetch(path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load run");
      return res.json() as Promise<{
        run: {
          id: number;
          status: string;
          projectKey: string;
          targetSiteUrl: string | null;
          summaryJson: Record<string, unknown> | null;
          clientSafeSummaryJson: Record<string, unknown> | null;
        };
        scores: Array<{
          categoryKey: string;
          score: number;
          strengthState: string;
          whyItMatters: string | null;
          risk: string | null;
          implementationPriority: string;
          evidence: LeadAuditEvidenceItem[];
        }>;
        recommendations: Array<{
          id: number;
          categoryKey: string;
          title: string;
          detail: string | null;
          relatedPaths: string[];
          priority: string;
        }>;
      }>;
    },
  });

  function setCategoryFilter(value: string) {
    const q = new URLSearchParams(searchParams.toString());
    if (value && value !== "__all__") q.set("categoryKey", value);
    else q.delete("categoryKey");
    router.push(`/admin/internal-audit/${id}?${q.toString()}`);
  }

  function applyPathFilter() {
    const q = new URLSearchParams(searchParams.toString());
    if (pathDraft.trim()) q.set("path", pathDraft.trim());
    else q.delete("path");
    router.push(`/admin/internal-audit/${id}?${q.toString()}`);
  }

  const rawSnapshot = data?.run.summaryJson?.dbSnapshot;
  const externalCrawl =
    rawSnapshot &&
    typeof rawSnapshot === "object" &&
    (rawSnapshot as { auditKind?: string }).auditKind === "external_site"
      ? (rawSnapshot as { baseUrl?: string; fetchedUrls?: string[]; pagesSucceeded?: number })
      : null;
  const dbSnapshot =
    !externalCrawl && rawSnapshot && typeof rawSnapshot === "object"
      ? (rawSnapshot as Record<string, number>)
      : undefined;
  const hasEvidence = (data?.scores ?? []).some((s) => (s.evidence?.length ?? 0) > 0);
  const isClientCrawl = Boolean(data?.run.targetSiteUrl);

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/internal-audit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All reports
        </Link>
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter this report</CardTitle>
          <CardDescription>
            Narrow recommendations by funnel category, or by text in a related file path / crawled URL (e.g.{" "}
            <code className="text-xs bg-muted px-1 rounded">app/api/funnel</code> or{" "}
            <code className="text-xs bg-muted px-1 rounded">/pricing</code>). Press Apply for path.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="space-y-1 min-w-[200px]">
            <Label>Category</Label>
            <Select
              value={categoryFilter || "__all__"}
              onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {LEAD_AUDIT_CATEGORY_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {LEAD_AUDIT_CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label htmlFor="path-filter">Path contains</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="path-filter"
                placeholder="e.g. app/api/admin/crm"
                value={pathDraft}
                onChange={(e) => setPathDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPathFilter()}
                className="font-mono text-sm flex-1 min-w-[180px]"
              />
              <Button type="button" variant="secondary" size="default" onClick={applyPathFilter}>
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
      {error && (
        <p className="text-destructive text-sm">{error instanceof Error ? error.message : "Something went wrong"}</p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {data.run.status}
            </Badge>
            {isClientCrawl ? (
              <Badge variant="outline">Client site crawl</Badge>
            ) : (
              <Badge variant="outline">Workspace (repo + DB)</Badge>
            )}
            <VisibilityBadge tier="internal_only" />
            <span className="text-sm text-muted-foreground">Admin-only report · not shown to site visitors.</span>
          </div>

          {isClientCrawl && data.run.targetSiteUrl && (
            <Card className="border-primary/20 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Audited site</CardTitle>
                <CardDescription>
                  Scores use public HTML only — not the client&apos;s analytics or CRM. Use workspace audit for this
                  Ascendra stack.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={data.run.targetSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary underline break-all"
                >
                  {data.run.targetSiteUrl}
                </a>
              </CardContent>
            </Card>
          )}

          {externalCrawl && (externalCrawl.fetchedUrls?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pages fetched (this crawl)</CardTitle>
                <CardDescription>
                  Successful HTML responses used for this report ({externalCrawl.pagesSucceeded ?? 0} page
                  {externalCrawl.pagesSucceeded === 1 ? "" : "s"}).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm font-mono space-y-1.5 break-all">
                  {(externalCrawl.fetchedUrls ?? []).map((u) => (
                    <li key={u}>
                      <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {dbSnapshot && Object.keys(dbSnapshot).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Database snapshot (this run)</CardTitle>
                <CardDescription>
                  Raw counts queried when the audit ran. Use them to verify the report against your data (e.g. after
                  imports or campaigns).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2 text-sm">
                  {Object.entries(dbSnapshot)
                    .filter(([, val]) => typeof val === "number")
                    .map(([key, val]) => (
                    <li
                      key={key}
                      className="flex justify-between gap-4 rounded-md border border-border/50 px-3 py-2 bg-muted/30"
                    >
                      <span className="text-muted-foreground">{DB_SNAPSHOT_LABELS[key] ?? key}</span>
                      <span className="font-mono tabular-nums font-medium">
                        {val < 0 ? "—" : val}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Scores by category</CardTitle>
              <CardDescription>
                {isClientCrawl
                  ? "Each score is derived from the checks below (public HTML crawl — forms, CTAs, scripts, headings)."
                  : "Each score is derived from the checks below (files present on server and selected database counts)."}{" "}
                {!hasEvidence && (
                  <span className="text-amber-700 dark:text-amber-300">
                    This run has no stored check details (older report). Run a new audit for line-by-line proof.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.scores.map((s) => (
                <div key={s.categoryKey} className="rounded-lg border border-border/60 p-4 space-y-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">
                      {LEAD_AUDIT_CATEGORY_LABELS[s.categoryKey as LeadAuditCategoryKey] ?? s.categoryKey}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{s.score}/100</Badge>
                      <Badge variant="secondary">{strengthStateLabel(s.strengthState)}</Badge>
                      <Badge variant="outline">{priorityLabel(s.implementationPriority)} priority</Badge>
                    </div>
                  </div>
                  {s.whyItMatters && <p className="text-sm text-muted-foreground">{s.whyItMatters}</p>}
                  {s.risk && (
                    <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-500/10 rounded-md px-3 py-2">
                      {s.risk}
                    </p>
                  )}

                  {s.evidence && s.evidence.length > 0 && (
                    <div className="rounded-md bg-muted/40 border border-border/50 overflow-hidden">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 border-b border-border/50">
                        Verified in this run
                      </div>
                      <ul className="divide-y divide-border/50">
                        {s.evidence.map((row) => (
                          <li
                            key={`${s.categoryKey}-${row.check}`}
                            className="px-3 py-2.5 flex gap-3 text-sm"
                          >
                            <span className="shrink-0 mt-0.5" aria-hidden>
                              {row.passed ? (
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                            </span>
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-medium text-foreground">{row.check}</div>
                              <div className="text-muted-foreground text-xs leading-relaxed">{row.proof}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Suggested next steps. Related paths point to code or admin areas to review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recommendations match the current filters. Clear filters or pick another category.
                </p>
              ) : (
                data.recommendations.map((r) => (
                  <div key={r.id} className="rounded-md border border-border/50 p-4 space-y-2">
                    <div className="font-medium">{r.title}</div>
                    {r.detail && <p className="text-sm text-muted-foreground">{r.detail}</p>}
                    {(r.relatedPaths ?? []).length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="text-muted-foreground font-medium">
                          {isClientCrawl ? "Related URLs / notes" : "Related paths"}
                        </span>
                        <ul className="font-mono text-muted-foreground list-disc list-inside">
                          {r.relatedPaths.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Badge variant="outline">{priorityLabel(r.priority)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {data.run.clientSafeSummaryJson && (
            <Card>
              <CardHeader>
                <CardTitle>Shareable summary (JSON)</CardTitle>
                <CardDescription>
                  A shortened, non-sensitive rollup of this run (scores and top action titles). Use if you need to paste
                  into another tool or document; it is still admin-only in this app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64 border border-border/50">
                  {JSON.stringify(data.run.clientSafeSummaryJson, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
