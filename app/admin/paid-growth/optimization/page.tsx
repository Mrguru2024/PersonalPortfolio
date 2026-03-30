"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Rec = {
  id: number;
  campaignId: number;
  ruleKey: string;
  severity: string;
  status: string;
  title: string;
  detail: string;
};

export default function PaidGrowthOptimizationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/optimization", "open"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        "/api/admin/paid-growth/optimization?statuses=open",
      );
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ recommendations: Rec[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const runMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/paid-growth/optimization/run", {});
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ rulesEvaluated: number; upserts: number }>;
    },
    onSuccess: (r) => {
      toast({ title: "Optimization sweep", description: `${r.upserts} recommendation(s) updated.` });
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/optimization"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/dashboard"] });
    },
    onError: () => toast({ title: "Sweep failed", variant: "destructive" }),
  });

  const dismissMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/paid-growth/optimization/${id}`, { status: "dismissed" });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/optimization"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/dashboard"] });
    },
    onError: () => toast({ title: "Could not update", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recs = data?.recommendations ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Rules-based optimization</h2>
          <p className="text-sm text-muted-foreground">
            Deterministic signals from snapshots + classified CRM leads. Run a sweep after new data; dismiss items your team
            has handled.
          </p>
        </div>
        <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${runMut.isPending ? "animate-spin" : ""}`} />
          Refresh recommendations
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open recommendations</CardTitle>
          <CardDescription>Scoped per campaign — links go to campaign detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ?
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          : recs.length === 0 ?
            <p className="text-sm text-muted-foreground">No open items. Run a sweep or classify more lead-quality rows.</p>
          : recs.map((r) => (
              <div
                key={r.id}
                className="border border-border/80 rounded-lg p-4 space-y-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      r.severity === "critical" ? "destructive"
                      : r.severity === "warning" ?
                        "secondary"
                      : "outline"
                    }
                  >
                    {r.severity}
                  </Badge>
                  <Link
                    href={`/admin/paid-growth/campaigns/${r.campaignId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Campaign #{r.campaignId}
                  </Link>
                  <span className="text-xs text-muted-foreground font-mono">{r.ruleKey}</span>
                </div>
                <p className="font-medium">{r.title}</p>
                <p className="text-muted-foreground">{r.detail}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dismissMut.mutate(r.id)}
                    disabled={dismissMut.isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
