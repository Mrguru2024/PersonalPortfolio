"use client";

import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FlaskConical,
  LayoutList,
  LineChart,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AUTOMATION_JOB_VALUES,
  formatAutomationJobType,
  formatAutomationRunStatus,
  formatResearchDataMode,
  formatResearchItemKind,
  formatResearchSource,
  humanizeSnakeCase,
} from "@/lib/growth-os/friendlyCopy";
import {
  ContentPerformanceDashboardPanel,
  LeadGenerationDashboardPanel,
  OperationalDashboardPanel,
  type ContentDashboardPayload,
  type LeadGenDashboardPayload,
  type OperationalDashboardPayload,
} from "./IntelligenceDashboardRollups";

const PROJECT = "ascendra_main";

const TAB_QUERY = "tab";

function tabQueryToValue(raw: string | null): "dashboards" | "research" | "automation" | "config" {
  if (raw === "research") return "research";
  if (raw === "automation") return "automation";
  if (raw === "providers") return "config";
  return "dashboards";
}

function valueToTabQuery(v: string): string {
  if (v === "research") return "research";
  if (v === "automation") return "automation";
  if (v === "config") return "providers";
  return "overview";
}

type IntelligenceDashboardResponse = {
  projectKey?: string;
  intelligenceMode: string;
  leadGeneration: LeadGenDashboardPayload;
  contentPerformance: ContentDashboardPayload;
  operational: OperationalDashboardPayload;
};

type ResearchItemRow = {
  id: number;
  phrase: string;
  itemKind: string;
  source: string;
  relevanceScore: number;
  trendDirection: string;
  suggestedUsage: string | null;
  batchId?: number | null;
  createdAt?: string | null;
  relatedHeadlines?: string[] | null;
  relatedCtaOpportunities?: string[] | null;
};

const SEED_PRESETS = [
  { label: "Growth marketing", text: "Ascendra growth marketing for B2B service firms" },
  { label: "Local SEO", text: "Chicago small business SEO and Google Business Profile" },
  { label: "Content Studio", text: "Internal content calendar, social captions, and newsletter angles" },
] as const;

type OverviewPanel = "leads" | "content" | "ops";

function IntelligencePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-72 max-w-full rounded-md bg-muted" />
      <div className="h-24 rounded-lg bg-muted/70" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="min-h-[320px] rounded-xl bg-muted/40" />
    </div>
  );
}

