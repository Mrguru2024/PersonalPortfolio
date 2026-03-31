"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type FunnelMetricsPayload = {
  blueprintKey: string;
  blueprintLabel: string;
  periodDays: number;
  sinceIso: string;
  totalBehaviorEventsInWindow: number;
  steps: Array<{
    id: string;
    type: string;
    label: string;
    path?: string;
    pathNormalized: string;
    behaviorEvents: number;
    distinctSessions: number;
  }>;
};

export default function FunnelOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [key, setKey] = useState("startup");
  const [days, setDays] = useState("30");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["/api/admin/growth-engine/funnel-metrics", key, days],
    queryFn: async () => {
      const qs = new URLSearchParams({ key, days: days || "30" });
      const res = await apiRequest("GET", `/api/admin/growth-engine/funnel-metrics?${qs.toString()}`);
      return res.json() as Promise<FunnelMetricsPayload>;
    },
    enabled: !!user?.isAdmin && key.trim().length > 0,
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  const d = Number(days);
  const daysValid = Number.isFinite(d) && d >= 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Phase 2</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <GitBranch className="h-7 w-7 text-emerald-600 shrink-0" />
            Funnel overview
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Blueprint step paths matched to <code className="text-xs">metadata.page</code> on behavior events (site-wide,
            not CRM-scoped). Edit the canvas to change paths and order.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/growth-engine/funnel-canvas">Open funnel canvas</Link>
        </Button>
      </div>

      <Card className="max-w-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Blueprint key and rolling window.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="bp-key">Blueprint key</Label>
            <Input id="bp-key" value={key} onChange={(e) => setKey(e.target.value)} className="h-9 w-40 font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bp-days">Days</Label>
            <Input
              id="bp-days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="h-9 w-24"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading || isFetching ?
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      : !daysValid ?
        <p className="text-sm text-destructive">Enter a valid day count (1–365).</p>
      : data ?
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.blueprintLabel}</span>
            <span className="mx-1">·</span>
            last {data.periodDays} days since {new Date(data.sinceIso).toLocaleString()}
            <span className="mx-1">·</span>
            <span className="tabular-nums">{data.totalBehaviorEventsInWindow.toLocaleString()}</span> behavior events
            (all pages)
          </p>
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="p-3 font-medium">Step</th>
                  <th className="p-3 font-medium">Path</th>
                  <th className="p-3 font-medium text-right tabular-nums">Events</th>
                  <th className="p-3 font-medium text-right tabular-nums">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {data.steps.map((s) => (
                  <tr key={s.id} className="border-b border-border/80 last:border-0">
                    <td className="p-3">
                      <span className="text-muted-foreground text-xs uppercase mr-2">{s.type}</span>
                      {s.label}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground break-all max-w-[240px]">
                      {s.pathNormalized || (s.path ? s.path : "—")}
                    </td>
                    <td className="p-3 text-right tabular-nums">{s.behaviorEvents.toLocaleString()}</td>
                    <td className="p-3 text-right tabular-nums">{s.distinctSessions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      : null}
    </div>
  );
}
