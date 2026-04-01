"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Play, RefreshCw, TestTube2, BarChart3, Save, Link2 } from "lucide-react";
import { MARKET_RESEARCH_SOURCE_KEYS, type MarketResearchSourceKey } from "@shared/marketResearchConstants";

type ProjectDetailResponse = {
  project: {
    id: number;
    name: string;
    industry: string;
    niche: string;
    service: string;
    location: string;
    keywords: string[];
    competitors: string[];
    subreddits: string[];
    sourcesEnabled: string[];
    notes: string | null;
    status: string;
    updatedAt: string;
  };
  runs: Array<{
    id: number;
    status: string;
    triggerType: string;
    createdAt: string;
    completedAt: string | null;
    errorMessage: string | null;
  }>;
  latest: {
    run: { id: number; status: string; createdAt: string } | null;
    report: {
      id: number;
      marketScore: number;
      confidenceLevel: string;
      decision: string;
      executiveSummary: string;
      reportJson: Record<string, unknown>;
    } | null;
    scores: Array<{
      id: number;
      dimensionKey: string;
      numericScore: number;
      explanation: string;
      evidenceFindingIds: number[];
    }>;
    recommendation: {
      id: number;
      acquisitionChannel: string;
      offerAngle: string;
      contentStrategy: string;
      funnelSuggestion: string;
      risks: string[];
      nextActions: string[];
      reasoning: string;
    } | null;
    findings: Array<{
      id: number;
      sourceLabel: string;
      query: string | null;
      content: string;
      referenceUrl: string | null;
      confidence: number;
      capturedAt: string;
    }>;
  };
  manualEntries: Array<{
    id: number;
    entryType: string;
    content: string;
    tags: string[];
    referenceUrl: string | null;
    createdAt: string;
  }>;
};

type SourceConfigsResponse = {
  sourceConfigs: Array<{
    sourceKey: string;
    enabled: boolean;
    setupStatus: string;
    fallbackEnabled: boolean;
    requirements: string[];
    setupSteps: string[];
    supportsConnectionTest: boolean;
    lastTestStatus: string | null;
    lastTestMessage: string | null;
    configJson: Record<string, unknown>;
  }>;
};

const SOURCE_LABELS: Record<MarketResearchSourceKey, string> = {
  google_trends: "Google Trends",
  google_ads_keyword_planner: "Google Ads Keyword Planner",
  reddit: "Reddit",
  meta_ads_manual: "Meta Ad Research",
  competitor_website: "Competitor Website Analysis",
  manual_input: "Manual Input",
};

