"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BehaviorHeatmapViewer,
  type HeatmapPointRow,
} from "@/components/admin/behavior-intelligence/BehaviorHeatmapViewer";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PageSummary = { page: string; count: number };

export default function BehaviorHeatmapsPage() {
  const [days, setDays] = useState(7);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/heatmap", "summary", days],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/heatmap?days=${days}&limit=80`,
      );
      const j = (await res.json()) as { pages: PageSummary[] };
      return j.pages ?? [];
    },
  });

  const pointsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/heatmap", "points", selectedPage, days],
    queryFn: async () => {
      if (!selectedPage) return { points: [] as HeatmapPointRow[] };
      const q = new URLSearchParams({ page: selectedPage, days: String(days), limit: "8000" });
      const res = await apiRequest("GET", `/api/admin/behavior-intelligence/heatmap?${q}`);
      const j = (await res.json()) as { points: HeatmapPointRow[] };
      return j;
    },
    enabled: !!selectedPage,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Heatmaps</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Pages (click volume)</CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="bi-hm-days">Days</Label>
              <Input
                id="bi-hm-days"
                type="number"
                min={1}
                max={90}
                className="w-24"
                value={days}
                onChange={(e) => setDays(Math.min(90, Math.max(1, Number(e.target.value) || 7)))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaryQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(summaryQuery.data?.length) ?
            <div className="text-sm text-muted-foreground space-y-2">
              <p>No click points ingested yet. Tracking is controlled globally:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Set <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_ASCENDRA_BEHAVIOR_TRACKING=1</code> for
                  production (dev enables it by default unless set to <code className="text-xs bg-muted px-1 rounded">0</code>
                  ). See <code className="text-xs bg-muted px-1 rounded">app/lib/behaviorTrackingConfig.ts</code>.
                </li>
                <li>
                  If ingest uses a Bearer token, set <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_BEHAVIOR_INGEST_TOKEN</code>{" "}
                  to match <code className="text-xs bg-muted px-1 rounded">BEHAVIOR_INGEST_PUBLIC_TOKEN</code> (see{" "}
                  <code className="text-xs bg-muted px-1 rounded">.env.example</code>).
                </li>
                <li>
                  With{" "}
                  <Link className="underline text-foreground" href="/admin/behavior-intelligence/watch">
                    watch targets
                  </Link>{" "}
                  enabled, only matching paths record heatmaps—add a target for your URL or clear targets to record site-wide (
                  <code className="text-xs bg-muted px-1 rounded">legacy_all</code> mode).
                </li>
              </ul>
            </div>
          : <ul className="space-y-1 text-sm">
              {summaryQuery.data.map((p) => (
                <li key={p.page}>
                  <button
                    type="button"
                    className={`text-left w-full rounded px-2 py-1 hover:bg-muted ${selectedPage === p.page ? "bg-muted font-medium" : ""}`}
                    onClick={() => setSelectedPage(p.page)}
                  >
                    <span className="font-mono text-xs break-all">{p.page}</span>
                    <span className="text-muted-foreground ml-2">({p.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>

      {selectedPage ?
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-mono text-xs break-all">{selectedPage}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pointsQuery.isLoading ?
              <Loader2 className="h-6 w-6 animate-spin" />
            : <BehaviorHeatmapViewer interactive points={pointsQuery.data?.points ?? []} />}
            <p className="text-xs text-muted-foreground">
              Interactive view: adjust heat intensity and inspect clusters. Points use{" "}
              <code className="bg-muted px-0.5 rounded">clientX/Y</code> relative to the recorded viewport.
            </p>
          </CardContent>
        </Card>
      : null}
    </div>
  );
}
