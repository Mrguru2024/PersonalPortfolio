"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FlaskConical, LineChart, RefreshCw, Search, Zap } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AUTOMATION_JOB_VALUES,
  formatAutomationJobType,
  formatResearchItemKind,
  formatResearchSource,
  humanizeSnakeCase,
} from "@/lib/growth-os/friendlyCopy";

const PROJECT = "ascendra_main";

export default function GrowthOsIntelligencePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [seed, setSeed] = useState("Ascendra growth marketing");
  const [focus, setFocus] = useState<"mixed" | "keyword" | "topic" | "phrase" | "headline">("mixed");
  const [genPhrase, setGenPhrase] = useState("");
  const [automationJob, setAutomationJob] = useState("weekly_research_digest");
  const [automationDocumentId, setAutomationDocumentId] = useState("");

  const automationNeedsDocumentId =
    automationJob === "content_insight_save" ||
    automationJob === "content_insight_schedule" ||
    automationJob === "headline_hook_variants" ||
    automationJob === "repurposing_suggestions";
  const automationDocumentIdParsed = Number.parseInt(automationDocumentId, 10);
  const automationDocumentOk =
    !automationNeedsDocumentId ||
    (Number.isFinite(automationDocumentIdParsed) && automationDocumentIdParsed > 0);

  const dash = useQuery({
    queryKey: ["/api/admin/growth-os/intelligence/dashboards", PROJECT],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/growth-os/intelligence/dashboards?projectKey=${encodeURIComponent(PROJECT)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load dashboards");
      return res.json() as Promise<{
        intelligenceMode: string;
        leadGeneration: Record<string, unknown>;
        contentPerformance: Record<string, unknown>;
        operational: Record<string, unknown>;
      }>;
    },
  });

  const researchItems = useQuery({
    queryKey: ["/api/admin/growth-os/intelligence/research/items", PROJECT],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/growth-os/intelligence/research/items?projectKey=${encodeURIComponent(PROJECT)}&limit=60`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load research");
      return res.json() as Promise<{
        items: Array<{
          id: number;
          phrase: string;
          itemKind: string;
          source: string;
          relevanceScore: number;
          trendDirection: string;
          suggestedUsage: string | null;
        }>;
        batches: Array<{ id: number; label: string | null; providerMode: string }>;
      }>;
    },
  });

  const weekly = useQuery({
    queryKey: ["/api/admin/growth-os/intelligence/research/weekly-summary", PROJECT],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/growth-os/intelligence/research/weekly-summary?projectKey=${encodeURIComponent(PROJECT)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed weekly summary");
      return res.json() as Promise<{
        totalItems: number;
        byKind: Record<string, number>;
        topOpportunities: Array<{ phrase: string; itemKind: string; relevanceScore: number }>;
        dataMode: string;
      }>;
    },
  });

  const automationRuns = useQuery({
    queryKey: ["/api/admin/growth-os/intelligence/automation/runs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/growth-os/intelligence/automation/runs?limit=25", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed runs");
      return res.json() as Promise<{
        runs: Array<{ id: number; jobType: string; status: string; resultSummary: string | null }>;
      }>;
    },
  });

  const runResearch = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/growth-os/intelligence/research/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: PROJECT, seed, focus }),
      });
      if (!res.ok) throw new Error("Research run failed");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/growth-os/intelligence/research/items"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/growth-os/intelligence/research/weekly-summary"] });
      toast({
        title: "Research batch created",
        description: `${data.itemCount} items · ${data.providerMode} (${data.providerLabel})`,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const genPosts = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/growth-os/intelligence/research/generate-posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: PROJECT, phrase: genPhrase, count: 2 }),
      });
      if (!res.ok) throw new Error("Generate failed");
      return res.json() as Promise<{ documentIds: number[] }>;
    },
    onSuccess: (data) => {
      toast({
        title: "Draft posts created",
        description: `IDs: ${data.documentIds.join(", ")}`,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const runAutomation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        jobType: automationJob,
        projectKey: PROJECT,
      };
      if (automationNeedsDocumentId && automationDocumentOk) {
        body.documentId = automationDocumentIdParsed;
      }
      const res = await fetch("/api/admin/growth-os/intelligence/automation/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Automation failed");
      return res.json() as Promise<{ ok: boolean; message: string }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/growth-os/intelligence/automation/runs"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/growth-os/intelligence/dashboards"] });
      toast({ title: data.ok ? "Automation started" : "Automation issue", description: data.message });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Growth intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Research topics, run background jobs, and view rollups. Everything here stays internal until you put a
          sanitized summary into <span className="font-medium text-foreground">Client shares</span>.
        </p>
      </div>

      <Alert>
        <AlertTitle>How this area works</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">Dashboards</strong> show live JSON rollups from CRM, blog, and
            Content Studio (handy for debugging). <strong className="text-foreground">Research</strong> stores
            discovery items you can turn into drafts. <strong className="text-foreground">Automation</strong> runs
            scheduled-style jobs on demand (some need a document id from Content Studio).
          </p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="dashboards" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboards" className="gap-1">
            <LineChart className="h-4 w-4" />
            Dashboards
          </TabsTrigger>
          <TabsTrigger value="research" className="gap-1">
            <Search className="h-4 w-4" />
            Research
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-1">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1">
            <FlaskConical className="h-4 w-4" />
            Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="space-y-4">
          {dash.isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : dash.error ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>{(dash.error as Error).message}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={dash.data?.intelligenceMode === "live" ? "default" : "secondary"}>
                  {dash.data?.intelligenceMode === "live" ? "Live AI" : "Demo / mock data"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void qc.invalidateQueries({
                      queryKey: ["/api/admin/growth-os/intelligence/dashboards", PROJECT],
                    })
                  }
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh
                </Button>
                <span className="text-xs text-muted-foreground">
                  Uses demo data when <code className="text-foreground">OPENAI_API_KEY</code> is missing or{" "}
                  <code className="text-foreground">GOS_INTELLIGENCE_MODE=mock</code>.
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Raw JSON below is meant for admins checking pipelines — share client-facing text only through{" "}
                <span className="text-foreground font-medium">Client shares</span>.
              </p>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Lead generation</CardTitle>
                    <CardDescription>CRM + tasks rollup</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto text-muted-foreground">
                    {JSON.stringify(dash.data?.leadGeneration, null, 2)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content performance</CardTitle>
                    <CardDescription>Blog + internal studio mix</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto text-muted-foreground">
                    {JSON.stringify(dash.data?.contentPerformance, null, 2)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Operational discipline</CardTitle>
                    <CardDescription>Calendar + AI review queue</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-auto text-muted-foreground">
                    {JSON.stringify(dash.data?.operational, null, 2)}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run discovery</CardTitle>
              <CardDescription>
                Pull a batch of ideas related to your seed. Each run is marked live vs demo. Items feed the weekly
                summary card beside this form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-w-xl">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void qc.invalidateQueries({
                      queryKey: ["/api/admin/growth-os/intelligence/research/items", PROJECT],
                    })
                  }
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh lists
                </Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor="intel-seed">Starting topic or keywords</Label>
                <Textarea
                  id="intel-seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  rows={2}
                  placeholder="Example: B2B SaaS onboarding emails, Ascendra portfolio leads, Chicago small business SEO"
                />
                <p className="text-xs text-muted-foreground">
                  One or two plain sentences is enough — the job expands into related angles.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="intel-focus">What to lean toward</Label>
                <Select value={focus} onValueChange={(v) => setFocus(v as typeof focus)}>
                  <SelectTrigger id="intel-focus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Balanced mix (recommended)</SelectItem>
                    <SelectItem value="keyword">Search-style keywords</SelectItem>
                    <SelectItem value="topic">Broad themes</SelectItem>
                    <SelectItem value="phrase">Short phrases / angles</SelectItem>
                    <SelectItem value="headline">Headline-style hooks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => runResearch.mutate()} disabled={runResearch.isPending || !seed.trim()}>
                {runResearch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Run discovery
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly opportunity summary</CardTitle>
                <CardDescription>Last 7 days · {weekly.data?.dataMode}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {weekly.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <p className="text-muted-foreground">Total items: {weekly.data?.totalItems}</p>
                    <ul className="text-xs bg-muted/50 p-2 rounded-md space-y-1 max-h-40 overflow-auto">
                      {Object.keys(weekly.data?.byKind ?? {}).length === 0 ? (
                        <li className="text-muted-foreground">No items yet this week.</li>
                      ) : (
                        Object.entries(weekly.data?.byKind ?? {}).map(([k, n]) => (
                          <li key={k} className="flex justify-between gap-2">
                            <span>{formatResearchItemKind(k)}</span>
                            <span className="text-muted-foreground tabular-nums">{String(n)}</span>
                          </li>
                        ))
                      )}
                    </ul>
                    <ul className="list-disc pl-4 space-y-1">
                      {(weekly.data?.topOpportunities ?? []).slice(0, 6).map((o, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{o.phrase}</span>{" "}
                          <span className="text-muted-foreground">
                            ({formatResearchItemKind(o.itemKind)} · score {o.relevanceScore})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generate posts from keyword</CardTitle>
                <CardDescription>Creates internal CMS draft captions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-w-md">
                <Input
                  placeholder="e.g. AI compliance checklist for startups"
                  value={genPhrase}
                  onChange={(e) => setGenPhrase(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Creates internal drafts in Content Studio — review before publishing.
                </p>
                <Button
                  size="sm"
                  onClick={() => genPosts.mutate()}
                  disabled={genPosts.isPending || !genPhrase.trim()}
                >
                  {genPosts.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Generate drafts
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent research items</CardTitle>
              <CardDescription>Source column shows openai vs mock_catalog</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {researchItems.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-2">Phrase</th>
                      <th className="py-2 pr-2">Type</th>
                      <th className="py-2 pr-2">Source</th>
                      <th className="py-2 pr-2">Score</th>
                      <th className="py-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(researchItems.data?.items ?? []).map((it) => (
                      <tr key={it.id} className="border-b border-border/60">
                        <td className="py-2 pr-2 max-w-[200px] truncate">{it.phrase}</td>
                        <td className="py-2 pr-2">{formatResearchItemKind(it.itemKind)}</td>
                        <td className="py-2 pr-2">
                          <Badge variant={it.source.includes("mock") ? "secondary" : "default"}>
                            {formatResearchSource(it.source)}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2">{it.relevanceScore}</td>
                        <td className="py-2">{humanizeSnakeCase(it.trendDirection)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run a background job</CardTitle>
              <CardDescription>
                Same jobs the cron route can trigger — useful for testing. Insight-on-save also runs from Content
                Studio when enabled (see Providers tab).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 max-w-xl">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  void qc.invalidateQueries({
                    queryKey: ["/api/admin/growth-os/intelligence/automation/runs"],
                  })
                }
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh run history
              </Button>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <Label htmlFor="auto-job">Job</Label>
                  <Select value={automationJob} onValueChange={setAutomationJob}>
                    <SelectTrigger id="auto-job">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTOMATION_JOB_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatAutomationJobType(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => runAutomation.mutate()}
                  disabled={runAutomation.isPending || !automationDocumentOk}
                >
                {runAutomation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Execute
                </Button>
              </div>
              {automationNeedsDocumentId ? (
                <div className="space-y-1">
                  <Label>Internal CMS document ID</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="e.g. 42"
                    value={automationDocumentId}
                    onChange={(e) => setAutomationDocumentId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for insight and variant jobs. Open the document in Content Studio to read its ID from
                    the URL.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent automation runs</CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono space-y-2 max-h-64 overflow-auto">
              {(automationRuns.data?.runs ?? []).map((r) => (
                <div key={r.id} className="border-b border-border/40 pb-2">
                  <span className="text-foreground">{formatAutomationJobType(r.jobType)}</span>{" "}
                  <span className="text-muted-foreground font-mono text-[10px]">({r.jobType})</span>{" "}
                  <Badge variant="outline">{r.status}</Badge>
                  <div className="text-muted-foreground">{r.resultSummary}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Provider configuration</CardTitle>
              <CardDescription>Server-only environment variables</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <code className="text-foreground">OPENAI_API_KEY</code> — enables live AI insights & research when{" "}
                <code className="text-foreground">GOS_INTELLIGENCE_MODE</code> is not forced to mock.
              </p>
              <p>
                <code className="text-foreground">GOS_INTELLIGENCE_MODE</code> — <code>mock</code> |{" "}
                <code>live</code> (optional override).
              </p>
              <p>
                <code className="text-foreground">GOS_OPENAI_MODEL</code> — defaults to{" "}
                <code>gpt-4o-mini</code>.
              </p>
              <p>
                <code className="text-foreground">GOS_AUTO_CONTENT_INSIGHT_ON_SAVE=true</code> — run insight on
                every CMS document PATCH.
              </p>
              <p>
                <code className="text-foreground">GOS_AUTO_CONTENT_INSIGHT_ON_SCHEDULE=false</code> — disable
                schedule trigger (default: enabled).
              </p>
              <p>
                Client token view:{" "}
                <code className="text-foreground">GET /api/public/gos/report/[token]</code> or human page{" "}
                <code className="text-foreground">/gos/report/[token]</code>
              </p>
              <p>
                <code className="text-foreground">GOS_PUBLIC_REPORT_MAX_PER_MINUTE</code> — per-IP cap in production
                (default 60).
              </p>
              <p>
                <code className="text-foreground">CRON_SECRET</code> — required for{" "}
                <code className="text-foreground">GET /api/cron/growth-os</code> (Vercel Cron sends{" "}
                <code className="text-foreground">Authorization: Bearer …</code>). Daily: stale content + editorial
                gaps; Mondays UTC: weekly research digest. Configure <code className="text-foreground">vercel.json</code>{" "}
                <code className="text-foreground">crons</code> (Pro plan on Vercel).
              </p>
              <p>
                Policy share builder:{" "}
                <code className="text-foreground">POST /api/admin/growth-os/client-safe/build-share</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
