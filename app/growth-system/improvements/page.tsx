"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardList, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { ClientGrowthCapabilities, ClientInsightTaskView } from "@shared/clientGrowthCapabilities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientImprovementsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/portal?redirect=/growth-system/improvements");
    }
  }, [user, authLoading, router]);

  const { data: caps, isLoading: capsLoading } = useQuery({
    queryKey: ["/api/client/growth-capabilities"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/growth-capabilities");
      const j = (await res.json()) as ClientGrowthCapabilities & { error?: string; reason?: string };
      if (res.status === 401) throw new Error("Sign in required");
      if (!res.ok && res.status !== 403) throw new Error(j.error ?? "Failed to load capabilities");
      return j;
    },
    enabled: !!user,
  });

  const tasksEnabled =
    !!caps?.eligible && caps.modules.sharedImprovements && caps.crm.accountIds.length > 0;

  const { data: taskPack, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/client/growth-insight-tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/growth-insight-tasks");
      return res.json() as Promise<{ tasks: ClientInsightTaskView[]; moduleDisabled?: boolean }>;
    },
    enabled: !!user && tasksEnabled,
  });

  if (authLoading || capsLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  if (!caps?.eligible) {
    return (
      <div className="min-h-screen max-w-lg mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not available</AlertTitle>
          <AlertDescription>
            Your workspace does not include the client growth portal yet.
            <Button className="mt-3" variant="outline" size="sm" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const tasks = taskPack?.tasks ?? [];
  const showModuleGate = !caps.modules.sharedImprovements;

  return (
    <div className="min-h-screen w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Shared with you</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-emerald-600 shrink-0" aria-hidden />
            Improvements
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Recommendations and work Ascendra has queued for your site. This is not your full internal task board — only
            items explicitly shared with your business account.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/growth-system">Growth system</Link>
        </Button>
      </div>

      {showModuleGate ?
        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Connect your CRM account</CardTitle>
            <CardDescription>
              Shared improvements require a CRM company link on your profile. Your Ascendra contact can attach your login to
              the right account so tasks appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      : tasksLoading ?
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading shared items…
        </div>
      : tasks.length === 0 ?
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
            <p>No shared improvements yet. When your strategist publishes items to your portal, they will show here.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/growth-system/conversion-diagnostics">View Conversion Diagnostics</Link>
            </Button>
          </CardContent>
        </Card>
      : <ul className="space-y-4">
          {tasks.map((t) => (
            <li key={t.id}>
              <Card className="shadow-sm border-border/80">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{t.title}</CardTitle>
                    <Badge variant="secondary" className="capitalize">
                      {t.statusLabel}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {t.priority}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Updated{" "}
                    <time dateTime={t.updatedAt}>
                      {new Date(t.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {t.body ?
                    <p className="whitespace-pre-wrap">{t.body}</p>
                  : null}
                  <div className="flex flex-wrap gap-2">
                    {t.pagePath ?
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/growth-system/page-behavior?path=${encodeURIComponent(t.pagePath)}&days=30`}
                        >
                          Page: {t.pagePath}
                        </Link>
                      </Button>
                    : null}
                    {t.heatmapPage && t.heatmapPage !== t.pagePath ?
                      <Button variant="ghost" size="sm" className="text-xs" asChild>
                        <Link
                          href={`/growth-system/page-behavior?path=${encodeURIComponent(t.heatmapPage)}&days=30`}
                        >
                          Heatmap path
                        </Link>
                      </Button>
                    : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      }

      <p className="text-xs text-muted-foreground border-t pt-6">
        Permissions:{" "}
        {caps.permissions["growth.shared_improvements"] ?
          <span>shared improvements enabled</span>
        : <span>restricted</span>}
        . Operators manage tasks in Ascendra Growth Intelligence.
      </p>
    </div>
  );
}
