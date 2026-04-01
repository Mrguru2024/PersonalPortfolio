"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthCampaignCost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function GrowthEngineRoiPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [label, setLabel] = useState("Google Ads");
  const [channel, setChannel] = useState("paid_search");
  const [amount, setAmount] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/campaign-costs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/campaign-costs");
      return res.json() as Promise<{ costs: GrowthCampaignCost[] }>;
    },
    enabled: !!user?.isAdmin,
  });

  const mut = useMutation({
    mutationFn: async () => {
      const dollars = Number(amount);
      if (!Number.isFinite(dollars) || dollars <= 0) throw new Error("Enter spend (USD).");
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      const res = await apiRequest("POST", "/api/admin/growth-engine/campaign-costs", {
        label: label.trim(),
        channel: channel.trim(),
        amountCents: Math.round(dollars * 100),
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        note: "Manual period — refine with exact invoice months as needed.",
      });
      return res.json();
    },
    onSuccess: () => {
      setAmount("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/campaign-costs"] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ROI &amp; campaign costs</h1>
        <p className="text-muted-foreground mt-1">Feeds client Conversion Diagnostics ROI hints vs attributed revenue.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Log spend (this month UTC)</CardTitle>
          <CardDescription>Google Ads and other channels until API connectors land.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Channel key</Label>
            <Input value={channel} onChange={(e) => setChannel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount USD</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Save"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin" />
      : <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent cost rows</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {(data?.costs ?? []).map((c) => (
              <div key={c.id} className="flex justify-between border-b border-border/60 py-2">
                <span>{c.label}</span>
                <span className="text-muted-foreground">
                  {(c.amountCents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })} · {c.channel}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      }
    </div>
  );
}