function parseId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function splitCsv(value: string): string[] {
  return value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function MarketResearchProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = parseId(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const detailQuery = useQuery<ProjectDetailResponse>({
    queryKey: ["/api/admin/growth-os/market-research/projects/[id]", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/growth-os/market-research/projects/${projectId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load project details.");
      return response.json();
    },
    enabled: projectId != null,
  });

  const sourceConfigsQuery = useQuery<SourceConfigsResponse>({
    queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
    queryFn: async () => {
      const response = await fetch("/api/admin/growth-os/market-research/source-configs", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load source configs.");
      return response.json();
    },
    enabled: projectId != null,
  });

  const initial = detailQuery.data?.project;
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [niche, setNiche] = useState("");
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [competitorsText, setCompetitorsText] = useState("");
  const [subredditsText, setSubredditsText] = useState("");
  const [notes, setNotes] = useState("");
  const [sourcesEnabled, setSourcesEnabled] = useState<MarketResearchSourceKey[]>(["manual_input"]);

  const [manualContent, setManualContent] = useState("");
  const [manualTags, setManualTags] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [compareWithRunId, setCompareWithRunId] = useState<number | null>(null);

  const loadedFromProject = useMemo(
    () =>
      initial != null &&
      name.length === 0 &&
      industry.length === 0 &&
      niche.length === 0 &&
      service.length === 0 &&
      location.length === 0 &&
      keywordsText.length === 0 &&
      competitorsText.length === 0 &&
      subredditsText.length === 0 &&
      notes.length === 0,
    [
      initial,
      name,
      industry,
      niche,
      service,
      location,
      keywordsText,
      competitorsText,
      subredditsText,
      notes,
    ],
  );

  if (loadedFromProject && initial) {
    setName(initial.name ?? "");
    setIndustry(initial.industry ?? "");
    setNiche(initial.niche ?? "");
    setService(initial.service ?? "");
    setLocation(initial.location ?? "");
    setKeywordsText((initial.keywords ?? []).join(", "));
    setCompetitorsText((initial.competitors ?? []).join(", "));
    setSubredditsText((initial.subreddits ?? []).join(", "));
    setNotes(initial.notes ?? "");
    const normalized = (initial.sourcesEnabled ?? []).filter((key): key is MarketResearchSourceKey =>
      MARKET_RESEARCH_SOURCE_KEYS.includes(key as MarketResearchSourceKey),
    );
    setSourcesEnabled(normalized.length ? normalized : ["manual_input"]);
    if (detailQuery.data?.latest.run?.id != null && selectedRunId == null) {
      setSelectedRunId(detailQuery.data.latest.run.id);
    }
  }

  const runDetailQuery = useQuery({
    queryKey: ["/api/admin/growth-os/market-research/projects/[id]/runs/[runId]", projectId, selectedRunId],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/growth-os/market-research/projects/${projectId}/runs/${selectedRunId}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Failed to load run detail.");
      return response.json();
    },
    enabled: projectId != null && selectedRunId != null,
  });

  const compareQuery = useQuery({
    queryKey: ["/api/admin/growth-os/market-research/projects/[id]/compare", projectId, selectedRunId, compareWithRunId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRunId != null) params.append("runId", String(selectedRunId));
      if (compareWithRunId != null) params.append("runId", String(compareWithRunId));
      const response = await fetch(
        `/api/admin/growth-os/market-research/projects/${projectId}/compare?${params.toString()}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Need two completed runs for comparison.");
      return response.json();
    },
    enabled: projectId != null && selectedRunId != null && compareWithRunId != null,
  });

  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        industry: industry.trim(),
        niche: niche.trim(),
        service: service.trim(),
        location: location.trim(),
        keywords: splitCsv(keywordsText),
        competitors: splitCsv(competitorsText),
        subreddits: splitCsv(subredditsText),
        sourcesEnabled,
        notes: notes.trim(),
      };
      const response = await apiRequest(
        "PATCH",
        `/api/admin/growth-os/market-research/projects/${projectId}`,
        payload,
      );
      return response.json() as Promise<{ project: { id: number } }>;
    },
    onSuccess: () => {
      toast({ title: "Project updated", description: "Intake and source toggles were saved." });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/projects/[id]", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/projects", "dashboard"],
      });
    },
    onError: (error: Error) =>
      toast({ title: "Save failed", description: error.message, variant: "destructive" }),
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/admin/growth-os/market-research/projects/${projectId}/run`,
        { triggerType: "manual" },
      );
      return response.json();
    },
    onSuccess: (result: { run?: { id?: number } }) => {
      toast({ title: "Run completed", description: "Scores and report updated from latest evidence." });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/projects/[id]", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/projects", "dashboard"],
      });
      if (result.run?.id != null) setSelectedRunId(result.run.id);
    },
    onError: (error: Error) =>
      toast({ title: "Run failed", description: error.message, variant: "destructive" }),
  });

  const addManualMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        entryType: "note",
        content: manualContent.trim(),
        tags: splitCsv(manualTags),
        referenceUrl: manualLink.trim(),
      };
      const response = await apiRequest(
        "POST",
        `/api/admin/growth-os/market-research/projects/${projectId}/manual-entries`,
        payload,
      );
      return response.json();
    },
    onSuccess: () => {
      setManualContent("");
      setManualTags("");
      setManualLink("");
      toast({ title: "Manual entry added", description: "Entry will be included in the next run." });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/projects/[id]", projectId],
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not add entry", description: error.message, variant: "destructive" }),
  });

  const updateSourceMutation = useMutation({
    mutationFn: async (payload: {
      sourceKey: MarketResearchSourceKey;
      enabled?: boolean;
      fallbackEnabled?: boolean;
      configJson?: Record<string, unknown>;
    }) => {
      const response = await apiRequest(
        "PATCH",
        "/api/admin/growth-os/market-research/source-configs",
        payload,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
      });
      toast({ title: "Source config updated" });
    },
    onError: (error: Error) =>
      toast({ title: "Source update failed", description: error.message, variant: "destructive" }),
  });

  const testSourceMutation = useMutation({
    mutationFn: async (sourceKey: MarketResearchSourceKey) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/growth-os/market-research/source-configs/${sourceKey}/test`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
      });
      toast({ title: "Connection test complete" });
    },
    onError: (error: Error) =>
      toast({ title: "Connection test failed", description: error.message, variant: "destructive" }),
  });

  const selectedRun = runDetailQuery.data ?? null;
  const latest = detailQuery.data?.latest;

  return (
    <div className="space-y-6 pb-10">
      {detailQuery.isLoading ? (
        <div className="py-14 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading project…
        </div>
      ) : detailQuery.error || !detailQuery.data ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Could not load this project. Verify the id and access permissions.
          </CardContent>
        </Card>
      ) : (
        <>
          <header className="space-y-2">
            <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
              <Link href="/admin/growth-os/market-research">Back to market research dashboard</Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{detailQuery.data.project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Project intake, source setup, evidence capture, scoring, and decision reporting.
            </p>
            <p className="text-xs text-muted-foreground">Last updated: {fmtDate(detailQuery.data.project.updatedAt)}</p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Intake form</CardTitle>
              <CardDescription>
                At least one source is required and at least one of service/keywords/competitors must be provided.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Project Name</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Industry</Label>
                  <Input value={industry} onChange={(event) => setIndustry(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Niche</Label>
                  <Input value={niche} onChange={(event) => setNiche(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Service</Label>
                  <Input value={service} onChange={(event) => setService(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input value={location} onChange={(event) => setLocation(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Subreddits</Label>
                  <Input
                    value={subredditsText}
                    onChange={(event) => setSubredditsText(event.target.value)}
                    placeholder="r/marketing, r/smallbusiness"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Keywords</Label>
                  <Textarea
                    rows={3}
                    value={keywordsText}
                    onChange={(event) => setKeywordsText(event.target.value)}
                    placeholder="seo audit, local seo services, ..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Competitors</Label>
                  <Textarea
                    rows={3}
                    value={competitorsText}
                    onChange={(event) => setCompetitorsText(event.target.value)}
                    placeholder="Competitor A, Competitor B"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source toggles</Label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {MARKET_RESEARCH_SOURCE_KEYS.map((sourceKey) => {
                    const checked = sourcesEnabled.includes(sourceKey);
                    return (
                      <label
                        key={sourceKey}
                        className="rounded-md border border-border/70 px-3 py-2 flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            setSourcesEnabled((prev) => {
                              if (next === true) return [...new Set([...prev, sourceKey])];
                              const filtered = prev.filter((item) => item !== sourceKey);
                              return filtered.length > 0 ? filtered : ["manual_input"];
                            });
                          }}
                        />
                        <span>{SOURCE_LABELS[sourceKey]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Any internal context, assumptions, or constraints."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => saveProjectMutation.mutate()} disabled={saveProjectMutation.isPending}>
                  {saveProjectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save intake
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending || sourcesEnabled.length === 0}
                >
                  {runMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run research
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["/api/admin/growth-os/market-research/projects/[id]", projectId],
                    })
                  }
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source setup & tests</CardTitle>
                <CardDescription>Enable, test, and fallback-configure each source adapter.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(sourceConfigsQuery.data?.sourceConfigs ?? []).map((source) => {
                  const sourceKey = source.sourceKey as MarketResearchSourceKey;
                  return (
                    <div key={source.sourceKey} className="rounded-md border border-border/70 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{SOURCE_LABELS[sourceKey]}</p>
                          <p className="text-xs text-muted-foreground">
                            setup: {source.setupStatus} · fallback {source.fallbackEnabled ? "on" : "off"}
                          </p>
                          {source.lastTestMessage ? (
                            <p className="text-[11px] text-muted-foreground mt-1">{source.lastTestMessage}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline">{source.lastTestStatus ?? "not tested"}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={source.enabled ? "secondary" : "outline"}
                          onClick={() =>
                            updateSourceMutation.mutate({ sourceKey, enabled: !source.enabled })
                          }
                          disabled={updateSourceMutation.isPending}
                        >
                          {source.enabled ? "Enabled" : "Disabled"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateSourceMutation.mutate({
                              sourceKey,
                              fallbackEnabled: !source.fallbackEnabled,
                            })
                          }
                          disabled={updateSourceMutation.isPending}
                        >
                          Fallback {source.fallbackEnabled ? "on" : "off"}
                        </Button>
                        {source.supportsConnectionTest ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testSourceMutation.mutate(sourceKey)}
                            disabled={testSourceMutation.isPending}
                          >
                            <TestTube2 className="h-4 w-4 mr-1" />
                            Test
                          </Button>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Setup checklist</p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {source.setupSteps.map((step, idx) => (
                            <li key={`${source.sourceKey}-step-${idx}`}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manual research input</CardTitle>
                <CardDescription>
                  Add interview notes, desk-research snippets, or observed evidence with optional source link.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Content</Label>
                  <Textarea
                    rows={5}
                    value={manualContent}
                    onChange={(event) => setManualContent(event.target.value)}
                    placeholder="Paste real observed evidence here. Avoid assumptions."
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Tags</Label>
                    <Input
                      value={manualTags}
                      onChange={(event) => setManualTags(event.target.value)}
                      placeholder="pain-point, objection, offer-gap"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Source link</Label>
                    <Input
                      value={manualLink}
                      onChange={(event) => setManualLink(event.target.value)}
                      placeholder="https://example.com/source"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => addManualMutation.mutate()}
                  disabled={!manualContent.trim() || addManualMutation.isPending}
                >
                  {addManualMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add manual entry
                </Button>

                <div className="space-y-2 pt-2 border-t border-border/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent manual entries</p>
                  {(detailQuery.data.manualEntries ?? []).slice(0, 8).map((entry) => (
                    <div key={entry.id} className="rounded-md border border-border/60 p-2 text-xs">
                      <p className="text-foreground">{entry.content}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                        <span>{fmtDate(entry.createdAt)}</span>
                        {entry.tags.map((tag) => (
                          <Badge key={`${entry.id}-${tag}`} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                        {entry.referenceUrl ? (
                          <a
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            href={entry.referenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Link2 className="h-3 w-3" />
                            source
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {(detailQuery.data.manualEntries ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No manual entries yet.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Runs and comparison</CardTitle>
              <CardDescription>
                Review past runs, inspect score deltas, and open evidence-linked report output.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Primary run</Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={selectedRunId ?? ""}
                    onChange={(event) =>
                      setSelectedRunId(event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">Select run</option>
                    {detailQuery.data.runs.map((run) => (
                      <option key={run.id} value={run.id}>
                        #{run.id} · {run.status} · {fmtDate(run.createdAt)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Compare with</Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={compareWithRunId ?? ""}
                    onChange={(event) =>
                      setCompareWithRunId(event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">Select run</option>
                    {detailQuery.data.runs
                      .filter((run) => run.id !== selectedRunId)
                      .map((run) => (
                        <option key={run.id} value={run.id}>
                          #{run.id} · {run.status} · {fmtDate(run.createdAt)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {compareQuery.data ? (
                <div className="rounded-md border border-border/70 p-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Score deltas (run #{compareQuery.data.currentRun.id} vs #{compareQuery.data.previousRun.id})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Market score delta: {compareQuery.data.marketScoreDelta > 0 ? "+" : ""}
                    {compareQuery.data.marketScoreDelta}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {compareQuery.data.deltas.map((delta: { dimensionKey: string; delta: number; current: number; previous: number }) => (
                      <div key={delta.dimensionKey} className="rounded border border-border/60 px-2 py-1.5 text-xs">
                        <p className="text-foreground font-medium">{delta.dimensionKey}</p>
                        <p className="text-muted-foreground">
                          {delta.previous} → {delta.current} ({delta.delta > 0 ? "+" : ""}
                          {delta.delta})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : compareQuery.isError ? (
                <p className="text-xs text-muted-foreground">Select two completed runs to compare.</p>
              ) : null}

              {selectedRun ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-border/70 p-3">
                    <p className="text-sm font-medium text-foreground">
                      Run #{selectedRun.run.id} · {selectedRun.run.status}
                    </p>
                    {selectedRun.report ? (
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          Market score <strong>{selectedRun.report.marketScore}</strong> · Confidence{" "}
                          <strong>{selectedRun.report.confidenceLevel}</strong> · Decision{" "}
                          <strong>{selectedRun.report.decision}</strong>
                        </p>
                        <p className="text-muted-foreground">{selectedRun.report.executiveSummary}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">No report generated for this run.</p>
                    )}
                  </div>

                  <div className="grid gap-3 xl:grid-cols-2">
                    <div className="rounded-md border border-border/70 p-3 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Scores</p>
                      {selectedRun.scores.map((score: { id: number; dimensionKey: string; numericScore: number; explanation: string }) => (
                        <div key={score.id} className="text-xs rounded border border-border/60 p-2">
                          <p className="text-foreground font-medium">
                            {score.dimensionKey}: {score.numericScore}
                          </p>
                          <p className="text-muted-foreground mt-1">{score.explanation}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-md border border-border/70 p-3 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendation</p>
                      {selectedRun.recommendation ? (
                        <div className="text-xs space-y-1">
                          <p>
                            Channel: <strong>{selectedRun.recommendation.acquisitionChannel}</strong>
                          </p>
                          <p>{selectedRun.recommendation.offerAngle}</p>
                          <p className="text-muted-foreground">{selectedRun.recommendation.reasoning}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No recommendation row available.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-border/70 p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Supporting evidence</p>
                    {(selectedRun.findings ?? []).slice(0, 12).map((finding: {
                      id: number;
                      sourceLabel: string;
                      content: string;
                      query: string | null;
                      referenceUrl: string | null;
                      confidence: number;
                    }) => (
                      <div key={finding.id} className="rounded border border-border/60 p-2 text-xs">
                        <p className="text-foreground font-medium">
                          {finding.sourceLabel}
                          {finding.query ? ` · ${finding.query}` : ""}
                        </p>
                        <p className="text-muted-foreground mt-1">{finding.content}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground">
                          <span>confidence {(finding.confidence * 100).toFixed(0)}%</span>
                          {finding.referenceUrl ? (
                            <a
                              href={finding.referenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              source link
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {(selectedRun.findings ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No findings available for this run.</p>
                    ) : null}
                  </div>
                </div>
              ) : latest?.report ? (
                <div className="rounded-md border border-border/70 p-3 text-sm">
                  <p className="text-foreground font-medium">
                    Latest report · run #{latest.run?.id ?? "—"} · score {latest.report.marketScore}
                  </p>
                  <p className="text-muted-foreground mt-1">{latest.report.executiveSummary}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No completed runs yet. Run the project to generate scores.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
