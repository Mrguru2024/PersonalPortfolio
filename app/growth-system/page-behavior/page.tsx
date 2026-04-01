"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { ClientPageBehaviorDetail } from "@shared/clientGrowthCapabilities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientPageBehaviorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = searchParams.get("path")?.trim() ?? "";
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") ?? "30") || 30));

  useEffect(() => {
    if (!authLoading && !user) {
      const q = encodeURIComponent(`/growth-system/page-behavior?path=${encodeURIComponent(path)}&days=${days}`);
      router.push(`/portal?redirect=${q}`);
    }
  }, [user, authLoading, router, path, days]);

  const queryKey = useMemo(() => ["/api/client/page-behavior", path, days] as const, [path, days]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/client/page-behavior?path=${encodeURIComponent(path)}&days=${days}`,
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<ClientPageBehaviorDetail>;
    },
    enabled: !!user && path.startsWith("/"),
  });

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  if (!path.startsWith("/")) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-16">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Page path required</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Open this view from Conversion Diagnostics heatmap highlights or add a path such as <code>/pricing</code>.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/growth-system/conversion-diagnostics">Back to Conversion Diagnostics</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Loading page summary…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error instanceof Error ? error.message : "Try again shortly."}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/growth-system/conversion-diagnostics">Back</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-emerald-500/[0.03]">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-16 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground" asChild>
            <Link href="/growth-system/conversion-diagnostics">
              <ArrowLeft className="h-4 w-4 mr-1 inline" aria-hidden />
              Conversion Diagnostics
            </Link>
          </Button>
        </div>

        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Page behavior</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono break-all">{data.path}</h1>
          <p className="text-sm text-muted-foreground">
            Last {data.periodDays} days · Updated{" "}
            <time dateTime={data.lastUpdatedIso}>
              {new Date(data.lastUpdatedIso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </time>
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Linked sessions (window)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{data.linkedSessionsInWindow}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sessions on this page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{data.sessionsTouchingPage}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Logged interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{data.behaviorEventsOnPage.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Heatmap click points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{data.heatmapClicksOnPage.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Aggregated — not a live overlay</p>
            </CardContent>
          </Card>
        </div>

        {data.hasFrictionFlag ?
          <Alert className="border-amber-500/40 bg-amber-500/5">
            <AlertTitle className="text-amber-800 dark:text-amber-200">Friction flagged</AlertTitle>
            <AlertDescription>
              {data.frictionSummary ??
                "Ascendra has logged friction signals for this path — ask your strategist for the remediation plan."}
            </AlertDescription>
          </Alert>
        : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What this means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {data.narratives.map((n) => (
              <p key={n}>• {n}</p>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Full heatmap overlays and session replay remain in Ascendra Growth Intelligence for your operators. This page is a
          client-safe summary only.
        </p>
      </div>
    </div>
  );
}
