"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FrictionRow = {
  id: number;
  page: string;
  summary: string | null;
  rageClicks: number | null;
  deadClicks: number | null;
  dropOffRate: number | null;
  createdAt: string;
};

export default function BehaviorFrictionReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/friction"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/friction?limit=50");
      return res.json() as Promise<FrictionRow[]>;
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Friction reports</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest aggregates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(data?.length) ?
            <p className="text-sm text-muted-foreground">No rows yet.</p>
          : data.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Rage {r.rageClicks ?? 0}</Badge>
                  <Badge variant="outline">Dead {r.deadClicks ?? 0}</Badge>
                  {r.dropOffRate != null ?
                    <Badge variant="destructive">Drop-off ~{Math.round(r.dropOffRate * 100)}%</Badge>
                  : null}
                </div>
                <p className="font-mono text-xs break-all">{r.page}</p>
                <p className="text-muted-foreground">{r.summary}</p>
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
