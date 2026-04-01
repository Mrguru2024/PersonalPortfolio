"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, MousePointer, Target, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

type TimeRange = "30d";

function getSince(_range: TimeRange): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

interface TrafficSummaryResponse {
  traffic?: { totalEvents?: number; uniqueVisitors?: number };
  leadMagnets?: { totalLeads?: number; recentCount?: number };
}

export function AnalyticsSummaryCardsWidget() {
  const { user } = useAuth();
  const enabled = !!user?.isAdmin && !!user?.adminApproved;

  const { data: raw, isLoading, error } = useQuery<TrafficSummaryResponse>({
    queryKey: ["/api/admin/analytics/website", "widget", "30d"],
    queryFn: async () => {
      const since = getSince("30d");
      const res = await apiRequest("GET", `/api/admin/analytics/website?since=${encodeURIComponent(since)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to load analytics");
      }
      return res.json();
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  if (!enabled) return null;

  const totalEvents = raw?.traffic?.totalEvents ?? 0;
  const uniqueVisitors = raw?.traffic?.uniqueVisitors ?? 0;
  const totalLeads = raw?.leadMagnets?.totalLeads ?? 0;
  const recentCount = raw?.leadMagnets?.recentCount ?? 0;

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-muted-foreground">Analytics summary unavailable.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground py-2">Loading analytics…</p>
      ) : null}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Total events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
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
            <div className="text-xl sm:text-2xl font-bold tabular-nums">{uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In period</p>
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
            <div className="text-xl sm:text-2xl font-bold tabular-nums">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Form submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">{recentCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-9 gap-1.5" asChild>
          <Link href="/admin/analytics">
            Open analytics
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
