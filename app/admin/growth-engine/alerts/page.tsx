"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthLeadSignal } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GrowthEngineAlertsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/lead-signals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/lead-signals");
      return res.json() as Promise<{ signals: GrowthLeadSignal[] }>;
    },
    enabled: !!user?.isAdmin,
  });

  const patch = useMutation({
    mutationFn: async (p: { id: number; dismiss?: boolean }) => {
      await apiRequest("PATCH", `/api/admin/growth-engine/lead-signals/${p.id}`, {
        dismiss: p.dismiss === true,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/lead-signals"] }),
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  const signals = data?.signals ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live lead signals</h1>
        <p className="text-muted-foreground mt-1">Generated from behavior ingest — pricing, booking, form abandon, CTA spikes.</p>
      </div>
      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin" />
      : signals.length === 0 ?
        <p className="text-sm text-muted-foreground">No signals yet. Traffic with matching events will appear here.</p>
      : <div className="space-y-3">
          {signals.map((s) => (
            <Card key={s.id} className={s.readAt ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant="outline">{s.signalType}</Badge>
                  <Badge variant="secondary">{s.severity}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {s.body ? <p>{s.body}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => patch.mutate({ id: s.id })}>
                    Mark read
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => patch.mutate({ id: s.id, dismiss: true })}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
