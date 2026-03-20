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
import { Loader2, FlaskConical, LineChart, Search, Zap } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROJECT = "ascendra_main";

export default function GrowthOsIntelligencePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [seed, setSeed] = useState("Ascendra growth marketing");
  const [focus, setFocus] = useState<"mixed" | "keyword" | "topic" | "phrase" | "headline">("mixed");
  const [genPhrase, setGenPhrase] = useState("");
  const [automationJob, setAutomationJob] = useState("weekly_research_digest");

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
      const res = await fetch("/api/admin/growth-os/intelligence/automation/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobType: automationJob, projectKey: PROJECT }),
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
        <p className="text-sm text-muted-foreground mt-1">
          Internal-only scoring and research. Client exposure uses{" "}
          <span className="font-medium text-foreground">Client shares</span> and policy builders only.
        </p>
      </div>

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
                  AI mode: {dash.data?.intelligenceMode}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Mock when <code className="text-foreground">OPENAI_API_KEY</code> missing or{" "}
                  <code className="text-foreground">GOS_INTELLIGENCE_MODE=mock</code>
                </span>
              </div>
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
                Labeled <strong>live</strong> vs <strong>mock</strong> per batch. Items stored for weekly
                summaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-w-xl">
              <div className="space-y-1">
                <Label>Seed keyword / topic</Label>
                <Textarea value={seed} onChange={(e) => setSeed(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Focus</Label>
                <Select value={focus} onValueChange={(v) => setFocus(v as typeof focus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="phrase">Phrase</SelectItem>
                    <SelectItem value="headline">Headline</SelectItem>
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
                    <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-auto max-h-40">
                      {JSON.stringify(weekly.data?.byKind, null, 2)}
                    </pre>
                    <ul className="list-disc pl-4 space-y-1">
                      {(weekly.data?.topOpportunities ?? []).slice(0, 6).map((o, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{o.phrase}</span>{" "}
                          <span className="text-muted-foreground">
                            ({o.itemKind} · {o.relevanceScore})
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
                  placeholder="Keyword or topic phrase"
                  value={genPhrase}
                  onChange={(e) => setGenPhrase(e.target.value)}
                />
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
                      <th className="py-2 pr-2">Kind</th>
                      <th className="py-2 pr-2">Src</th>
                      <th className="py-2 pr-2">Score</th>
                      <th className="py-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(researchItems.data?.items ?? []).map((it) => (
                      <tr key={it.id} className="border-b border-border/60">
                        <td className="py-2 pr-2 max-w-[200px] truncate">{it.phrase}</td>
                        <td className="py-2 pr-2">{it.itemKind}</td>
                        <td className="py-2 pr-2">
                          <Badge variant={it.source.includes("mock") ? "secondary" : "default"}>
                            {it.source}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2">{it.relevanceScore}</td>
                        <td className="py-2">{it.trendDirection}</td>
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
              <CardTitle>Run job</CardTitle>
              <CardDescription>
                Content insight on save/schedule is also wired via CMS APIs (see provider tab for env flags).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-end max-w-xl">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label>Job type</Label>
                <Select value={automationJob} onValueChange={setAutomationJob}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly_research_digest">Weekly research digest</SelectItem>
                    <SelectItem value="audit_recommendation_engine">Audit recommendation engine</SelectItem>
                    <SelectItem value="editorial_gap_detection">Editorial gap detection</SelectItem>
                    <SelectItem value="stale_content_detection">Stale content detection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => runAutomation.mutate()} disabled={runAutomation.isPending}>
                {runAutomation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Execute
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent automation runs</CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono space-y-2 max-h-64 overflow-auto">
              {(automationRuns.data?.runs ?? []).map((r) => (
                <div key={r.id} className="border-b border-border/40 pb-2">
                  <span className="text-foreground">{r.jobType}</span>{" "}
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
                <code className="text-foreground">GET /api/public/gos/report/[token]</code>
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
