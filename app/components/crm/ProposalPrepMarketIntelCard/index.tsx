"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProposalPrepMarketIntelMeta, ProposalPrepMarketIntelSource } from "@shared/crmSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminAgentReplyText } from "@/components/admin/AdminAgentReplyText";
import { BarChart3, ExternalLink, Loader2, RefreshCw } from "lucide-react";

export interface ProposalPrepMarketIntelCardProps {
  workspaceId: string;
  summary: string | null | undefined;
  sources: ProposalPrepMarketIntelSource[] | null | undefined;
  meta: ProposalPrepMarketIntelMeta | null | undefined;
}

export function ProposalPrepMarketIntelCard({ workspaceId, summary, sources, meta }: ProposalPrepMarketIntelCardProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/proposal-prep/${workspaceId}/market-intel`, {});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/proposal-prep", workspaceId] });
      toast({ title: "Market intel updated", description: "Fresh web context saved to this workspace." });
    },
    onError: (e: Error) => toast({ title: "Market intel failed", description: e.message, variant: "destructive" }),
  });

  const updated =
    meta?.generatedAt ?
      new Date(meta.generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market & pricing intel
            </CardTitle>
            <CardDescription>
              Live web search (Brave) plus AI synthesis grounded in those snippets only — not verified comps or legal
              advice. Refresh before important calls; fill offer direction and scope first for better queries.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="shrink-0 gap-2"
          >
            {refreshMutation.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : <RefreshCw className="h-4 w-4" />}
            Refresh analysis
          </Button>
        </div>
        {updated && (
          <p className="text-xs text-muted-foreground pt-1">
            Last run: {updated}
            {meta?.braveConfigured === false && (
              <span className="block mt-1 text-amber-600 dark:text-amber-500">
                BRAVE_SEARCH_API_KEY not set — enable Brave for real-time web grounding.
              </span>
            )}
            {meta?.noLiveSources && meta.braveConfigured && (
              <span className="block mt-1">No results returned for the generated queries — try refining offer direction.</span>
            )}
          </p>
        )}
        {meta?.queriesUsed && meta.queriesUsed.length > 0 && (
          <details className="text-xs text-muted-foreground mt-2">
            <summary className="cursor-pointer hover:text-foreground">Search queries used</summary>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {meta.queriesUsed.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </details>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ?
          <div className="rounded-lg border border-border/60 bg-card p-3 dark:bg-muted/20">
            <AdminAgentReplyText text={summary} />
          </div>
        : (
          <p className="text-sm text-muted-foreground">
            No analysis yet. Click <strong>Refresh analysis</strong> to pull current public pages and generate a grounded
            brief. Requires <code className="text-xs">OPENAI_API_KEY</code>; strongly recommended:{" "}
            <code className="text-xs">BRAVE_SEARCH_API_KEY</code>.
          </p>
        )}

        {sources && sources.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Sources (verify independently)</p>
            <ul className="space-y-2 text-sm">
              {sources.map((s) => (
                <li key={s.url} className="flex gap-2 items-start">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {s.title || s.url}
                    </a>
                    {s.snippet ?
                      <span className="block text-muted-foreground text-xs mt-0.5">{s.snippet}</span>
                    : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
