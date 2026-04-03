"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ScarcityConfig = {
  id: number;
  name: string;
  type: "capacity" | "cycle" | "access" | "performance";
  maxSlots: number;
  currentUsage: number;
  waitlistEnabled: boolean;
  cycleDurationDays: number;
  cycleStartDate: string | null;
  personaLimit: string | null;
  offerLimit: string | null;
  leadMagnetLimit: string | null;
  funnelLimit: string | null;
  qualificationThreshold: number;
  performanceThresholdsJson: {
    conversionRateMin?: number;
    leadQualityMin?: number;
    revenueCentsMin?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ScarcityReadiness = {
  configId: number;
  name: string;
  status: "open" | "limited" | "full" | "waitlist";
  availableSlots: number;
  usedSlots: number;
  waitlistCount: number;
  nextCycleDate: string | null;
  message: string;
};

type ScarcityCampaignBlock = {
  id: number;
  name: string;
  offerSlug: string | null;
  readinessScore: number;
  reason: string;
};

type ScarcityApiPayload = {
  configs: ScarcityConfig[];
  readiness: ScarcityReadiness[];
  blockedCampaigns: ScarcityCampaignBlock[];
};

const statusBadge: Record<ScarcityReadiness["status"], string> = {
  open: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  limited: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  full: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  waitlist: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
};

export default function ScarcityEnginePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [authLoading, router, user]);

  const { data, isLoading, error } = useQuery<ScarcityApiPayload>({
    queryKey: ["/api/admin/scarcity-engine"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/scarcity-engine");
      if (!res.ok) throw new Error("Failed to load scarcity engine data");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/offer-engine">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Offer engine
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-3 mb-2">
          <AlertTriangle className="h-10 w-10 text-primary shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scarcity Engine</h1>
            <p className="text-muted-foreground mt-1 max-w-3xl">
              Real scarcity controls for capacity, cycle windows, lead qualification, and campaign pacing.
              Intake routes are computed from live CRM + funnel usage — never static timers.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="mt-6 border-rose-500/40">
            <CardHeader>
              <CardTitle className="text-lg">Failed to load scarcity data</CardTitle>
              <CardDescription>Check server logs and database connectivity.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active configs</CardTitle>
                  <CardDescription>Capacity/cycle/access/performance rules currently enabled.</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                  {data?.configs.filter((cfg) => cfg.isActive).length ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Waitlist load</CardTitle>
                  <CardDescription>Total waitlisted demand across active scarcity configs.</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                  {(data?.readiness ?? []).reduce((sum, row) => sum + row.waitlistCount, 0)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Blocked PPC campaigns</CardTitle>
                  <CardDescription>Campaigns currently blocked by capacity constraints.</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                  {data?.blockedCampaigns.length ?? 0}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Capacity Dashboard</CardTitle>
                <CardDescription>
                  Live scarcity states by config. Use these to set intake, waitlist, and funnel routing expectations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.readiness ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active scarcity configs found.</p>
                ) : (
                  data?.readiness.map((row) => (
                    <div key={row.configId} className="rounded-lg border p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">{row.name}</div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge[row.status]}`}>
                          {row.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Slots: {row.availableSlots} available / {row.usedSlots} used · Waitlist: {row.waitlistCount}
                      </div>
                      <div className="text-sm">{row.message}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Cycle Manager + Waitlist Overview</CardTitle>
                <CardDescription>
                  Next cycle windows and blocked paid campaigns that should reroute to lead magnet nurture.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.blockedCampaigns ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active campaign is currently blocked by scarcity.
                  </p>
                ) : (
                  data?.blockedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-lg border p-3">
                      <div className="font-medium">
                        {campaign.name} {campaign.offerSlug ? <span className="text-muted-foreground">({campaign.offerSlug})</span> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Readiness: {campaign.readinessScore} · {campaign.reason}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