function GrowthOsIntelligencePageContent() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = tabQueryToValue(searchParams.get(TAB_QUERY));

  const setActiveTab = useCallback(
    (v: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const q = valueToTabQuery(v);
      if (q === "overview") params.delete(TAB_QUERY);
      else params.set(TAB_QUERY, q);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [helpOpen, setHelpOpen] = useState(true);
  const [overviewPanel, setOverviewPanel] = useState<OverviewPanel>("leads");
  const [seed, setSeed] = useState("Ascendra growth marketing");
  const [focus, setFocus] = useState<"mixed" | "keyword" | "topic" | "phrase" | "headline">("mixed");
  const [genPhrase, setGenPhrase] = useState("");
  const [automationJob, setAutomationJob] = useState("weekly_research_digest");
  const [automationDocumentId, setAutomationDocumentId] = useState("");

  const [itemSearch, setItemSearch] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("all");
  const [itemSourceFilter, setItemSourceFilter] = useState<"all" | "live" | "demo">("all");
  const [itemSort, setItemSort] = useState<"relevance" | "phrase" | "newest">("relevance");
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [batchFilterId, setBatchFilterId] = useState<number | null>(null);
  const [runStatusFilter, setRunStatusFilter] = useState<"all" | "completed" | "failed" | "active">("all");
  /** Narrow overview tables/lists without changing the query. */
  const [overviewRowFilter, setOverviewRowFilter] = useState("");

  const automationNeedsDocumentId =
    automationJob === "content_insight_save" ||
    automationJob === "content_insight_schedule" ||
    automationJob === "headline_hook_variants" ||
    automationJob === "repurposing_suggestions";
  const automationDocumentIdParsed = Number.parseInt(automationDocumentId, 10);
  const automationDocumentOk =
    !automationNeedsDocumentId ||
    (Number.isFinite(automationDocumentIdParsed) && automationDocumentIdParsed > 0);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("intel-help-collapsed") === "1";
      if (dismissed) setHelpOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  const persistHelpOpen = (open: boolean) => {
    setHelpOpen(open);
    try {
      localStorage.setItem("intel-help-collapsed", open ? "0" : "1");
    } catch {
      /* ignore */
    }
  };

  const copyTabLink = async () => {
    const params = new URLSearchParams(searchParams.toString());
    const q = valueToTabQuery(activeTab);
    if (q === "overview") params.delete(TAB_QUERY);
    else params.set(TAB_QUERY, q);
    const qs = params.toString();
    const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share this URL to open the same tab." });
    } catch {
      toast({ title: "Copy failed", description: url, variant: "destructive" });
    }
  };

  const dash = useQuery<IntelligenceDashboardResponse>({
    queryKey: ["/api/admin/growth-os/intelligence/dashboards", PROJECT],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/growth-os/intelligence/dashboards?projectKey=${encodeURIComponent(PROJECT)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load dashboards");
      return res.json() as Promise<IntelligenceDashboardResponse>;
    },
  });

  const researchItems = useQuery({
    queryKey: ["/api/admin/growth-os/intelligence/research/items", PROJECT],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/growth-os/intelligence/research/items?projectKey=${encodeURIComponent(PROJECT)}&limit=80`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load research");
      return res.json() as Promise<{
        items: ResearchItemRow[];
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
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? `Research run failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/growth-os/intelligence/research/items"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/growth-os/intelligence/research/weekly-summary"] });
      toast({
        title: "Research batch created",
        description: `${data.itemCount} items · ${data.providerMode} (${data.providerLabel})`,
      });
      setActiveTab("research");
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
      const n = data.documentIds.length;
      toast({
        title: "Draft posts created",
        description:
          n === 0
            ? "No document ids returned."
            : `Created ${n} draft${n === 1 ? "" : "s"} in Content Studio (documents ${data.documentIds.join(", ")}).`,
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

  const itemKinds = useMemo(() => {
    const s = new Set<string>();
    for (const it of researchItems.data?.items ?? []) s.add(it.itemKind);
    return [...s].sort();
  }, [researchItems.data?.items]);

  const filteredSortedItems = useMemo(() => {
    let rows = [...(researchItems.data?.items ?? [])];
    const q = itemSearch.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.phrase.toLowerCase().includes(q));
    if (itemTypeFilter !== "all") rows = rows.filter((r) => r.itemKind === itemTypeFilter);
    if (itemSourceFilter === "live") rows = rows.filter((r) => !r.source.includes("mock"));
    if (itemSourceFilter === "demo") rows = rows.filter((r) => r.source.includes("mock"));
    if (batchFilterId != null) rows = rows.filter((r) => r.batchId === batchFilterId);

    if (itemSort === "phrase") {
      rows.sort((a, b) => a.phrase.localeCompare(b.phrase, undefined, { sensitivity: "base" }));
    } else if (itemSort === "newest") {
      rows.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    } else {
      rows.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    return rows;
  }, [
    researchItems.data?.items,
    itemSearch,
    itemTypeFilter,
    itemSourceFilter,
    itemSort,
    batchFilterId,
  ]);

  const filteredRuns = useMemo(() => {
    const runs = automationRuns.data?.runs ?? [];
    if (runStatusFilter === "all") return runs;
    if (runStatusFilter === "completed") return runs.filter((r) => r.status === "completed");
    if (runStatusFilter === "failed") return runs.filter((r) => r.status === "failed");
    return runs.filter((r) => r.status === "pending" || r.status === "running");
  }, [automationRuns.data?.runs, runStatusFilter]);

  const overviewCardShell = "transition-all duration-200 hover:shadow-md border-border/80";
  const overviewScrollMargin = "scroll-mt-28";

  const scrollToOverviewSection = useCallback((panel: OverviewPanel, id: string) => {
    setOverviewPanel(panel);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="space-y-6 pb-8 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Market & growth intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Run topic discovery, review rollups from CRM and Content Studio, and trigger background jobs. Client
              copy belongs in <span className="font-medium text-foreground">Client shares</span> only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="sm" onClick={() => void copyTabLink()}>
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Copy tab link
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                Copies a URL that re-opens this tab (bookmark or share with your team).
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Collapsible open={helpOpen} onOpenChange={persistHelpOpen}>
          <Card className="border-dashed bg-muted/20">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 p-4 text-left rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-medium text-foreground">How this page works</span>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {helpOpen ? "Hide" : "Show"}
                  </Badge>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", helpOpen && "rotate-180")}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground space-y-2 border-t border-border/60">
                <p>
                  <strong className="text-foreground">Overview</strong> — leads, content, and operations in readable
                  sections. On smaller screens, switch the overview focus with the toggles above the cards.
                </p>
                <p>
                  <strong className="text-foreground">Research</strong> — discover topics, filter the table, expand
                  rows for notes, send a phrase into “Generate drafts”.
                </p>
                <p>
                  <strong className="text-foreground">Automation</strong> — run the same jobs as cron; filter runs by
                  status.
                </p>
                <p>
                  <strong className="text-foreground">Providers</strong> — environment reference for engineers.
                </p>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full h-auto grid-cols-2 lg:grid-cols-4 gap-2 p-2 rounded-xl bg-muted/70">
            <TabsTrigger
              value="dashboards"
              className={cn(
                "flex flex-col items-stretch gap-0.5 h-auto min-h-[4.5rem] py-2.5 px-3 text-left rounded-lg",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border",
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <LineChart className="h-4 w-4 shrink-0" />
                Overview
              </span>
              <span className="text-[11px] text-muted-foreground font-normal leading-snug">
                Leads, content & ops snapshots
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="research"
              className={cn(
                "flex flex-col items-stretch gap-0.5 h-auto min-h-[4.5rem] py-2.5 px-3 text-left rounded-lg",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border",
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Search className="h-4 w-4 shrink-0" />
                Research
              </span>
              <span className="text-[11px] text-muted-foreground font-normal leading-snug">
                Discovery, filters & drafts
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className={cn(
                "flex flex-col items-stretch gap-0.5 h-auto min-h-[4.5rem] py-2.5 px-3 text-left rounded-lg",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border",
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Zap className="h-4 w-4 shrink-0" />
                Automation
              </span>
              <span className="text-[11px] text-muted-foreground font-normal leading-snug">
                Jobs & run history
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className={cn(
                "flex flex-col items-stretch gap-0.5 h-auto min-h-[4.5rem] py-2.5 px-3 text-left rounded-lg col-span-2 lg:col-span-1",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border",
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <FlaskConical className="h-4 w-4 shrink-0" />
                Providers
              </span>
              <span className="text-[11px] text-muted-foreground font-normal leading-snug">
                Env & API notes
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="dashboards"
            className="space-y-4 mt-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          >
            {dash.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading overview…
              </div>
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
                    {dash.data?.intelligenceMode === "live" ? "Live AI mode" : "Demo / mock AI mode"}
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
                    Demo when <code className="text-foreground">OPENAI_API_KEY</code> is missing or{" "}
                    <code className="text-foreground">GOS_INTELLIGENCE_MODE=mock</code>.
                  </span>
                </div>

                <p className="text-xs text-muted-foreground max-w-3xl">
                  Data is live from your database. Summaries for clients go through{" "}
                  <span className="font-medium text-foreground">Client shares</span>.
                </p>

                <div
                  className={cn(
                    "sticky top-0 z-20 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                    "rounded-lg border border-border/70 bg-background/90 px-3 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/85",
                    "shadow-sm",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
                      <LayoutList className="h-3.5 w-3.5" aria-hidden />
                      Overview
                    </span>
                    <div className="h-4 w-px bg-border shrink-0 hidden sm:block" aria-hidden />
                    <nav className="flex flex-wrap gap-1.5" aria-label="Jump to overview section">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => scrollToOverviewSection("leads", "intel-overview-leads")}
                      >
                        Lead generation
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => scrollToOverviewSection("content", "intel-overview-content")}
                      >
                        Content
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => scrollToOverviewSection("ops", "intel-overview-ops")}
                      >
                        Operations
                      </Button>
                    </nav>
                  </div>
                  <div className="relative w-full sm:max-w-xs md:max-w-sm">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={overviewRowFilter}
                      onChange={(e) => setOverviewRowFilter(e.target.value)}
                      placeholder="Filter rows in all cards…"
                      className="h-9 pl-8 text-sm"
                      aria-label="Filter overview tables and lists"
                    />
                  </div>
                </div>

                <div className="xl:hidden space-y-2">
                  <p className="text-xs font-medium text-foreground">Focus (small screens)</p>
                  <ToggleGroup
                    type="single"
                    value={overviewPanel}
                    onValueChange={(v) => v && setOverviewPanel(v as OverviewPanel)}
                    variant="outline"
                    className="flex flex-wrap justify-start gap-1"
                  >
                    <ToggleGroupItem value="leads" className="text-xs">
                      Leads
                    </ToggleGroupItem>
                    <ToggleGroupItem value="content" className="text-xs">
                      Content
                    </ToggleGroupItem>
                    <ToggleGroupItem value="ops" className="text-xs">
                      Operations
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
                  <Card
                    id="intel-overview-leads"
                    className={cn(
                      overviewPanel === "leads" ? "block" : "hidden",
                      "xl:block",
                      overviewCardShell,
                      "h-fit min-w-0",
                      overviewScrollMargin,
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">Lead generation</CardTitle>
                      <CardDescription>CRM + tasks rollup — sources, campaigns, landing pages, attribution</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0 pt-0">
                      {dash.data?.leadGeneration ? (
                        <LeadGenerationDashboardPanel
                          data={dash.data.leadGeneration}
                          filterText={overviewRowFilter}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                  <Card
                    id="intel-overview-content"
                    className={cn(
                      overviewPanel === "content" ? "block" : "hidden",
                      "xl:block",
                      overviewCardShell,
                      "h-fit min-w-0",
                      overviewScrollMargin,
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">Content performance</CardTitle>
                      <CardDescription>Blog + internal studio mix — funnel stage, hooks, posting windows</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0 pt-0">
                      {dash.data?.contentPerformance ? (
                        <ContentPerformanceDashboardPanel
                          data={dash.data.contentPerformance}
                          filterText={overviewRowFilter}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                  <Card
                    id="intel-overview-ops"
                    className={cn(
                      overviewPanel === "ops" ? "block" : "hidden",
                      "xl:block",
                      overviewCardShell,
                      "h-fit min-w-0",
                      overviewScrollMargin,
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">Operational discipline</CardTitle>
                      <CardDescription>Calendar + AI review queue — schedules, drafts, audits, follow-ups</CardDescription>
                    </CardHeader>
                    <CardContent className="min-w-0 pt-0">
                      {dash.data?.operational ? (
                        <OperationalDashboardPanel
                          data={dash.data.operational}
                          filterText={overviewRowFilter}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent
            value="research"
            className="space-y-4 mt-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Run discovery</CardTitle>
                <CardDescription>
                  Generate a new batch of ideas from your seed. We’ll switch you to this tab when a run finishes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-w-2xl">
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
                    Refresh data
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground w-full">Quick starts</span>
                  {SEED_PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant={seed === p.text ? "secondary" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSeed(p.text)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="intel-seed">Starting topic or keywords</Label>
                  <Textarea
                    id="intel-seed"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    rows={3}
                    placeholder="Example: B2B SaaS onboarding emails, Ascendra portfolio leads, Chicago small business SEO"
                    className="resize-y min-h-[4rem] transition-[box-shadow] focus-visible:ring-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="intel-focus">What to lean toward</Label>
                  <Select value={focus} onValueChange={(v) => setFocus(v as typeof focus)}>
                    <SelectTrigger id="intel-focus" className="max-w-md">
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
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Weekly opportunity summary</CardTitle>
                  <CardDescription>
                    Last 7 days · {formatResearchDataMode(weekly.data?.dataMode)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  {weekly.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <p className="text-muted-foreground tabular-nums">
                        Total items this window: <span className="font-medium text-foreground">{weekly.data?.totalItems ?? 0}</span>
                      </p>
                      <ul className="text-xs bg-muted/50 p-2 rounded-md space-y-1">
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
                      <ul className="space-y-2">
                        {(weekly.data?.topOpportunities ?? []).slice(0, 8).map((o, i) => (
                          <li
                            key={i}
                            className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/60 p-2 hover:bg-muted/30 transition-colors"
                          >
                            <div>
                              <span className="font-medium text-foreground">{o.phrase}</span>
                              <span className="text-muted-foreground text-xs block mt-0.5">
                                {formatResearchItemKind(o.itemKind)} · score {o.relevanceScore}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 h-8 text-xs"
                              onClick={() => {
                                setGenPhrase(o.phrase);
                                toast({ title: "Phrase copied to drafts field", description: "Scroll to Generate drafts or stay here." });
                              }}
                            >
                              Use for drafts
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Generate drafts</CardTitle>
                  <CardDescription>Creates internal Content Studio caption drafts — review before publishing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-w-md">
                  <Input
                    placeholder="e.g. AI compliance checklist for startups"
                    value={genPhrase}
                    onChange={(e) => setGenPhrase(e.target.value)}
                    className="transition-[box-shadow] focus-visible:ring-2"
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

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Research items</CardTitle>
                <CardDescription>
                  Filter, sort, and expand a row for suggested use and related lines. Click a batch to narrow items.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {researchItems.data?.batches && researchItems.data.batches.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground">Recent batches</span>
                    <Button
                      type="button"
                      variant={batchFilterId == null ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setBatchFilterId(null)}
                    >
                      All batches
                    </Button>
                    {researchItems.data.batches.map((b) => (
                      <Button
                        key={b.id}
                        type="button"
                        variant={batchFilterId === b.id ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs max-w-[200px] truncate"
                        title={b.label ?? `Batch ${b.id}`}
                        onClick={() => setBatchFilterId(batchFilterId === b.id ? null : b.id)}
                      >
                        #{b.id} {b.label ? `· ${b.label}` : ""}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <Label htmlFor="item-search">Search phrases</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="item-search"
                        className="pl-8"
                        placeholder="Type to filter…"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 w-full sm:w-44">
                    <Label>Type</Label>
                    <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {itemKinds.map((k) => (
                          <SelectItem key={k} value={k}>
                            {formatResearchItemKind(k)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-full sm:w-44">
                    <Label>Source</Label>
                    <Select
                      value={itemSourceFilter}
                      onValueChange={(v) => setItemSourceFilter(v as typeof itemSourceFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        <SelectItem value="live">Live AI only</SelectItem>
                        <SelectItem value="demo">Demo catalog only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-full sm:w-44">
                    <Label>Sort</Label>
                    <Select value={itemSort} onValueChange={(v) => setItemSort(v as typeof itemSort)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance (high first)</SelectItem>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="phrase">Phrase (A–Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {researchItems.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredSortedItems.length} of {researchItems.data?.items.length ?? 0} loaded items
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-border/80">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <th className="py-2 pl-2 pr-1 w-8" aria-label="Expand" />
                            <th className="py-2 pr-2">Phrase</th>
                            <th className="py-2 pr-2">Type</th>
                            <th className="py-2 pr-2">Source</th>
                            <th className="py-2 pr-2 text-right">Score</th>
                            <th className="py-2 pr-2">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSortedItems.map((it) => {
                            const open = expandedItemId === it.id;
                            return (
                              <Fragment key={it.id}>
                                <tr
                                  className={cn(
                                    "border-b border-border/60 transition-colors",
                                    open ? "bg-muted/20" : "hover:bg-muted/15",
                                  )}
                                >
                                  <td className="py-1 pl-2 pr-1 align-top">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      aria-expanded={open}
                                      aria-label={open ? "Collapse row" : "Expand row"}
                                      onClick={() => setExpandedItemId(open ? null : it.id)}
                                    >
                                      {open ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </td>
                                  <td className="py-2 pr-2 max-w-[240px]">
                                    <span className="line-clamp-2 text-foreground">{it.phrase}</span>
                                  </td>
                                  <td className="py-2 pr-2 whitespace-nowrap">
                                    {formatResearchItemKind(it.itemKind)}
                                  </td>
                                  <td className="py-2 pr-2">
                                    <Badge variant={it.source.includes("mock") ? "secondary" : "default"}>
                                      {formatResearchSource(it.source)}
                                    </Badge>
                                  </td>
                                  <td className="py-2 pr-2 text-right tabular-nums">{it.relevanceScore}</td>
                                  <td className="py-2 pr-2 text-muted-foreground">
                                    {humanizeSnakeCase(it.trendDirection)}
                                  </td>
                                </tr>
                                {open ? (
                                  <tr className="border-b border-border/60 bg-muted/25">
                                    <td colSpan={6} className="px-4 py-3 text-xs space-y-2">
                                      {!it.suggestedUsage?.trim() &&
                                      (it.relatedHeadlines?.length ?? 0) === 0 &&
                                      (it.relatedCtaOpportunities?.length ?? 0) === 0 ? (
                                        <p className="text-muted-foreground">No extra notes on file for this item.</p>
                                      ) : null}
                                      {it.suggestedUsage?.trim() ? (
                                        <p>
                                          <span className="font-medium text-foreground">Suggested use: </span>
                                          {it.suggestedUsage}
                                        </p>
                                      ) : null}
                                      {(it.relatedHeadlines?.length ?? 0) > 0 ? (
                                        <div>
                                          <span className="font-medium text-foreground">Related headlines</span>
                                          <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            {it.relatedHeadlines!.map((h, i) => (
                                              <li key={i}>{h}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      ) : null}
                                      {(it.relatedCtaOpportunities?.length ?? 0) > 0 ? (
                                        <div>
                                          <span className="font-medium text-foreground">CTA ideas</span>
                                          <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            {it.relatedCtaOpportunities!.map((h, i) => (
                                              <li key={i}>{h}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      ) : null}
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setGenPhrase(it.phrase);
                                            toast({
                                              title: "Ready for drafts",
                                              description: "Phrase filled in Generate drafts.",
                                            });
                                          }}
                                        >
                                          Use for drafts
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await navigator.clipboard.writeText(it.phrase);
                                              toast({ title: "Copied phrase" });
                                            } catch {
                                              toast({ title: "Copy failed", variant: "destructive" });
                                            }
                                          }}
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copy phrase
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : null}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="automation"
            className="space-y-4 mt-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Run a background job</CardTitle>
                <CardDescription>
                  Same jobs as the cron route. Some require a Content Studio document id (see Providers for autos).
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
                    <Label>Content Studio document ID</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="e.g. 42"
                      value={automationDocumentId}
                      onChange={(e) => setAutomationDocumentId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      From the document URL in Content Studio. Required for insight and variant jobs.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Recent automation runs</CardTitle>
                  <CardDescription>Filter by outcome; click Refresh after executing a job.</CardDescription>
                </div>
                <ToggleGroup
                  type="single"
                  value={runStatusFilter}
                  onValueChange={(v) => v && setRunStatusFilter(v as typeof runStatusFilter)}
                  variant="outline"
                  className="flex-wrap justify-start"
                >
                  <ToggleGroupItem value="all" className="text-xs px-2">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="active" className="text-xs px-2">
                    Active
                  </ToggleGroupItem>
                  <ToggleGroupItem value="completed" className="text-xs px-2">
                    Done
                  </ToggleGroupItem>
                  <ToggleGroupItem value="failed" className="text-xs px-2">
                    Failed
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardHeader>
              <CardContent className="text-sm space-y-2 pr-1">
                {filteredRuns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No runs match this filter.</p>
                ) : (
                  filteredRuns.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border/60 p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{formatAutomationJobType(r.jobType)}</span>
                        <Badge variant="outline" className="font-normal">
                          {formatAutomationRunStatus(r.status)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums">Run #{r.id}</span>
                      </div>
                      {r.resultSummary ? (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.resultSummary}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="config"
            className="mt-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          >
            <Card>
              <CardHeader>
                <CardTitle>Provider configuration</CardTitle>
                <CardDescription>Environment variables (server-side). Expand a section for details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="ai">
                    <AccordionTrigger>AI models &amp; intelligence mode</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <code className="text-foreground">OPENAI_API_KEY</code> — enables live AI insights and research
                        when <code className="text-foreground">GOS_INTELLIGENCE_MODE</code> is not forced to mock.
                      </p>
                      <p>
                        <code className="text-foreground">GOS_INTELLIGENCE_MODE</code> — <code>mock</code> or{" "}
                        <code>live</code> (optional override).
                      </p>
                      <p>
                        <code className="text-foreground">GOS_OPENAI_MODEL</code> — defaults to{" "}
                        <code className="text-foreground">gpt-4o-mini</code>.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="content">
                    <AccordionTrigger>Content Studio automation</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <code className="text-foreground">GOS_AUTO_CONTENT_INSIGHT_ON_SAVE=true</code> — run insight on
                        every CMS document save.
                      </p>
                      <p>
                        <code className="text-foreground">GOS_AUTO_CONTENT_INSIGHT_ON_SCHEDULE=false</code> — disable
                        schedule trigger (default: enabled).
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="public">
                    <AccordionTrigger>Public reports &amp; rate limits</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>
                        Client token: <code className="text-foreground">GET /api/public/gos/report/[token]</code> or page{" "}
                        <code className="text-foreground">/gos/report/[token]</code>
                      </p>
                      <p>
                        <code className="text-foreground">GOS_PUBLIC_REPORT_MAX_PER_MINUTE</code> — per-IP cap in
                        production (default 60).
                      </p>
                      <p>
                        Policy share builder:{" "}
                        <code className="text-foreground">POST /api/admin/growth-os/client-safe/build-share</code>
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cron">
                    <AccordionTrigger>Cron &amp; scheduled jobs</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <code className="text-foreground">CRON_SECRET</code> — required for{" "}
                        <code className="text-foreground">GET /api/cron/growth-os</code> (Vercel sends{" "}
                        <code className="text-foreground">Authorization: Bearer …</code>). Daily: stale content and
                        editorial gaps; Mondays UTC: weekly research digest.
                      </p>
                      <p>
                        Configure <code className="text-foreground">vercel.json</code> <code className="text-foreground">crons</code>{" "}
                        on a Vercel plan that supports cron.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

export default function GrowthOsIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="p-1">
          <IntelligencePageSkeleton />
        </div>
      }
    >
      <GrowthOsIntelligencePageContent />
    </Suspense>
  );
}
