"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FlaskConical, Loader2, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import type { AdminGrowthDiagnostics } from "@shared/conversionDiagnosticsTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminConversionDiagnosticsPage() {
  const days = 14;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/growth-intelligence/diagnostics", days],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/growth-intelligence/diagnostics?days=${days}`);
      return res.json() as Promise<AdminGrowthDiagnostics>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load diagnostics</AlertTitle>
          <AlertDescription>Check admin session and database connectivity.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const eventChart = data.eventTypes.slice(0, 10).map((e) => ({
    name: e.type.length > 18 ? `${e.type.slice(0, 18)}…` : e.type,
    full: e.type,
    count: e.count,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Conversion Diagnostics</h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Operational view for Ascendra operators — sessions, friction, intent heuristics, and experiment handoff. Public
          client snapshots use{" "}
          <Link href="/growth-system/conversion-diagnostics" className="text-primary underline-offset-4 hover:underline">
            Conversion Diagnostics (client)
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.totals.sessions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Behavior events</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.totals.behaviorEvents}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted sessions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.totals.convertedSessions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Heatmap points</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.totals.heatmapPoints}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">Event types</CardTitle>
            <CardDescription>Top signals in the last {data.periodDays} days</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {eventChart.length === 0 ?
              <p className="text-sm text-muted-foreground">No events in this window.</p>
            : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventChart} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number, _name: string, props) => [v, (props.payload as { full: string }).full]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Operator highlights
            </CardTitle>
            <CardDescription>Heuristic summaries — not a black-box model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.aiOperatorHighlights.map((line) => (
              <p key={line} className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
                {line}
              </p>
            ))}
            <Button variant="secondary" size="sm" className="mt-2 gap-2" asChild>
              <Link href="/admin/experiments">
                <FlaskConical className="h-4 w-4" />
                {data.experimentHooks.message}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intent distribution (sampled)</CardTitle>
            <CardDescription>From recent sessions + event depth / path heuristics</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.intentDistribution.map((s) => (
              <Badge key={s.band} variant="outline" className="text-sm py-1 px-2">
                {s.band}: {s.sessions} ({s.pct}%)
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.deviceSplit.length === 0 ?
              <p className="text-sm text-muted-foreground">No session device data.</p>
            : data.deviceSplit.map((d) => (
                <div key={d.device} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.device}</span>
                  <span className="font-medium">{d.sessions}</span>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Top pages by activity</CardTitle>
            <CardDescription>Sessions with events on path + total events</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/behavior-intelligence/heatmaps">Open heatmaps</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 pr-4 font-medium">Page</th>
                <th className="pb-2 pr-4 font-medium">Sessions</th>
                <th className="pb-2 font-medium">Events</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((r) => (
                <tr key={r.page} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-mono text-xs max-w-[280px] truncate">{r.page}</td>
                  <td className="py-2 pr-4">{r.sessions}</td>
                  <td className="py-2">{r.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Friction rollups</CardTitle>
          <CardDescription>Latest aggregates from behavior-friction job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.topFrictionPages.length === 0 ?
            <p className="text-sm text-muted-foreground">No friction reports yet.</p>
          : data.topFrictionPages.map((f) => (
              <div key={`${f.page}-${f.createdAt}`} className="rounded-lg border p-3 text-sm space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary">Rage {f.rageClicks}</Badge>
                  <Badge variant="outline">Dead {f.deadClicks}</Badge>
                  <span className="text-xs text-muted-foreground truncate max-w-full">{f.page}</span>
                </div>
                <p className="text-muted-foreground">{f.summary}</p>
              </div>
            ))
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey pulse (period responses)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.surveyPulse.every((s) => s.responses7d === 0) ?
            <p className="text-sm text-muted-foreground">No survey response volume this week.</p>
          : data.surveyPulse
              .filter((s) => s.responses7d > 0)
              .map((s) => (
                <div key={s.surveyId} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground line-clamp-2">{s.question}</span>
                  <span className="shrink-0 font-medium">{s.responses7d}</span>
                </div>
              ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
