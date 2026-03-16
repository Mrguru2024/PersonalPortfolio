"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface WebsiteAnalyticsResponse {
  traffic: {
    totalEvents: number;
    uniqueVisitors: number;
    byPage: { page: string; count: number; unique: number }[];
    byEventType: { eventType: string; count: number }[];
    byDevice: { device: string; count: number }[];
    byReferrer: { referrer: string; count: number }[];
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
  insights: string[];
  nextActions: { action: string; priority: "high" | "medium" | "low"; reason: string }[];
}

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const since = getSince(timeRange);
  const { data: rawData, isLoading, error } = useQuery<WebsiteAnalyticsResponse>({
    queryKey: ["/api/admin/analytics/website", timeRange, since ?? "all"],
    queryFn: async () => {
      const url = since ? `/api/admin/analytics/website?since=${encodeURIComponent(since)}` : "/api/admin/analytics/website";
      const res = await apiRequest("GET", url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to load analytics");
      }
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

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
          insights: Array.isArray(rawData.insights) ? rawData.insights : [],
          nextActions: Array.isArray(rawData.nextActions) ? rawData.nextActions : [],
        }
      : null;

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
        <div className="flex gap-2">
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
            {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <Card className="border-muted">
          <CardContent className="py-8 text-center text-muted-foreground">
            {error ? null : "No data available. Try again later."}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Total events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.traffic.totalEvents.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{data.traffic.uniqueVisitors.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{data.leadMagnets.totalLeads.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{data.leadMagnets.recentCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Leads (recent)</p>
              </CardContent>
            </Card>
          </div>

          {/* Next actions — prominent */}
          {data.nextActions.length > 0 && (
            <Card className="mb-6 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Recommended next actions
                </CardTitle>
                <CardDescription>Prioritized steps to improve traffic and conversions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.nextActions.map((item, i) => (
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
          {data.insights.length > 0 && (
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
                  {data.insights.map((line, i) => (
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="leads">Lead magnets</TabsTrigger>
              <TabsTrigger value="crm">CRM engagement</TabsTrigger>
            </TabsList>
            <TabsContent value="traffic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top pages</CardTitle>
                  <CardDescription>By views and unique visitors</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.traffic.byPage.length === 0 ? (
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
                          {data.traffic.byPage.slice(0, 15).map((row, i) => (
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
                    {data.traffic.byEventType.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No events</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.traffic.byEventType.map((e, i) => (
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
                    {data.traffic.byDevice.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No device data</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.traffic.byDevice.map((d, i) => (
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
              {data.traffic.byReferrer.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {data.traffic.byReferrer.slice(0, 10).map((r, i) => (
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
            <TabsContent value="leads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lead magnet performance</CardTitle>
                  <CardDescription>Where leads come from (contact form subject / type)</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.leadMagnets.bySource.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No leads in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.leadMagnets.bySource.map((s, i) => (
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
                      <span className="font-medium">{data.crmEngagement.emailOpens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clicks</span>
                      <span className="font-medium">{data.crmEngagement.emailClicks}</span>
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
                      <span className="font-medium">{data.crmEngagement.documentViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High-intent / hot leads</span>
                      <span className="font-medium">{data.crmEngagement.highIntentLeadsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unread CRM alerts</span>
                      <span className="font-medium">{data.crmEngagement.unreadAlertsCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
