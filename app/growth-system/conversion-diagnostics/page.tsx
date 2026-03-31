"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { ClientConversionDiagnostics } from "@shared/conversionDiagnosticsTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConversionDiagnosticsClient } from "@/components/conversion-diagnostics/ConversionDiagnosticsClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAY_OPTIONS = [7, 14, 30, 90] as const;

export default function ClientConversionDiagnosticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [periodDays, setPeriodDays] = useState<number>(30);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/portal?redirect=/growth-system/conversion-diagnostics");
    }
  }, [user, authLoading, router]);

  const queryKey = useMemo(
    () => ["/api/client/conversion-diagnostics", periodDays] as const,
    [periodDays],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/client/conversion-diagnostics?days=${periodDays}`);
      return res.json() as Promise<ClientConversionDiagnostics>;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  if (isLoading && !data) {
    return (
      <div className="min-h-screen max-w-5xl mx-auto px-4 py-16 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Loading Conversion Diagnostics…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Try again shortly."}
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-emerald-500/[0.03]">
      <div className="max-w-5xl mx-auto px-4 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground" asChild>
            <Link href="/growth-system">← Growth system</Link>
          </Button>
          <Button variant="outline" size="sm" className="h-9 border-emerald-500/30" asChild>
            <Link href="/growth-system/improvements">Improvements</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <div className="flex items-center gap-2">
            <Label htmlFor="cd-period" className="text-xs text-muted-foreground whitespace-nowrap">
              Date range
            </Label>
            <Select
              value={String(periodDays)}
              onValueChange={(v) => setPeriodDays(Number(v))}
            >
              <SelectTrigger id="cd-period" className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Last {d} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFetching ?
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
          : null}
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>
      </div>
      <ConversionDiagnosticsClient data={data} />
    </div>
  );
}
