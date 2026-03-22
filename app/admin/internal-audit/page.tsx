"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, ExternalLink, ChevronDown, ListOrdered } from "lucide-react";
import {
  DEFAULT_INTERNAL_AUDIT_PROJECT_KEY,
  workspaceLabelForProjectKey,
} from "@/lib/internal-audit/defaultAuditProjectKey";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AuditRunRow {
  id: number;
  projectKey: string;
  targetSiteUrl: string | null;
  label: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  summaryJson: Record<string, unknown> | null;
}

const AUDIT_PROJECT_STORAGE_KEY = "internal-audit-workspace-id";

export default function InternalAuditDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [projectKey, setProjectKey] = useState(DEFAULT_INTERNAL_AUDIT_PROJECT_KEY);
  const [clientSiteUrl, setClientSiteUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(AUDIT_PROJECT_STORAGE_KEY);
      if (saved && saved.trim()) setProjectKey(saved.trim());
    } catch {
      /* ignore */
    }
  }, []);

  const effectiveProjectKey = useMemo(
    () => (projectKey.trim() ? projectKey.trim() : DEFAULT_INTERNAL_AUDIT_PROJECT_KEY),
    [projectKey],
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(AUDIT_PROJECT_STORAGE_KEY, effectiveProjectKey);
    } catch {
      /* ignore */
    }
  }, [effectiveProjectKey]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/internal-audit/runs", effectiveProjectKey, statusFilter],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("projectKey", effectiveProjectKey);
      if (statusFilter !== "all") q.set("status", statusFilter);
      const res = await fetch(`/api/admin/internal-audit/runs?${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load runs");
      return res.json() as Promise<{ runs: AuditRunRow[] }>;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const trimmedSite = clientSiteUrl.trim();
      const res = await fetch("/api/admin/internal-audit/runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey: effectiveProjectKey,
          ...(trimmedSite ? { targetSiteUrl: trimmedSite } : {}),
          execute: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Run failed");
      }
      return res.json() as Promise<{ detail: { run: { id: number } } }>;
    },
    onSuccess: (body) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/internal-audit/runs"] });
      const id = body.detail?.run?.id;
      toast({
        title: "Audit finished",
        description: id ? "Opening your latest report." : "Refresh the list to open a run.",
      });
      if (id) router.push(`/admin/internal-audit/${id}`);
    },
    onError: (e: Error) => toast({ title: "Could not run audit", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-primary shrink-0" />
            How to use this audit
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Runs are saved so you can compare before-and-after. Results list concrete checks (files and database
            counts), not guesses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground">Run an audit</span> — leave the client URL empty for this workspace, or
              enter their <code className="text-xs bg-muted px-1 rounded">https://…</code> site for a public-page crawl.
            </li>
            <li>
              <span className="text-foreground">Open the report</span> and read each category: score, what we
              verified, then recommendations.
            </li>
            <li>
              <span className="text-foreground">Filter</span> by category or file path when you are fixing a specific
              area.
            </li>
            <li>
              <span className="text-foreground">Run again</span> after changes to confirm checks pass and scores move.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run a new audit</CardTitle>
          <CardDescription>
            <span className="text-foreground font-medium">Workspace audit</span> — this deployment&apos;s repo files and
            your database. <span className="text-foreground font-medium">Client site audit</span> — enter their public
            https URL; we fetch common paths (home, contact, pricing, etc.) and score funnel signals from HTML only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xl">
            <Label htmlFor="client-site-url">Client site URL (optional)</Label>
            <Input
              id="client-site-url"
              type="url"
              inputMode="url"
              placeholder="https://client-example.com"
              value={clientSiteUrl}
              onChange={(e) => setClientSiteUrl(e.target.value)}
              autoComplete="off"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Only <code className="text-[10px] bg-muted px-1 rounded">https://</code> public hosts. Local/private networks
              are blocked. Some sites may block automated requests — if a crawl fails, try again or audit key pages
              manually.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="min-w-[160px]"
            >
              {runMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              {clientSiteUrl.trim() ? "Run client site audit" : "Run workspace audit"}
            </Button>
            {runMutation.isPending && (
              <span className="text-sm text-muted-foreground">
                {clientSiteUrl.trim() ? "Fetching public pages…" : "Checking files and database…"}
              </span>
            )}
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 px-0 text-muted-foreground hover:text-foreground">
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                Multiple workspaces? (advanced)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-2 max-w-lg rounded-md border border-border/60 bg-muted/20 p-3">
                <p className="text-sm text-foreground">
                  <strong className="font-medium">Workspace ID</strong> is an internal label stored with each audit run.
                  It matches the <code className="text-xs bg-muted px-1 rounded">project_key</code> used elsewhere in
                  Growth OS and Content Studio so reports stay grouped in the database.
                </p>
                <p className="text-xs text-muted-foreground">
                  For this portfolio app you almost always leave the default. Change it only if you intentionally run
                  several isolated workspaces against one codebase.
                </p>
                <div className="space-y-1 pt-1">
                  <Label htmlFor="project-key">Workspace ID</Label>
                  <Input
                    id="project-key"
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value)}
                    className="font-mono text-sm"
                    placeholder={DEFAULT_INTERNAL_AUDIT_PROJECT_KEY}
                    autoComplete="off"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past reports</CardTitle>
          <CardDescription>Open any run to see verified checks, scores, and recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Label className="shrink-0">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <div className="rounded-lg border border-border/60 divide-y">
              {(data?.runs ?? []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No reports yet. Run an audit above to create the first one.
                </p>
              ) : (
                data!.runs.map((r) => {
                  const overall = (r.summaryJson as { overallScore?: number } | null)?.overallScore;
                  return (
                    <div
                      key={r.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium flex flex-wrap items-center gap-2">
                          {r.label ?? `Report #${r.id}`}
                          {r.targetSiteUrl ? (
                            <Badge variant="outline" className="font-normal">
                              Client crawl
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-normal">
                              Workspace
                            </Badge>
                          )}
                          <Badge variant="secondary" className="capitalize">
                            {r.status}
                          </Badge>
                          {overall != null && (
                            <Badge variant="outline">Overall {overall}/100</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {workspaceLabelForProjectKey(r.projectKey)}
                          {r.projectKey !== DEFAULT_INTERNAL_AUDIT_PROJECT_KEY && (
                            <span className="font-mono text-[10px] opacity-80"> ({r.projectKey})</span>
                          )}
                          <span className="text-muted-foreground/80"> · </span>
                          {format(new Date(r.startedAt), "PPp")}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/internal-audit/${r.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View report
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
