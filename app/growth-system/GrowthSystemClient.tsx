"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { ClientGrowthSnapshot } from "@shared/clientGrowthSnapshot";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { GrowthFocusSection } from "@/components/client-growth/GrowthSnapshotView";
import { GrowthSnapshotView } from "@/components/client-growth/GrowthSnapshotView";

export interface GrowthSystemClientProps {
  readonly focusSection?: GrowthFocusSection;
  readonly redirectPath?: string;
}

export function GrowthSystemClient({
  focusSection,
  redirectPath = "/growth-system",
}: GrowthSystemClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      const q = encodeURIComponent(redirectPath);
      router.push(`/portal?redirect=${q}`);
    }
  }, [user, authLoading, router, redirectPath]);

  const {
    data: snapshot,
    isLoading,
    isError,
    error,
  } = useQuery<ClientGrowthSnapshot>({
    queryKey: ["/api/client/growth-snapshot"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/growth-snapshot");
      return (await res.json()) as ClientGrowthSnapshot;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground" asChild>
          <Link href="/dashboard">← Back to dashboard</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="w-fit shrink-0 border-emerald-500/40" asChild>
            <Link href="/growth-system/conversion-diagnostics">Conversion Diagnostics</Link>
          </Button>
          {focusSection ?
            <Button variant="outline" size="sm" className="w-fit shrink-0" asChild>
              <Link href="/growth-system">View full growth system</Link>
            </Button>
          : null}
        </div>
      </div>

      {isLoading ?
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading snapshot" />
          <p className="text-sm text-muted-foreground">Loading your growth snapshot…</p>
        </div>
      : isError ?
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error instanceof Error ? error.message : "Try again in a moment."}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Return to dashboard</Link>
            </Button>
          </AlertDescription>
        </Alert>
      : snapshot ?
        <GrowthSnapshotView snapshot={snapshot} focusSection={focusSection} />
      : null}
    </div>
  );
}
