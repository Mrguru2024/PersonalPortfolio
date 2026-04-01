"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, Loader2, RefreshCw, Radar, Database, FileText, ClipboardCheck } from "lucide-react";

type DashboardResponse = {
  projects: Array<{
    id: number;
    name: string;
    niche: string;
    location: string;
    status: string;
    lastRunAt: string | null;
    lastRunStatus: string | null;
    marketScore: number | null;
    confidenceScore: number | null;
  }>;
  sourceStatuses: Array<{
    sourceKey: string;
    label: string;
    enabled: boolean;
    setupStatus: string;
    fallbackEnabled: boolean;
    lastTestStatus: string | null;
    lastTestMessage: string | null;
  }>;
  recentFindings: Array<{
    id: number;
    projectId: number;
    sourceLabel: string;
    query: string | null;
    content: string;
    referenceUrl: string | null;
    createdAt: string;
  }>;
  savedReports: Array<{
    id: number;
    projectId: number;
    runId: number;
    projectName: string;
    marketScore: number;
    confidenceLevel: string;
    decision: string;
    createdAt: string;
  }>;
};

const STATUS_CLASS: Record<string, string> = {
  active: "bg-emerald-600 hover:bg-emerald-600 text-white",
  draft: "bg-muted text-foreground",
  archived: "bg-amber-700 hover:bg-amber-700 text-white",
};

const RUN_STATUS_CLASS: Record<string, string> = {
  completed: "bg-emerald-600 hover:bg-emerald-600 text-white",
  running: "bg-blue-600 hover:bg-blue-600 text-white",
  pending: "bg-muted text-foreground",
  failed: "bg-red-600 hover:bg-red-600 text-white",
};

