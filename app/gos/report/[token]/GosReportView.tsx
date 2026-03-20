"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiOk {
  ok: true;
  resourceType: string;
  resourceId: string;
  summary: Record<string, unknown>;
  expiresAt: string | null;
}

export function GosReportView({ token }: { token: string }) {
  const [data, setData] = useState<ApiOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/public/gos/report/${encodeURIComponent(token)}`, {
          method: "GET",
        });
        const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) {
          if (!cancelled) setError(String(json.error ?? res.statusText));
          return;
        }
        if (!cancelled) {
          setData({
            ok: true,
            resourceType: String(json.resourceType ?? ""),
            resourceId: String(json.resourceId ?? ""),
            summary: (json.summary as Record<string, unknown>) ?? {},
            expiresAt: json.expiresAt != null ? String(json.expiresAt) : null,
          });
        }
      } catch {
        if (!cancelled) setError("Could not load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  const payload = data.summary?.payload as Record<string, unknown> | undefined;
  const display = payload ?? data.summary;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <FileText className="h-4 w-4" aria-hidden />
          <span>Shared report</span>
          {data.expiresAt ? (
            <span className="text-xs">· Expires {new Date(data.expiresAt).toLocaleString()}</span>
          ) : null}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {(display.headline as string) ||
                (display.title as string) ||
                `${data.resourceType} · ${data.resourceId}`}
            </CardTitle>
            <CardDescription>
              Client-safe summary only — no internal scoring or research details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {"topActions" in display && Array.isArray(display.topActions) ? (
              <div>
                <h3 className="text-sm font-semibold mb-2">Top actions</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {(display.topActions as string[]).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {"categories" in display && Array.isArray(display.categories) ? (
              <div>
                <h3 className="text-sm font-semibold mb-2">Categories</h3>
                <ul className="space-y-2 text-sm">
                  {(display.categories as Array<{ label?: string; score?: number; headline?: string }>).map(
                    (c, i) => (
                      <li key={i} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                        <span>{c.label ?? c.headline}</span>
                        {c.score != null ? <span className="tabular-nums">{c.score}</span> : null}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
            {"entries" in display && Array.isArray(display.entries) ? (
              <div>
                <h3 className="text-sm font-semibold mb-2">Schedule</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(display.entries as Array<{ title?: string; scheduledAt?: string }>).map((e, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">{e.title}</span>
                      {e.scheduledAt ? ` · ${new Date(e.scheduledAt).toLocaleString()}` : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Technical details</summary>
              <pre className="mt-2 p-3 rounded-md bg-muted/40 overflow-auto max-h-64">
                {JSON.stringify(display, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
