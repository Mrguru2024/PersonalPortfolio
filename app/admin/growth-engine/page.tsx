"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, DollarSign, Loader2, Radio, Workflow, BookOpen, GitBranch } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GrowthEngineHubPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/overview"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/overview");
      return res.json() as Promise<{
        signals24h: number;
        revenue30dCents: number;
        activeRules: number;
        knowledgeEntries: number;
        automationRunsPending: number;
      }>;
    },
    enabled: !!user?.isAdmin,
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  const rev =
    data?.revenue30dCents != null ?
      (data.revenue30dCents / 100).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Phase 2</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Growth engine</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Revenue attribution, live lead signals, automations, ROI inputs, and funnel canvas — built on Growth Intelligence
          behavior data without duplicating analytics.
        </p>
      </div>

      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-amber-600" />
                Lead signals (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">{data?.signals24h ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Revenue events (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">{rev}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Workflow className="h-4 w-4 text-sky-600" />
                Automations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <span className="text-2xl font-semibold text-foreground">{data?.activeRules ?? 0}</span> active rules ·{" "}
              <span className="tabular-nums">{data?.automationRunsPending ?? 0}</span> pending runs
            </CardContent>
          </Card>
        </div>
      }

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base">Operate</CardTitle>
            <CardDescription>Record revenue, react to signals, log calls.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/revenue">
                Revenue <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/alerts">Lead alerts</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/calls">Calls</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Systemize</CardTitle>
            <CardDescription>Automations, spend, internal learnings, funnel map.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/automations">Automations</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/roi">ROI &amp; costs</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/knowledge">
                <BookOpen className="h-3 w-3 mr-1" /> Knowledge
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/growth-engine/funnel-canvas">
                <GitBranch className="h-3 w-3 mr-1" /> Funnel canvas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Cron job <code className="bg-muted px-1 rounded">/api/cron/growth-engine</code> runs every five minutes (configure{" "}
        <code className="bg-muted px-1 rounded">CRON_SECRET</code> in production). Internal module notes:{" "}
        <code className="bg-muted px-1 rounded">Docs/GROWTH-PHASE2.md</code>.
      </p>
    </div>
  );
}
