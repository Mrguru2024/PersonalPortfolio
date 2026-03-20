"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEAD_AUDIT_CATEGORY_LABELS } from "@/lib/internal-audit/leadAuditCategories";
import type { LeadAuditCategoryKey } from "@/lib/internal-audit/leadAuditCategories";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";
import { useMemo } from "react";

export function InternalAuditRunDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const categoryFilter = searchParams.get("categoryKey") ?? "";
  const pathFilter = searchParams.get("path") ?? "";

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    if (categoryFilter) q.set("categoryKey", categoryFilter);
    if (pathFilter) q.set("path", pathFilter);
    return q.toString();
  }, [categoryFilter, pathFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/internal-audit/runs", id, queryString],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/internal-audit/runs/${id}${queryString ? `?${queryString}` : ""}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load run");
      return res.json() as Promise<{
        run: {
          id: number;
          status: string;
          projectKey: string;
          clientSafeSummaryJson: Record<string, unknown> | null;
        };
        scores: Array<{
          categoryKey: string;
          score: number;
          strengthState: string;
          whyItMatters: string | null;
          risk: string | null;
          implementationPriority: string;
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

  function setFilter(key: "categoryKey" | "path", value: string) {
    const q = new URLSearchParams(searchParams.toString());
    if (value) q.set(key, value);
    else q.delete(key);
    router.push(`/admin/internal-audit/${id}?${q.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/internal-audit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All runs
        </Link>
      </Button>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label>Category</Label>
          <Input
            placeholder="e.g. lead_capture"
            value={categoryFilter}
            onChange={(e) => setFilter("categoryKey", e.target.value)}
            className="w-56"
          />
        </div>
        <div className="space-y-1">
          <Label>Path contains</Label>
          <Input
            placeholder="app/api/..."
            value={pathFilter}
            onChange={(e) => setFilter("path", e.target.value)}
            className="w-56"
          />
        </div>
      </div>

      {isLoading && <Loader2 className="h-8 w-8 animate-spin" />}
      {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{data.run.status}</Badge>
            <VisibilityBadge tier="internal_only" />
            <span className="text-sm text-muted-foreground">Client-safe summary stored (not public).</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scores by category</CardTitle>
              <CardDescription>Strength states are heuristic from score bands.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.scores.map((s) => (
                <div key={s.categoryKey} className="rounded-lg border border-border/60 p-4 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">
                      {LEAD_AUDIT_CATEGORY_LABELS[s.categoryKey as LeadAuditCategoryKey] ?? s.categoryKey}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{s.score}</Badge>
                      <Badge variant="secondary">{s.strengthState}</Badge>
                      <Badge>{s.implementationPriority}</Badge>
                    </div>
                  </div>
                  {s.whyItMatters && <p className="text-sm text-muted-foreground">{s.whyItMatters}</p>}
                  {s.risk && <p className="text-sm text-amber-700 dark:text-amber-300">{s.risk}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recommendations in this filter.</p>
              ) : (
                data.recommendations.map((r) => (
                  <div key={r.id} className="rounded-md border border-border/50 p-3">
                    <div className="font-medium">{r.title}</div>
                    {r.detail && <p className="text-sm text-muted-foreground mt-1">{r.detail}</p>}
                    <div className="text-xs font-mono mt-2 text-muted-foreground">
                      {(r.relatedPaths ?? []).join(", ") || "—"}
                    </div>
                    <Badge className="mt-2" variant="outline">
                      {r.priority}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {data.run.clientSafeSummaryJson && (
            <Card>
              <CardHeader>
                <CardTitle>Client-safe summary (preview)</CardTitle>
                <CardDescription>Structured for a future tokenized client API — admin-only today.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64">
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
