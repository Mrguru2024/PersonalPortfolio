"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  MapPin,
  Radar,
  Save,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AdminHelpTip, AdminTipLabel } from "@/components/admin/AdminHelpTip";

type AmieAnalyzeResponse = {
  input: {
    industry: string;
    serviceType: string;
    location: string;
    persona: string;
    projectKey?: string;
  };
  marketData: {
    demandScore: number;
    competitionScore: number;
    purchasePowerScore: number;
    painScore: number;
    targetingDifficulty: number;
    marketTrend: string;
    avgPrice: number | null;
    keywordData: { keywords?: Array<{ term: string; volume: number; intent: string }> };
    competitionData: {
      competitorCount?: number;
      provenance?: "google_places" | "synthetic";
      searchQuery?: string;
      samples?: Array<{
        name: string;
        rating: number;
        reviewCount: number;
        distanceKm: number;
        formattedAddress?: string;
      }>;
    };
    dataMode: string;
    sources: Array<{ provider: string; label: string; note?: string }>;
  };
  opportunity: {
    opportunityTier: string;
    rulesFired: string[];
    summary: string;
    insights: string[];
    recommendations: string;
    personaStrategy: string;
    leadStrategy: string;
    funnelStrategy: string;
    adStrategy: string;
  };
  integrationHints: {
    suggestedLeadFitScore: number;
    qualificationNotes: string[];
    suggestedFunnelArchetype: string;
    offerPricingNote: string;
    paidGrowth: { suggestedCampaignTypes: string[]; keywordSeeds: string[]; avoidBroadPpc: boolean };
  };
  savedResearchId?: number | null;
};

const PRESET_PERSONAS = [
  { value: "Marcus — urgency / mobile-first owner", label: "Marcus (urgency / mobile)" },
  { value: "Tasha — ops / booking automation", label: "Tasha (booking / retention)" },
  { value: "Devon — validation / MVP buyer", label: "Devon (validation)" },
  { value: "Andre — authority / strategic buyer", label: "Andre (authority)" },
];

