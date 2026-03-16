"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  Users,
  MousePointer,
  Target,
  Lightbulb,
  CheckSquare,
  Monitor,
  Smartphone,
  FileText,
  Mail,
  AlertCircle,
  BookOpen,
  ListOrdered,
  ChevronDown,
  ChevronRight,
  Globe,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

type TimeRange = "7d" | "30d" | "90d" | "all";

/** Human-readable labels for event metadata keys */
const METADATA_LABELS: Record<string, string> = {
  url: "Page URL",
  viewport: "Viewport",
  userAgent: "Browser",
  utm_source: "UTM Source",
  utm_medium: "UTM Medium",
  utm_campaign: "UTM Campaign",
  utm_term: "UTM Term",
  utm_content: "UTM Content",
  cta: "CTA",
  form: "Form",
  tool: "Tool",
  referrer: "Referrer",
};

function formatMetadataForDisplay(meta: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(meta).map(([key, val]) => {
    const label = METADATA_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let value: string;
    if (val == null) value = "—";
    else if (typeof val === "string") value = val;
    else if (typeof val === "number" || typeof val === "boolean") value = String(val);
    else if (Array.isArray(val)) value = val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
    else if (typeof val === "object") value = JSON.stringify(val).slice(0, 200) + (JSON.stringify(val).length > 200 ? "…" : "");
    else value = String(val);
    return { label, value };
  });
}

/** Never show raw JSON to the user; return a short digestible message */
function formatErrorMessage(raw: unknown): string {
  if (raw == null) return "Something went wrong.";
  if (raw instanceof Error && raw.message?.trim()) return raw.message.trim().slice(0, 200);
  const s = typeof raw === "string" ? raw : String(raw);
  const t = s.trim();
  if (t === "[object Object]" || !t) return "Something went wrong.";
  if ((t.startsWith("{") && t.includes("}")) || (t.startsWith("[") && t.includes("]"))) {
    try {
      const parsed = JSON.parse(t) as Record<string, unknown>;
      if (typeof parsed?.message === "string" && parsed.message.trim()) return parsed.message.trim();
      if (typeof parsed?.error === "string" && parsed.error.trim()) return parsed.error.trim();
    } catch {
      // ignore
    }
    return "Something went wrong. Try again.";
  }
  return t.slice(0, 200) + (t.length > 200 ? "…" : "");
}

interface WebsiteAnalyticsResponse {
  traffic: {
    totalEvents: number;
    uniqueVisitors: number;
    byPage: { page: string; count: number; unique: number }[];
    byEventType: { eventType: string; count: number }[];
    byDevice: { device: string; count: number }[];
    byReferrer: { referrer: string; count: number }[];
    byCountry?: { country: string; count: number; unique: number }[];
    byRegion?: { region: string; country: string; count: number }[];
    byCity?: { city: string; region: string; country: string; count: number }[];
    byTimezone?: { timezone: string; count: number }[];
  };
  leadMagnets: {
    totalLeads: number;
    bySource: { source: string; label: string; count: number }[];
    recentCount: number;
  };
  crmEngagement: {
    emailOpens: number;
    emailClicks: number;
    documentViews: number;
    highIntentLeadsCount: number;
    unreadAlertsCount: number;
  };
  leadDemographics?: {
    byAgeRange: { value: string; count: number }[];
    byGender: { value: string; count: number }[];
    byOccupation: { value: string; count: number }[];
    byCompanySize: { value: string; count: number }[];
    totalWithDemographics: number;
  };
  insights: string[];
  nextActions: { action: string; priority: "high" | "medium" | "low"; reason: string }[];
}