const SETUP_STATUS_CLASS: Record<string, string> = {
  configured: "bg-emerald-600 hover:bg-emerald-600 text-white",
  partial: "bg-amber-700 hover:bg-amber-700 text-white",
  not_configured: "bg-muted text-foreground",
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function sourceSetupSummary(sourceStatuses: DashboardResponse["sourceStatuses"]) {
  const counts = { configured: 0, partial: 0, not_configured: 0 };
  for (const source of sourceStatuses) {
    if (source.setupStatus === "configured") counts.configured += 1;
    else if (source.setupStatus === "partial") counts.partial += 1;
    else counts.not_configured += 1;
  }
  return counts;
}

export default function MarketResearchEnginePage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [quickName, setQuickName] = useState("");

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ["/api/admin/growth-os/market-research/projects", "dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/admin/growth-os/market-research/projects", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load market research dashboard");
      return response.json();
    },
  });

  const createQuickProject = useMutation({
    mutationFn: async () => {
      const payload = {
        name: quickName.trim(),
        industry: "Unspecified",
        niche: "Unspecified",
        service: quickName.trim(), // Use project name as service to satisfy validation
        location: "",
        keywords: [],
        competitors: [],
        subreddits: [],
        sourcesEnabled: ["manual_input"],
        notes: "",
      };
      const response = await apiRequest("POST", "/api/admin/growth-os/market-research/projects", payload);
      return response.json() as Promise<{ project: { id: number } }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/growth-os/market-research/projects"] });
      setQuickName("");
      toast({ title: "Project created", description: "Complete intake on the project detail page." });
      router.push(`/admin/growth-os/market-research/${data.project.id}`);
    },
    onError: (error: Error) =>
      toast({ title: "Create failed", description: error.message, variant: "destructive" }),
  });

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = dashboardQuery.data?.projects ?? [];
    if (!q) return rows;
    return rows.filter((row) =>
      [row.name, row.niche, row.location, row.status, row.lastRunStatus ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [dashboardQuery.data?.projects, search]);

  const setupCounts = sourceSetupSummary(dashboardQuery.data?.sourceStatuses ?? []);
  const reportCount = dashboardQuery.data?.savedReports.length ?? 0;
  const findingCount = dashboardQuery.data?.recentFindings.length ?? 0;

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Radar className="h-4 w-4" aria-hidden />
          <span>Ascendra Market Research Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Research, scoring, and decision workflow</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Build structured market projects, run evidence-based research pipelines, review transparent scoring, and save
          decision reports.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{dashboardQuery.data?.projects.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Active market research workspaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Source setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {setupCounts.configured}/{(dashboardQuery.data?.sourceStatuses ?? []).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              configured · {setupCounts.partial} partial · {setupCounts.not_configured} missing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent findings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{findingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Latest captured evidence rows</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{reportCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Decision reports available for review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start new research</CardTitle>
          <CardDescription>
            Create a new project shell quickly, or open a full intake flow from an existing project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-md space-y-1">
            <Label htmlFor="quick-project-name">Project name</Label>
            <Input
              id="quick-project-name"
              placeholder="e.g. Austin med-spa retention campaign"
              value={quickName}
              onChange={(event) => setQuickName(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => createQuickProject.mutate()} disabled={!quickName.trim() || createQuickProject.isPending}>
              {createQuickProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New research
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/growth-os/market-research/setup">
                <Database className="h-4 w-4 mr-2" />
                Source setup
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/growth-os/market-research/projects"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Research projects</CardTitle>
            <Badge variant="secondary">{filteredProjects.length} visible</Badge>
          </div>
          <div className="max-w-sm relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-8"
              placeholder="Search name, niche, location, status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading projects…
            </div>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No projects match this filter.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2 font-normal">Name</th>
                    <th className="px-3 py-2 font-normal">Niche</th>
                    <th className="px-3 py-2 font-normal">Location</th>
                    <th className="px-3 py-2 font-normal">Scores</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="px-3 py-2 font-normal">Last run</th>
                    <th className="px-3 py-2 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-border/60 last:border-0 hover:bg-muted/25">
                      <td className="px-3 py-2 min-w-[210px]">
                        <p className="font-medium text-foreground">{project.name}</p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{project.niche}</td>
                      <td className="px-3 py-2 text-muted-foreground">{project.location || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          Market:{" "}
                          <span className="text-foreground font-medium">
                            {project.marketScore != null ? project.marketScore : "—"}
                          </span>
                          {" · "}
                          Confidence:{" "}
                          <span className="text-foreground font-medium">
                            {project.confidenceScore != null ? project.confidenceScore : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge className={STATUS_CLASS[project.status] ?? STATUS_CLASS.draft}>{project.status}</Badge>
                          {project.lastRunStatus ? (
                            <Badge className={RUN_STATUS_CLASS[project.lastRunStatus] ?? RUN_STATUS_CLASS.pending}>
                              {project.lastRunStatus}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(project.lastRunAt)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/growth-os/market-research/${project.id}`}>Open</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source status panel</CardTitle>
            <CardDescription>Global source readiness for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashboardQuery.data?.sourceStatuses ?? []).map((source) => (
              <div
                key={source.sourceKey}
                className="rounded-md border border-border/70 p-2 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{source.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.enabled ? "Enabled" : "Disabled"} · fallback {source.fallbackEnabled ? "on" : "off"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className={SETUP_STATUS_CLASS[source.setupStatus] ?? SETUP_STATUS_CLASS.not_configured}>
                    {source.setupStatus}
                  </Badge>
                  {source.lastTestStatus ? <Badge variant="outline">{source.lastTestStatus}</Badge> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent findings & saved reports</CardTitle>
            <CardDescription>Latest evidence rows and decision artifacts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent findings</h3>
              {(dashboardQuery.data?.recentFindings ?? []).slice(0, 6).map((finding) => (
                <div key={finding.id} className="rounded-md border border-border/60 p-2 text-xs">
                  <p className="text-foreground font-medium">{finding.sourceLabel}</p>
                  <p className="text-muted-foreground line-clamp-2 mt-1">{finding.content}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">{fmtDate(finding.createdAt)}</span>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" asChild>
                      <Link href={`/admin/growth-os/market-research/${finding.projectId}`}>View project</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {(dashboardQuery.data?.recentFindings ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No findings yet.</p>
              ) : null}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved reports</h3>
              {(dashboardQuery.data?.savedReports ?? []).slice(0, 6).map((report) => (
                <div key={report.id} className="rounded-md border border-border/60 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground font-medium">{report.projectName}</p>
                    <Badge variant="outline">{report.decision}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Market {report.marketScore} · Confidence {report.confidenceLevel}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" asChild>
                      <Link href={`/admin/growth-os/market-research/${report.projectId}?runId=${report.runId}`}>
                        <FileText className="h-3 w-3 mr-1" />
                        Open report
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {(dashboardQuery.data?.savedReports ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No saved reports yet.</p>
              ) : null}
            </section>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next step checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <div className="rounded-md border border-border/70 p-3">
            <p className="font-medium text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              1) Configure sources
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Validate setup and fallback data on the source setup screen.
            </p>
          </div>
          <div className="rounded-md border border-border/70 p-3">
            <p className="font-medium text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              2) Complete intake
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ensure service, keywords, or competitors are provided before running.
            </p>
          </div>
          <div className="rounded-md border border-border/70 p-3">
            <p className="font-medium text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              3) Run and review
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Inspect evidence-linked scores and recommendation rationale.
            </p>
          </div>
          <div className="rounded-md border border-border/70 p-3">
            <p className="font-medium text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              4) Compare reruns
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Compare latest runs to confirm direction before decision.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