export default function MarketIntelligencePage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [industry, setIndustry] = useState("Home services");
  const [serviceType, setServiceType] = useState("HVAC repair");
  const [location, setLocation] = useState("Austin, TX");
  const [persona, setPersona] = useState(PRESET_PERSONAS[0].value);
  const [saveReport, setSaveReport] = useState(false);
  const [result, setResult] = useState<AmieAnalyzeResponse | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.replace("/admin/dashboard");
  }, [user, authLoading, router]);

  const reportsQuery = useQuery({
    queryKey: ["/api/admin/market-intelligence/reports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/market-intelligence/reports?limit=40", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load reports");
      return res.json() as Promise<{
        reports: Array<{
          id: number;
          industry: string;
          serviceType: string;
          location: string;
          persona: string;
          createdAt: string | null;
          crmContactId: number | null;
          funnelSource: string | null;
        }>;
      }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/market-intelligence/analyze", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey: "ascendra_main",
          industry,
          serviceType,
          location,
          persona,
          save: saveReport,
          skipCache: false,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Analysis failed");
      }
      return res.json() as Promise<AmieAnalyzeResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/market-intelligence/reports"] });
      toast({
        title: data.savedResearchId ? "Analysis saved" : "Analysis complete",
        description: data.savedResearchId
          ? `Report #${data.savedResearchId} stored for CRM / exports.`
          : "Review scores and strategy below.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "AMIE error", description: e.message, variant: "destructive" });
    },
  });

  const loadReport = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/admin/market-intelligence/reports/${id}`, { credentials: "include" });
      if (!res.ok) {
        toast({ title: "Load failed", variant: "destructive" });
        return;
      }
      const row = await res.json();
      setIndustry(row.research.industry);
      setServiceType(row.research.serviceType);
      setLocation(row.research.location);
      setPersona(row.research.persona);
      setResult({
        input: {
          industry: row.research.industry,
          serviceType: row.research.serviceType,
          location: row.research.location,
          persona: row.research.persona,
          projectKey: row.research.projectKey,
        },
        marketData: {
          demandScore: row.marketData.demandScore,
          competitionScore: row.marketData.competitionScore,
          purchasePowerScore: row.marketData.purchasePowerScore,
          painScore: row.marketData.painScore,
          targetingDifficulty: row.marketData.targetingDifficulty,
          marketTrend: row.marketData.marketTrend,
          avgPrice: row.marketData.avgPrice,
          keywordData: row.marketData.keywordData as AmieAnalyzeResponse["marketData"]["keywordData"],
          competitionData: row.marketData.competitionData as AmieAnalyzeResponse["marketData"]["competitionData"],
          dataMode: row.marketData.dataMode,
          sources: row.marketData.sources,
        },
        opportunity: {
          opportunityTier: row.report.opportunityTier,
          rulesFired: row.report.rulesFired,
          summary: row.report.summary,
          insights: row.report.insights,
          recommendations: row.report.recommendations,
          personaStrategy: row.report.personaStrategy,
          leadStrategy: row.report.leadStrategy,
          funnelStrategy: row.report.funnelStrategy,
          adStrategy: row.report.adStrategy,
        },
        integrationHints: row.report.integrationHintsJson as AmieAnalyzeResponse["integrationHints"],
      });
      toast({ title: "Loaded saved report", description: `#${id}` });
    },
    [toast],
  );

  const chartData = useMemo(() => {
    if (!result) return [];
    const m = result.marketData;
    return [
      { name: "Demand", value: m.demandScore },
      { name: "Competition", value: m.competitionScore },
      { name: "Purchase power", value: m.purchasePowerScore },
      { name: "Pain", value: m.painScore },
      { name: "Targeting Δ", value: m.targetingDifficulty },
    ];
  }, [result]);

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amie-${result.input.serviceType.slice(0, 24).replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tier = result?.opportunity.opportunityTier ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Admin dashboard
                </Link>
              </Button>
              <AdminHelpTip
                content="Leaves this screen for the main dashboard. Your last run stays in this tab until you refresh; use Save research if you need the report in the database. Copy JSON from results when pasting into proposals or CRM notes."
                ariaLabel="Help: Back to dashboard"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/growth-os/intelligence">Growth OS research</Link>
                </Button>
                <AdminHelpTip
                  content="Growth OS intelligence: topic/keyword discovery, content & ops dashboards, automation. Different from AMIE — that page is for creative research batches, not scored market economics."
                  ariaLabel="Help: Growth OS research"
                />
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/paid-growth">Paid growth</Link>
                </Button>
                <AdminHelpTip
                  content="Paid growth / PPC workspace. AMIE’s integration hints suggest campaign types and keyword seeds you can carry into builders here."
                  ariaLabel="Help: Paid growth"
                />
              </div>
            </div>
          </div>

          <header className="mb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Radar className="h-4 w-4" aria-hidden />
              <span>Ascendra Market Intelligence Engine</span>
              <AdminHelpTip
                content={
                  isSuper ?
                    "AMIE: internal decision-intelligence layer. Scores demand, competition, purchase power, pain, and targeting difficulty; outputs opportunity tier plus CRM/funnel/PPC hints. Uses mock or mixed data until external adapters are configured (see .env.example)."
                  : "Decision Intelligence scores your market inputs and suggests opportunity level plus practical next steps for CRM, funnel, and ads. Results may use sample data until live data sources are connected."
                }
                ariaLabel="Help: What is AMIE"
              />
            </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Decision Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Internal-only market analysis: scored demand, competition, economics, pain, and media difficulty — plus
            rules-based opportunity tiering and channel strategy. Outputs include hooks for CRM qualification, funnel
            selection, offers, and paid growth.
          </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 border shadow-sm h-fit">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Market inputs
                  </CardTitle>
                  <AdminHelpTip
                    content="Define the market slice to score. All fields feed deterministic mock/live signals and the strategy engines. Persona presets align recommendations with Marcus (urgency), Tasha (booking), Devon (validation), or Andre (authority)."
                    ariaLabel="Help: Market inputs"
                  />
                </div>
                <CardDescription>Industry, service, geography, and IQ persona archetype.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <AdminTipLabel
                    htmlFor="amie-industry"
                    tip="Broad vertical (e.g. Home services, SaaS). Used with service type to shape keyword and competitor mocks."
                    tipAriaLabel="Help: Industry field"
                  >
                    Industry
                  </AdminTipLabel>
                <Input
                  id="amie-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-background"
                />
              </div>
                <div className="space-y-1.5">
                  <AdminTipLabel
                    htmlFor="amie-service"
                    tip="Specific offer or job type (e.g. HVAC repair). Drives keyword themes and demand proxies in the analysis."
                    tipAriaLabel="Help: Service type"
                  >
                    Service type
                  </AdminTipLabel>
                  <Input
                    id="amie-service"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <AdminTipLabel
                    htmlFor="amie-location"
                    tip="City, metro, or region string. Local economics and competition samples are parameterized from this plus industry/service."
                    tipAriaLabel="Help: Location"
                  >
                    Location
                  </AdminTipLabel>
                  <Input
                    id="amie-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="mb-0">Persona</Label>
                    <AdminHelpTip
                      content="Maps to strategy templates: Marcus favors call-first and mobile urgency; Tasha favors automation and retention; Devon favors validation/MVP funnels; Andre favors authority content and discovery calls."
                      ariaLabel="Help: Persona select"
                    />
                  </div>
                  <Select value={persona} onValueChange={setPersona}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_PERSONAS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="amie-save"
                    checked={saveReport}
                    onCheckedChange={(v) => setSaveReport(v === true)}
                  />
                  <Label htmlFor="amie-save" className="text-sm font-normal cursor-pointer flex-1">
                    Save report to database
                  </Label>
                  <AdminHelpTip
                    content={
                      isSuper ?
                        "Persists this run to PostgreSQL (research + metrics + strategy). You get a research ID for exports and future CRM linking. Requires a successful analyze after schema push."
                      : "Saves this analysis so you can reopen it later and link it to CRM work."
                    }
                    ariaLabel="Help: Save report"
                  />
                </div>

                <div className="flex w-full items-center gap-2">
                  <Button
                    className="flex-1 min-w-0"
                    disabled={analyzeMutation.isPending}
                    onClick={() => analyzeMutation.mutate()}
                  >
                    {analyzeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2 shrink-0" aria-hidden />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2 shrink-0" aria-hidden />
                    )}
                    Run AMIE analysis
                  </Button>
                  <AdminHelpTip
                    content={
                      isSuper ?
                        "Calls POST /api/admin/market-intelligence/analyze. Reuses a short-lived server cache for identical inputs. Clears when you change fields. Outputs charts, opportunity rules, and integration hints."
                      : "Runs the analysis on the server. Repeated identical inputs may load from a short cache until you change a field."
                    }
                    ariaLabel="Help: Run analysis"
                  />
                </div>

                {reportsQuery.data?.reports?.length ? (
                  <div className="space-y-1 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-medium text-muted-foreground">Saved reports</p>
                      <AdminHelpTip
                        content="Load a previously saved run into the form and results panel. Does not re-hit the API until you Run analysis again."
                        ariaLabel="Help: Saved reports list"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {reportsQuery.data.reports.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-stretch gap-1 rounded-md border border-border/60 hover:bg-muted/40 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => loadReport(r.id)}
                            className="flex-1 min-w-0 text-left text-xs px-2 py-1.5"
                          >
                            <span className="font-medium text-foreground">#{r.id}</span>{" "}
                            {r.funnelSource === "market_score" ? (
                              <Badge variant="secondary" className="ml-1 align-middle text-[10px] px-1.5 py-0">
                                Funnel
                              </Badge>
                            ) : null}
                            <span className="text-muted-foreground">
                              {r.serviceType} · {r.location}
                            </span>
                          </button>
                          {r.crmContactId != null ? (
                            <Link
                              href={`/admin/crm/${r.crmContactId}`}
                              className="shrink-0 self-center px-2 text-[11px] text-primary hover:underline whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              CRM
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {!result ? (
              <Card className="border-dashed shadow-sm">
                <CardContent className="py-16 text-center text-muted-foreground text-sm">
                  Run an analysis to see demand, competition, decision metrics, and strategy output.
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <div className="flex items-center gap-0.5">
                    <Button variant="outline" size="sm" onClick={exportJson}>
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                    <AdminHelpTip
                      content="Downloads the full analysis payload (marketData, opportunity, integrationHints). Use for proposals, CRM notes, or pasting into other tools."
                      ariaLabel="Help: Export JSON"
                    />
                  </div>
                  {result.savedResearchId ? (
                    <Badge variant="secondary" className="h-9 px-3">
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Saved #{result.savedResearchId}
                    </Badge>
                  ) : null}
                </div>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" aria-hidden />
                        Score overview
                      </CardTitle>
                      <AdminHelpTip
                        content="Bar chart of core 0–100 scores: demand, competition, purchase power, pain, targeting difficulty. Hover bars for values (chart tooltip)."
                        ariaLabel="Help: Score overview chart"
                      />
                    </div>
                    <CardDescription>
                      0–100 scales. Competition reflects Google listings when configured; demand and economics stay
                      illustrative until Census/BLS adapters populate live fields (see data lineage).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricTile
                    label="Purchase power"
                    value={result.marketData.purchasePowerScore}
                    hint="Income, homeownership, density, spending proxy"
                    tip="PPI blends median income (40%), homeownership (20%), business density (20%), and a spending proxy (20%). Higher usually means consumers can afford premium positioning."
                  />
                  <MetricTile
                    label="Pain intensity"
                    value={result.marketData.painScore}
                    hint="Urgency vs informational language mix"
                    tip="Derived from urgency-style vs informational keyword/review proxies. High pain often triggers more aggressive capture and call-first recommendations."
                  />
                  <MetricTile
                    label="Targeting difficulty"
                    value={result.marketData.targetingDifficulty}
                    hint="CPC + competition + saturation heuristic"
                    tip="Weights estimated CPC, competition density, and ad saturation. High scores suggest leaning on SEO, maps, and referrals before scaling broad PPC."
                  />
                  <MetricTile
                    label="Market trend"
                    valueLabel={result.marketData.marketTrend}
                    hint="From trend slope classification"
                    tip="Classifies Google-Trends-style slope as growing, stable, or declining. Pairs with demand for opportunity rules."
                  />
                </div>

                <Card className="shadow-sm border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Opportunity</CardTitle>
                        <CardDescription>Rule engine output</CardDescription>
                      </div>
                      <AdminHelpTip
                        content="High / medium / low tier from rules (e.g. demand vs competition, pain, purchase power, targeting difficulty). Badges list internal rule ids for support and auditing."
                        ariaLabel="Help: Opportunity tier"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge
                      className={cn(
                        "text-sm",
                        tier === "high" && "bg-emerald-600 hover:bg-emerald-600",
                        tier === "low" && "bg-amber-700 hover:bg-amber-700",
                      )}
                    >
                      {tier.toUpperCase()} opportunity
                    </Badge>
                    <p className="text-sm text-foreground">{result.opportunity.summary}</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      {result.opportunity.insights.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    {result.opportunity.rulesFired.length ? (
                      <div className="flex flex-wrap gap-1">
                        {result.opportunity.rulesFired.map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px] font-normal">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">Competition map</CardTitle>
                            {result.marketData.competitionData.provenance === "google_places" ? (
                              <Badge variant="default" className="text-[10px] font-normal">
                                Google Places
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                Illustrative
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {result.marketData.competitionData.provenance === "google_places"
                              ? "Local businesses returned for your service, industry, and location — ratings and reviews are from Google users."
                              : "Set GOOGLE_API_KEY (Places API New + Geocoding) to load real competitors for each run."}
                          </CardDescription>
                          {result.marketData.competitionData.searchQuery ? (
                            <p className="text-xs text-muted-foreground">
                              Search:{" "}
                              <span className="text-foreground font-medium">
                                {result.marketData.competitionData.searchQuery}
                              </span>
                            </p>
                          ) : null}
                        </div>
                        <AdminHelpTip
                          content={
                            result.marketData.competitionData.provenance === "google_places"
                              ? "Listings come from Google Places Text Search for the query built from your form. Count is the number of results in this response, not every competitor in the metro."
                              : "Without GOOGLE_API_KEY, names and distances are illustrative. Enable Places API (New) and Geocoding API on the same key to fact-check competitors against your inputs."
                          }
                          ariaLabel="Help: Competition map"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p className="text-muted-foreground">
                        Businesses in this result set:{" "}
                        <span className="text-foreground font-medium">
                          {result.marketData.competitionData.competitorCount ?? "—"}
                        </span>
                      </p>
                      <ul className="rounded-md border border-border/60 divide-y divide-border/50 max-h-72 overflow-y-auto">
                        {(result.marketData.competitionData.samples ?? []).map((c, i) => (
                          <li key={i} className="px-3 py-2 space-y-0.5">
                            <div className="flex justify-between gap-2 text-xs">
                              <span className="text-foreground font-medium break-words">{c.name}</span>
                              <span className="text-muted-foreground shrink-0 tabular-nums">
                                {c.rating > 0 ? `${c.rating.toFixed(1)}★` : "—"}
                                {" · "}
                                {c.reviewCount} rev
                                {c.distanceKm > 0 ? ` · ${c.distanceKm.toFixed(1)} km` : ""}
                              </span>
                            </div>
                            {c.formattedAddress ? (
                              <p className="text-[11px] text-muted-foreground leading-snug">{c.formattedAddress}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {result.marketData.competitionData.provenance === "google_places" ? (
                        <p className="text-[10px] text-muted-foreground pt-1">
                          <a
                            href="https://developers.google.com/maps/documentation/places/web-service/policies"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Google Places / Maps attribution policies
                          </a>
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">Pricing intelligence</CardTitle>
                          <CardDescription>
                            Avg price estimate:{" "}
                            <span className="text-foreground font-semibold">
                              {result.marketData.avgPrice != null ? `$${result.marketData.avgPrice}` : "—"}
                            </span>
                          </CardDescription>
                        </div>
                        <AdminHelpTip
                          content="Ticket-size heuristic from competition + CPC proxies until live pricing feeds exist. Keyword table shows mock volumes and intent labels for planning."
                          ariaLabel="Help: Pricing intelligence"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border border-border/60 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                              <th className="px-2 py-1.5 font-normal">Keyword</th>
                              <th className="px-2 py-1.5 font-normal text-right">Vol</th>
                              <th className="px-2 py-1.5 font-normal">Intent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(result.marketData.keywordData.keywords ?? []).map((k, i) => (
                              <tr key={i} className="border-b border-border/50 last:border-0">
                                <td className="px-2 py-1.5 text-foreground break-words max-w-[200px]">{k.term}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                                  {k.volume}
                                </td>
                                <td className="px-2 py-1.5">
                                  <Badge variant="secondary" className="text-[10px] font-normal">
                                    {k.intent}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Strategy output</CardTitle>
                        <CardDescription>Persona, leads, funnel, ads — + OS integration hints</CardDescription>
                      </div>
                      <AdminHelpTip
                        content="Narrative strategies align with the selected persona archetype. Integration hints are structured for CRM lead scoring notes, funnel archetype selection, offer pricing copy, and paid-growth seeds."
                        ariaLabel="Help: Strategy output"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
                      <p className="text-foreground">{result.opportunity.recommendations}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <StrategyBlock title="Persona strategy" body={result.opportunity.personaStrategy} />
                      <StrategyBlock title="Lead acquisition" body={result.opportunity.leadStrategy} />
                      <StrategyBlock title="Funnel" body={result.opportunity.funnelStrategy} />
                      <StrategyBlock title="Paid media" body={result.opportunity.adStrategy} />
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                      <p className="text-xs font-medium text-foreground">Integration hints (CRM / funnels / offers / PPC)</p>
                      <p className="text-xs text-muted-foreground">
                        Suggested lead fit score:{" "}
                        <span className="text-foreground font-semibold">
                          {result.integrationHints.suggestedLeadFitScore}
                        </span>
                        · Funnel archetype: {result.integrationHints.suggestedFunnelArchetype}
                      </p>
                      <p className="text-xs text-muted-foreground">{result.integrationHints.offerPricingNote}</p>
                      <p className="text-xs text-muted-foreground">
                        PPC: {result.integrationHints.paidGrowth.suggestedCampaignTypes.join(", ")}
                        {result.integrationHints.paidGrowth.avoidBroadPpc ? " — avoid broad prospecting until efficiency proves out." : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base text-muted-foreground">Data lineage</CardTitle>
                      <AdminHelpTip
                        content="Shows mock vs mixed mode and providers. google_places = real listings for your form query. amie_baseline = illustrative demand/CPC/economics until Census/BLS populate those fields."
                        ariaLabel="Help: Data lineage"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Mode: <span className="text-foreground">{result.marketData.dataMode}</span>
                    </p>
                    {result.marketData.sources.map((s, i) => (
                      <p key={i}>
                        {s.provider}: {s.label}
                        {s.note ? ` — ${s.note}` : ""}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  valueLabel,
  hint,
  tip,
}: {
  label: string;
  value?: number;
  valueLabel?: string;
  hint: string;
  tip?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {tip ? <AdminHelpTip content={tip} ariaLabel={`Help: ${label}`} /> : null}
        </div>
        <p className="text-2xl font-semibold tabular-nums text-foreground mt-1">
          {valueLabel ?? (value != null ? value : "—")}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

function StrategyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border/60 p-3 bg-background/50">
      <p className="text-xs font-medium text-primary mb-1">{title}</p>
      <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{body}</p>
    </div>
  );
}
