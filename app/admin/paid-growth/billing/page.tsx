"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: number;
  ppcAdAccountId: number | null;
  clientLabel: string | null;
  billingModel: string;
  setupFeeCents: number | null;
  monthlyRetainerCents: number | null;
  laborEstimateHours: number | null;
  internalProfitabilityScore: number | null;
};

export default function PaidGrowthBillingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [clientLabel, setClientLabel] = useState("");
  const [retainer, setRetainer] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/billing-profiles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/billing-profiles");
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ profiles: Profile[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const monthlyRetainerCents = retainer.trim() ? Math.round(Number(retainer) * 100) : null;
      const res = await apiRequest("POST", "/api/admin/paid-growth/billing-profiles", {
        clientLabel: clientLabel.trim() || null,
        billingModel: "hybrid",
        monthlyRetainerCents,
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile saved" });
      setClientLabel("");
      setRetainer("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/billing-profiles"] });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profiles = data?.profiles ?? [];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Fulfillment & billing (internal)</h2>
        <p className="text-sm text-muted-foreground">
          Operational economics for Ascendra PPC delivery — not shown to end clients. Tie rows to ad accounts or client
          labels for reporting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick add profile</CardTitle>
          <CardDescription>Extend in the API or future editor for setup fees, bonuses, and fulfillment notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="clientLabel">Client label</Label>
            <Input
              id="clientLabel"
              value={clientLabel}
              onChange={(e) => setClientLabel(e.target.value)}
              placeholder="Matches campaign client label"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retainer">Monthly retainer (USD)</Label>
            <Input
              id="retainer"
              inputMode="decimal"
              value={retainer}
              onChange={(e) => setRetainer(e.target.value)}
              placeholder="e.g. 3500"
            />
          </div>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? "Saving…" : "Create profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profiles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : profiles.length === 0 ?
            <p className="text-muted-foreground">No billing profiles yet.</p>
          : profiles.map((p) => (
              <div key={p.id} className="border border-border/70 rounded-md p-3 flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{p.clientLabel ?? `Profile #${p.id}`}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.billingModel}
                    {p.monthlyRetainerCents != null ?
                      ` · $${(p.monthlyRetainerCents / 100).toFixed(0)}/mo`
                    : ""}
                  </p>
                </div>
                {p.internalProfitabilityScore != null ?
                  <span className="text-xs text-muted-foreground">Score {p.internalProfitabilityScore}</span>
                : null}
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
