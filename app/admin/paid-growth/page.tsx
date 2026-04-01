"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

type DashboardPayload = {
  primary: {
    qualifiedLeads: number;
    bookedCalls: number;
    costPerQualifiedLeadCents: number | null;
    leadToOpportunityRate: number | null;
    leadQualityTrend: "up" | "down" | "flat" | null;
  };
  secondary: {
    impressions: number;
    clicks: number;
    ctr: number | null;
    cpcCents: number | null;
  };
  totals: {
    campaigns: number;
    activeCampaigns: number;
    spendCentsSample: number;
    leadQualityRows: number;
  };
  optimizationHints: string[];
  persistedOptimization?: { id: number; campaignId: number; severity: string; title: string; detail: string }[];
  recentCampaigns: { id: number; name: string; status: string; platform: string }[];
  syncIssues: { id: number; name: string; lastSyncError: string | null }[];
  recentLeadQuality: { id: number; crmContactId: number; fitScore: number | null; contact?: { name: string; email: string } }[];
};

function formatCpql(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatRate(r: number | null) {
  if (r == null) return "—";
  return `${Math.round(r * 100)}%`;
}

export default function PaidGrowthDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/dashboard");
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<DashboardPayload>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TrendIcon =
    data?.primary.leadQualityTrend === "up" ? TrendingUp
    : data?.primary.leadQualityTrend === "down" ? TrendingDown
    : Minus;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Primary — business outcomes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Qualified leads</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? "—" : (data?.primary.qualifiedLeads ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Booked calls</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? "—" : (data?.primary.bookedCalls ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cost / qualified lead</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? "—" : formatCpql(data?.primary.costPerQualifiedLeadCents ?? null)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lead → opportunity</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? "—" : formatRate(data?.primary.leadToOpportunityRate ?? null)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                Lead quality trend
                {!isLoading && data?.primary.leadQualityTrend && (
                  <TrendIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums capitalize">
                {isLoading ? "—" : (data?.primary.leadQualityTrend ?? "—")}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Secondary — delivery metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Impressions (sample)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? "—" : (data?.secondary.impressions ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Clicks (sample)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? "—" : (data?.secondary.clicks ?? 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>CTR (weighted)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading || data?.secondary.ctr == null ?
                  "—"
                : data.secondary.ctr <= 1 ?
                  `${(data.secondary.ctr * 100).toFixed(2)}%`
                : `${data.secondary.ctr.toFixed(2)}%`}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>CPC (avg sample)</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading || data?.secondary.cpcCents == null ?
                  "—"
                : `$${(data.secondary.cpcCents / 100).toFixed(2)}`}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["campaigns", "activeCampaigns", "spendCentsSample", "leadQualityRows"] as const).map((k) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardDescription className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</CardDescription>
              <CardTitle className="text-xl tabular-nums">
                {isLoading ? "—" : (data?.totals as Record<string, number>)?.[k] ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {data?.optimizationHints && data.optimizationHints.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Optimization (from lead quality)</CardTitle>
            <CardDescription>Uses classified fit, spam, and outcomes — not vanity metrics alone</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {data.optimizationHints.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {data?.persistedOptimization && data.persistedOptimization.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Optimization (persisted rules)</CardTitle>
              <CardDescription>From the rules engine — dismiss or apply in the Optimization tab</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/paid-growth/optimization">Open optimization</Link>
            </Button>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {data.persistedOptimization.slice(0, 8).map((r) => (
              <div key={r.id} className="border-b border-border/50 pb-2 last:border-0">
                <div className="flex flex-wrap gap-2 items-center mb-1">
                  <Badge variant={r.severity === "critical" ? "destructive" : "secondary"}>{r.severity}</Badge>
                  <Link href={`/admin/paid-growth/campaigns/${r.campaignId}`} className="font-medium text-primary hover:underline">
                    Campaign #{r.campaignId}
                  </Link>
                </div>
                <p className="font-medium">{r.title}</p>
                <p className="text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data?.syncIssues && data.syncIssues.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Sync / publish issues</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {data.syncIssues.map((c) => (
              <div key={c.id} className="flex justify-between gap-2">
                <Link className="font-medium text-primary underline" href={`/admin/paid-growth/campaigns/${c.id}`}>
                  {c.name}
                </Link>
                <span className="text-muted-foreground truncate max-w-[50%]" title={c.lastSyncError ?? ""}>
                  {c.lastSyncError}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent campaigns</CardTitle>
            <CardDescription>Drill into builder, readiness, and publish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              (data?.recentCampaigns ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/paid-growth/campaigns/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <Badge variant="secondary">{c.status}</Badge>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/admin/paid-growth/campaigns/new">New campaign</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead quality (recent)</CardTitle>
            <CardDescription>CRM-linked classifications for CPQL and tuning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.recentLeadQuality ?? []).slice(0, 8).map((r) => (
              <div key={r.id} className="flex justify-between gap-2">
                <Link className="truncate hover:underline" href={`/admin/crm/${r.crmContactId}`}>
                  {r.contact?.name ?? r.contact?.email ?? `Lead #${r.crmContactId}`}
                </Link>
                <span className="text-muted-foreground shrink-0">fit {r.fitScore ?? "—"}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/paid-growth/lead-quality">Review all</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
