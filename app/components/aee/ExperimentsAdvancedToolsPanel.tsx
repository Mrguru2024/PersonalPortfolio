"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, Check, RefreshCw, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MetricTooltip } from "@/components/aee/MetricTooltip";
import Link from "next/link";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ExperimentsAdvancedToolsPanel() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const rollupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/experiments/rollup", {});
      return res.json() as {
        workspaceKey?: string;
        fromDate?: string;
        toDate?: string;
        visitorRowsScanned?: number;
        rowsInserted?: number;
      };
    },
    onSuccess: (data) => {
      const parts = [
        data.rowsInserted != null ? `${data.rowsInserted} row(s) written` : null,
        data.visitorRowsScanned != null ? `${data.visitorRowsScanned} visitor rows scanned` : null,
      ].filter(Boolean);
      toast({
        title: "Rollup completed",
        description: parts.length > 0 ? parts.join(" · ") : "Metrics refreshed for the default window.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Rollup failed", description: e.message, variant: "destructive" });
    },
  });

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: "Copied", description: "Paste into docs or API client." });
    } else {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <MetricTooltip
            label="Advanced testing tools"
            explanation="Ops for this deployment: recompute daily metric slices, copy API paths, and jump to analytics for site-level behavior alongside experiments."
          />
        </CardTitle>
        <CardDescription>Rollups, endpoints, and fused analytics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={rollupMutation.isPending}
            onClick={() => rollupMutation.mutate()}
          >
            {rollupMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden />
            )}
            Refresh metrics rollup
          </Button>
          <MetricTooltip
            label="API"
            className="text-xs font-normal"
            explanation='POST /api/admin/experiments/rollup with optional JSON body { "from", "to", "workspaceKey" }. Default window is the last 7 days (UTC).'
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Uses the same job that fills <code className="text-[0.7rem] bg-muted px-1 rounded">aee_experiment_metrics_daily</code>.
          Open an experiment detail page after running to see updated totals.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">API paths</p>
          <ul className="space-y-2 text-sm">
            <li className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
              <code className="text-xs break-all flex-1 min-w-0">
                GET {origin || "…"}/api/admin/experiments
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                aria-label="Copy list experiments URL"
                onClick={() => handleCopy("list", `${origin}/api/admin/experiments`)}
              >
                {copied === "list" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </li>
            <li className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
              <code className="text-xs break-all flex-1 min-w-0">
                POST {origin || "…"}/api/admin/experiments
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                aria-label="Copy create experiment URL"
                onClick={() => handleCopy("create", `${origin}/api/admin/experiments`)}
              >
                {copied === "create" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/analytics">Website analytics</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/experiments/patterns">Content patterns</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