interface VisitorActivityEvent {
  id: number;
  visitorId: string;
  sessionId: string | null;
  pageVisited: string | null;
  eventType: string;
  referrer: string | null;
  deviceType: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const defaultDisplayData = {
  traffic: {
    totalEvents: 0,
    uniqueVisitors: 0,
    byPage: [] as { page: string; count: number; unique: number }[],
    byEventType: [] as { eventType: string; count: number }[],
    byDevice: [] as { device: string; count: number }[],
    byReferrer: [] as { referrer: string; count: number }[],
    byCountry: [] as { country: string; count: number; unique: number }[],
    byRegion: [] as { region: string; country: string; count: number }[],
    byCity: [] as { city: string; region: string; country: string; count: number }[],
    byTimezone: [] as { timezone: string; count: number }[],
  },
  leadMagnets: { totalLeads: 0, bySource: [], recentCount: 0 },
  crmEngagement: { emailOpens: 0, emailClicks: 0, documentViews: 0, highIntentLeadsCount: 0, unreadAlertsCount: 0 },
  leadDemographics: {
    byAgeRange: [],
    byGender: [],
    byOccupation: [],
    byCompanySize: [],
    totalWithDemographics: 0,
  },
  insights: [] as string[],
  nextActions: [] as { action: string; priority: "high" | "medium" | "low"; reason: string }[],
};

function getSince(range: TimeRange): string | null {
  const d = new Date();
  if (range === "7d") {
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (range === "30d") {
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
  if (range === "90d") {
    d.setDate(d.getDate() - 90);
    return d.toISOString();
  }
  return null;
}

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const queryKeyWebsite = ["/api/admin/analytics/website", timeRange];
  const queryKeyEvents = ["/api/admin/analytics/website/events", timeRange];

  const { data: rawData, isLoading, error, refetch: refetchWebsite, isFetching: isFetchingWebsite } = useQuery<WebsiteAnalyticsResponse>({
    queryKey: queryKeyWebsite,
    queryFn: async () => {
      const since = getSince(timeRange);
      const url = since ? `/api/admin/analytics/website?since=${encodeURIComponent(since)}` : "/api/admin/analytics/website";
      const res = await apiRequest("GET", url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to load analytics");
      }
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: () => (typeof document !== "undefined" && document.visibilityState === "visible" ? 5 * 60 * 1000 : false),
    retry: (failureCount, err) => {
      const msg = String(err?.message ?? "");
      if (msg.includes("Admin access required") || msg.includes("403")) return false;
      return failureCount < 2;
    },
  });

  const {
    data: eventsData = [],
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsErrorDetail,
    refetch: refetchEvents,
    isFetching: isFetchingEvents,
  } = useQuery<VisitorActivityEvent[]>({
    queryKey: queryKeyEvents,
    queryFn: async ({ signal, queryKey }) => {
      const since = getSince(queryKey[1] as TimeRange);
      const url = since
        ? `/api/admin/analytics/website/events?since=${encodeURIComponent(since)}&limit=200`
        : "/api/admin/analytics/website/events?limit=200";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      if (signal) {
        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          controller.abort();
        });
      }
      try {
        const res = await fetch(url, { credentials: "include", signal: controller.signal });
        clearTimeout(timeoutId);
        const json = await res.json().catch(() => []);
        if (!res.ok) throw new Error("Failed to load events");
        return Array.isArray(json) ? json : [];
      } catch (e) {
        clearTimeout(timeoutId);
        if (e instanceof Error && e.name === "AbortError") throw new Error("Request timed out");
        throw e;
      }
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: () => (typeof document !== "undefined" && document.visibilityState === "visible" ? 5 * 60 * 1000 : false),
    retry: 1,
    retryDelay: 2000,
  });

  const handleRefresh = () => {
    refetchWebsite();
    refetchEvents();
  };

  const data =
    rawData && typeof rawData.traffic === "object"
      ? {
          traffic: {
            totalEvents: rawData.traffic?.totalEvents ?? 0,
            uniqueVisitors: rawData.traffic?.uniqueVisitors ?? 0,
            byPage: rawData.traffic?.byPage ?? [],
            byEventType: rawData.traffic?.byEventType ?? [],
            byDevice: rawData.traffic?.byDevice ?? [],
            byReferrer: rawData.traffic?.byReferrer ?? [],
            byCountry: rawData.traffic?.byCountry ?? [],
            byRegion: rawData.traffic?.byRegion ?? [],
            byCity: rawData.traffic?.byCity ?? [],
            byTimezone: rawData.traffic?.byTimezone ?? [],
          },
          leadMagnets: {
            totalLeads: rawData.leadMagnets?.totalLeads ?? 0,
            bySource: rawData.leadMagnets?.bySource ?? [],
            recentCount: rawData.leadMagnets?.recentCount ?? 0,
          },
          crmEngagement: rawData.crmEngagement
            ? {
                emailOpens: rawData.crmEngagement.emailOpens ?? 0,
                emailClicks: rawData.crmEngagement.emailClicks ?? 0,
                documentViews: rawData.crmEngagement.documentViews ?? 0,
                highIntentLeadsCount: rawData.crmEngagement.highIntentLeadsCount ?? 0,
                unreadAlertsCount: rawData.crmEngagement.unreadAlertsCount ?? 0,
              }
            : { emailOpens: 0, emailClicks: 0, documentViews: 0, highIntentLeadsCount: 0, unreadAlertsCount: 0 },
          leadDemographics: rawData.leadDemographics
            ? {
                byAgeRange: Array.isArray(rawData.leadDemographics.byAgeRange) ? rawData.leadDemographics.byAgeRange : [],
                byGender: Array.isArray(rawData.leadDemographics.byGender) ? rawData.leadDemographics.byGender : [],
                byOccupation: Array.isArray(rawData.leadDemographics.byOccupation) ? rawData.leadDemographics.byOccupation : [],
                byCompanySize: Array.isArray(rawData.leadDemographics.byCompanySize) ? rawData.leadDemographics.byCompanySize : [],
                totalWithDemographics: rawData.leadDemographics.totalWithDemographics ?? 0,
              }
            : defaultDisplayData.leadDemographics,
          insights: Array.isArray(rawData.insights) ? rawData.insights : [],
          nextActions: Array.isArray(rawData.nextActions) ? rawData.nextActions : [],
        }
      : null;

  const displayData = data ?? defaultDisplayData;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Website analytics</h1>
            <p className="text-muted-foreground text-sm">
              Traffic flow, lead magnet performance, and what to do next
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetchingWebsite || isFetchingEvents}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingWebsite || isFetchingEvents ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <Button
              key={r}
              variant={timeRange === r ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(r)}
            >
              {r === "all" ? "All time" : r}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 mb-6">
          <CardContent className="py-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formatErrorMessage(error)}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {!data && !error && (
            <p className="text-sm text-muted-foreground mb-4">Traffic summary unavailable. Event log and other tabs may still load.</p>
          )}
          {/* Summary cards — displayData so tabs (e.g. Event log) always render */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Total events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayData.traffic.totalEvents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Page views, form starts, CTAs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Unique visitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayData.traffic.uniqueVisitors.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">In selected period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayData.leadMagnets.totalLeads.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Form submissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Last 30 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayData.leadMagnets.recentCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Leads (recent)</p>
              </CardContent>
            </Card>
          </div>

          {/* Next actions — prominent */}
          {displayData.nextActions.length > 0 && (
            <Card className="mb-6 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Recommended next actions
                </CardTitle>
                <CardDescription>Prioritized steps to improve traffic and conversions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayData.nextActions.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border p-3 bg-muted/30"
                  >
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="w-fit"
                    >
                      {item.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {displayData.insights.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Insights
                </CardTitle>
                <CardDescription>What the data shows</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {displayData.insights.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* How to improve: tracking and events */}
          <Card className="mb-6 border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                How to improve tracking & wire more events
              </CardTitle>
              <CardDescription>
                Traffic and lead-magnet analytics use <code className="text-xs bg-muted px-1 rounded">POST /api/track/visitor</code>. Wire events sitewide for accurate data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">1. Use the hook</p>
                <p className="text-muted-foreground mb-2">
                  In any client component: <code className="bg-muted px-1 rounded text-xs">useVisitorTracking()</code> from <code className="bg-muted px-1 rounded text-xs">@/lib/useVisitorTracking</code>. Call <code className="bg-muted px-1 rounded text-xs">track(eventType, &#123; pageVisited?, metadata? &#125;)</code>.
                </p>
                <p className="text-muted-foreground">
                  Event types: <strong>page_view</strong>, <strong>form_started</strong>, <strong>form_completed</strong>, <strong>cta_click</strong>, <strong>tool_used</strong>.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">2. Where to wire events</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li><strong>page_view</strong> on mount: /audit, /strategy-call, /contact, /assessment, /assessment/results, /digital-growth-audit, /competitor-position-snapshot, /free-growth-tools, funnel pages</li>
                  <li><strong>form_started</strong>: when user focuses first field of audit, strategy-call, contact, or assessment form</li>
                  <li><strong>form_completed</strong>: on successful submit (audit, strategy-call, contact, assessment)</li>
                  <li><strong>cta_click</strong>: primary CTAs (e.g. &quot;Book a call&quot;, &quot;Get AI feedback&quot;, &quot;Start audit&quot;, &quot;Request snapshot&quot;)</li>
                  <li><strong>tool_used</strong>: calculator, snapshot tool, or other interactive tools</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">3. Keep data accurate</p>
                <p className="text-muted-foreground">
                  Lead counts come from the <strong>contacts</strong> table (subject/projectType). Ensure forms submit to /api/audit, /api/contact, or /api/strategy-call with the correct subject so lead magnet breakdown stays accurate. Assessment grades use <strong>assessment.assessmentData</strong> only; the grade API returns 0–100 and structured feedback for results pages.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="traffic" className="space-y-4">
            <TabsList className="flex flex-nowrap h-auto min-h-[44px] overflow-x-auto overflow-y-hidden gap-1 p-1.5 rounded-lg [&>button]:shrink-0 [&>button]:min-h-[40px]">
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 shrink-0" />
                Location
              </TabsTrigger>
              <TabsTrigger value="demographics" className="flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" />
                Demographics
              </TabsTrigger>
              <TabsTrigger value="leads">Lead magnets</TabsTrigger>
              <TabsTrigger value="crm">CRM engagement</TabsTrigger>
              <TabsTrigger value="events">Event log</TabsTrigger>
            </TabsList>
            <TabsContent value="traffic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top pages</CardTitle>
                  <CardDescription>By views and unique visitors</CardDescription>
                </CardHeader>
                <CardContent>
                  {displayData.traffic.byPage.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No page data. Add visitor tracking to key pages.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Page</th>
                            <th className="text-right py-2 font-medium">Views</th>
                            <th className="text-right py-2 font-medium">Unique</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.traffic.byPage.slice(0, 15).map((row, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2 font-mono text-xs truncate max-w-[200px]" title={row.page}>
                                {row.page}
                              </td>
                              <td className="text-right py-2">{row.count}</td>
                              <td className="text-right py-2">{row.unique}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By event type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {displayData.traffic.byEventType.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No events</p>
                    ) : (
                      <ul className="space-y-2">
                        {displayData.traffic.byEventType.map((e, i) => (
                          <li key={i} className="flex justify-between text-sm">
                            <span>{e.eventType.replace(/_/g, " ")}</span>
                            <span className="font-medium">{e.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <Smartphone className="h-4 w-4" />
                      By device
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {displayData.traffic.byDevice.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No device data</p>
                    ) : (
                      <ul className="space-y-2">
                        {displayData.traffic.byDevice.map((d, i) => (
                          <li key={i} className="flex justify-between text-sm">
                            <span>{d.device}</span>
                            <span className="font-medium">{d.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
              {displayData.traffic.byReferrer.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {displayData.traffic.byReferrer.slice(0, 10).map((r, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span className="truncate" title={r.referrer}>
                            {r.referrer}
                          </span>
                          <span className="font-medium shrink-0">{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Location & demographics
                  </CardTitle>
                  <CardDescription>
                    Visitor location from request geo (Vercel/Cloudflare headers). Country, region, city, and timezone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {displayData.traffic.byCountry && displayData.traffic.byCountry.length > 0 ? (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold mb-3">By country</h4>
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-2 px-2 font-medium">Country</th>
                                <th className="text-right py-2 px-2 font-medium">Events</th>
                                <th className="text-right py-2 px-2 font-medium">Unique visitors</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayData.traffic.byCountry.slice(0, 25).map((row, i) => (
                                <tr key={i} className="border-b border-border/50">
                                  <td className="py-2 px-2">{row.country}</td>
                                  <td className="text-right py-2 px-2">{row.count.toLocaleString()}</td>
                                  <td className="text-right py-2 px-2">{row.unique.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {displayData.traffic.byRegion && displayData.traffic.byRegion.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">By region</h4>
                          <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left py-2 px-2 font-medium">Region</th>
                                  <th className="text-left py-2 px-2 font-medium">Country</th>
                                  <th className="text-right py-2 px-2 font-medium">Events</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayData.traffic.byRegion.slice(0, 30).map((row, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    <td className="py-2 px-2">{row.region}</td>
                                    <td className="py-2 px-2">{row.country}</td>
                                    <td className="text-right py-2 px-2">{row.count.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {displayData.traffic.byCity && displayData.traffic.byCity.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">By city</h4>
                          <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left py-2 px-2 font-medium">City</th>
                                  <th className="text-left py-2 px-2 font-medium">Region</th>
                                  <th className="text-left py-2 px-2 font-medium">Country</th>
                                  <th className="text-right py-2 px-2 font-medium">Events</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayData.traffic.byCity.slice(0, 40).map((row, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    <td className="py-2 px-2">{row.city}</td>
                                    <td className="py-2 px-2">{row.region}</td>
                                    <td className="py-2 px-2">{row.country}</td>
                                    <td className="text-right py-2 px-2">{row.count.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {displayData.traffic.byTimezone && displayData.traffic.byTimezone.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">By timezone</h4>
                          <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left py-2 px-2 font-medium">Timezone</th>
                                  <th className="text-right py-2 px-2 font-medium">Events</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayData.traffic.byTimezone.slice(0, 20).map((row, i) => (
                                  <tr key={i} className="border-b border-border/50">
                                    <td className="py-2 px-2 font-mono text-xs">{row.timezone}</td>
                                    <td className="text-right py-2 px-2">{row.count.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No location data yet. Geo is set from Vercel or Cloudflare request headers when visitors hit the site; events recorded after deployment will include country/region/city when available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="demographics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lead qualifying & demographics
                  </CardTitle>
                  <CardDescription>
                    Age, gender, occupation, and company size from form submissions. Use this to understand who converts and where to improve messaging for underperforming segments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {displayData.leadDemographics.totalWithDemographics === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No demographic data yet. Add optional fields (age range, gender, occupation, company size) to your contact, audit, and strategy-call forms so new leads are tagged. Existing leads won’t have this data until you re-collect or import it.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <strong>{displayData.leadDemographics.totalWithDemographics}</strong> leads in this period have at least one demographic field. Breakdowns below show only collected values.
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        {displayData.leadDemographics.byAgeRange.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">By age range</h4>
                            <div className="overflow-x-auto rounded-md border">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left py-2 px-2 font-medium">Age range</th>
                                    <th className="text-right py-2 px-2 font-medium">Leads</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayData.leadDemographics.byAgeRange.map((row, i) => (
                                    <tr key={`age-${row.value}-${i}`} className="border-b border-border/50">
                                      <td className="py-2 px-2">{row.value}</td>
                                      <td className="text-right py-2 px-2">{row.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {displayData.leadDemographics.byGender.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">By gender</h4>
                            <div className="overflow-x-auto rounded-md border">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left py-2 px-2 font-medium">Gender</th>
                                    <th className="text-right py-2 px-2 font-medium">Leads</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayData.leadDemographics.byGender.map((row, i) => (
                                    <tr key={`gender-${row.value}-${i}`} className="border-b border-border/50">
                                      <td className="py-2 px-2">{row.value}</td>
                                      <td className="text-right py-2 px-2">{row.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {displayData.leadDemographics.byOccupation.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">By occupation</h4>
                            <div className="overflow-x-auto rounded-md border">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left py-2 px-2 font-medium">Occupation</th>
                                    <th className="text-right py-2 px-2 font-medium">Leads</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayData.leadDemographics.byOccupation.map((row, i) => (
                                    <tr key={`occ-${row.value}-${i}`} className="border-b border-border/50">
                                      <td className="py-2 px-2">{row.value}</td>
                                      <td className="text-right py-2 px-2">{row.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {displayData.leadDemographics.byCompanySize.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3">By company size</h4>
                            <div className="overflow-x-auto rounded-md border">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left py-2 px-2 font-medium">Company size</th>
                                    <th className="text-right py-2 px-2 font-medium">Leads</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayData.leadDemographics.byCompanySize.map((row, i) => (
                                    <tr key={`size-${row.value}-${i}`} className="border-b border-border/50">
                                      <td className="py-2 px-2">{row.value}</td>
                                      <td className="text-right py-2 px-2">{row.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="leads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lead magnet performance</CardTitle>
                  <CardDescription>Where leads come from (contact form subject / type)</CardDescription>
                </CardHeader>
                <CardContent>
                  {displayData.leadMagnets.bySource.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No leads in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {displayData.leadMagnets.bySource.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{s.label}</span>
                          </div>
                          <Badge variant="secondary">{s.count} leads</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="crm" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Opens</span>
                      <span className="font-medium">{displayData.crmEngagement.emailOpens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clicks</span>
                      <span className="font-medium">{displayData.crmEngagement.emailClicks}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & intent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Proposal/document views</span>
                      <span className="font-medium">{displayData.crmEngagement.documentViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High-intent / hot leads</span>
                      <span className="font-medium">{displayData.crmEngagement.highIntentLeadsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unread CRM alerts</span>
                      <span className="font-medium">{displayData.crmEngagement.unreadAlertsCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListOrdered className="h-5 w-5" />
                    Event log — full visitor interaction details
                  </CardTitle>
                  <CardDescription>
                    Every tracked event: page views, form starts/completions, CTA clicks, tool use. Includes device, referrer, viewport, UTM, and custom metadata. Use filters to narrow by event type or page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Event type</span>
                      <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="page_view">page_view</SelectItem>
                          <SelectItem value="form_started">form_started</SelectItem>
                          <SelectItem value="form_completed">form_completed</SelectItem>
                          <SelectItem value="cta_click">cta_click</SelectItem>
                          <SelectItem value="tool_used">tool_used</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Page</span>
                      <Select value={pageFilter} onValueChange={setPageFilter}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All pages</SelectItem>
                          {Array.from(
                            new Set(
                              (eventsData as VisitorActivityEvent[])
                                .map((e) => (e.pageVisited ?? "").trim())
                                .filter(Boolean)
                            )
                          )
                            .sort()
                            .map((p) => (
                              <SelectItem key={p} value={p}>
                                {p.length > 35 ? p.slice(0, 35) + "…" : p}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {eventsError ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <p className="text-muted-foreground text-sm text-center">
                        {formatErrorMessage(eventsErrorDetail?.message ?? "Couldn’t load events.")}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetchEvents()}>
                        Try again
                      </Button>
                    </div>
                  ) : eventsLoading && !eventsData?.length ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !eventsData?.length ? (
                    <p className="text-muted-foreground text-sm py-4">No events in this period. Tracking runs when visitors load key pages and interact with forms/CTAs.</p>
                  ) : (
                    (() => {
                      const filtered = (eventsData as VisitorActivityEvent[]).filter((e) => {
                        if (eventTypeFilter !== "all" && e.eventType !== eventTypeFilter) return false;
                        if (pageFilter !== "all" && (e.pageVisited ?? "").trim() !== pageFilter) return false;
                        return true;
                      });
                      return (
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-2 px-2 font-medium w-8" />
                                <th className="text-left py-2 px-2 font-medium">Time</th>
                                <th className="text-left py-2 px-2 font-medium">Visitor</th>
                                <th className="text-left py-2 px-2 font-medium">Event</th>
                                <th className="text-left py-2 px-2 font-medium max-w-[180px]">Page</th>
                                <th className="text-left py-2 px-2 font-medium">Device</th>
                                <th className="text-left py-2 px-2 font-medium max-w-[100px]">Location</th>
                                <th className="text-left py-2 px-2 font-medium max-w-[120px]">Referrer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.slice(0, 150).map((e) => {
                                const meta = e.metadata ?? {};
                                const hasDetails = Object.keys(meta).length > 0;
                                const isExpanded = expandedEventId === e.id;
                                return (
                                  <React.Fragment key={e.id}>
                                    <tr
                                      className="border-b border-border/50 hover:bg-muted/30"
                                    >
                                      <td className="py-1 px-2">
                                        {hasDetails ? (
                                          <button
                                            type="button"
                                            onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                                            className="p-0.5 rounded hover:bg-muted"
                                            aria-label={isExpanded ? "Collapse" : "Expand details"}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </button>
                                        ) : null}
                                      </td>
                                      <td className="py-1 px-2 whitespace-nowrap text-muted-foreground">
                                        {format(new Date(e.createdAt), "MMM d, HH:mm:ss")}
                                      </td>
                                      <td className="py-1 px-2 font-mono text-xs" title={e.visitorId}>
                                        {e.visitorId.slice(0, 12)}…
                                      </td>
                                      <td className="py-1 px-2">
                                        <Badge variant="secondary" className="font-normal">
                                          {e.eventType}
                                        </Badge>
                                      </td>
                                      <td className="py-1 px-2 truncate max-w-[180px]" title={e.pageVisited ?? ""}>
                                        {e.pageVisited ?? "—"}
                                      </td>
                                      <td className="py-1 px-2">{e.deviceType ?? "—"}</td>
                                      <td className="py-1 px-2 truncate max-w-[100px] text-muted-foreground" title={[e?.city, e?.region, e?.country].filter(Boolean).join(", ") || "—"}>
                                        {[e?.city, e?.country].filter(Boolean).join(", ") || (e?.country ?? "—")}
                                      </td>
                                      <td className="py-1 px-2 truncate max-w-[120px] text-muted-foreground" title={e.referrer ?? ""}>
                                        {e.referrer ? (e.referrer.length > 20 ? e.referrer.slice(0, 20) + "…" : e.referrer) : "direct"}
                                      </td>
                                    </tr>
                                    {isExpanded && hasDetails && (
                                      <tr className="border-b bg-muted/20">
                                        <td colSpan={8} className="py-2 px-3">
                                          <div className="text-xs bg-background rounded p-3 border overflow-x-auto max-h-48 overflow-y-auto">
                                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                              {formatMetadataForDisplay(meta).map(({ label, value }) => (
                                                <div key={label} className="flex flex-col gap-0.5">
                                                  <dt className="font-medium text-muted-foreground">{label}</dt>
                                                  <dd className="whitespace-pre-wrap break-all text-foreground">{value}</dd>
                                                </div>
                                              ))}
                                            </dl>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  )}
                  {eventsData?.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Showing up to 150 filtered events. Full URL, viewport, UTM params, and interaction metadata are in the expandable details.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
