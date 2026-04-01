"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthRevenueEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function GrowthEngineRevenuePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("manual");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/revenue-events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/revenue-events");
      return res.json() as Promise<{ events: GrowthRevenueEvent[] }>;
    },
    enabled: !!user?.isAdmin,
  });

  const mut = useMutation({
    mutationFn: async () => {
      const dollars = Number(amount);
      if (!Number.isFinite(dollars) || dollars <= 0) throw new Error("Enter a positive amount (USD).");
      const res = await apiRequest("POST", "/api/admin/growth-engine/revenue-events", {
        amountCents: Math.round(dollars * 100),
        source,
        note: "Manual admin entry — extend with CRM / Stripe IDs as you wire attribution.",
      });
      return res.json();
    },
    onSuccess: () => {
      setAmount("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/revenue-events"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/overview"] });
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

  const events = data?.events ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue attribution</h1>
        <p className="text-muted-foreground mt-1">
          Log manual deals now; connect Stripe invoice IDs per row as your ops workflow matures.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Add revenue event</CardTitle>
          <CardDescription>USD · stored in cents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (USD)</Label>
            <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">manual</SelectItem>
                <SelectItem value="stripe_invoice">stripe_invoice</SelectItem>
                <SelectItem value="attributed">attributed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Save"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      : <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {events.length === 0 ?
              <p className="text-muted-foreground">No rows yet.</p>
            : events.map((e) => (
                <div key={e.id} className="flex flex-wrap justify-between gap-2 border-b border-border/60 py-2">
                  <span className="font-medium">
                    {(e.amountCents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    <span className="text-muted-foreground font-normal"> · {e.source}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(e.recordedAt).toLocaleString()} {e.crmContactId ? `· CRM #${e.crmContactId}` : ""}
                  </span>
                </div>
              ))
            }
          </CardContent>
        </Card>
      }
    </div>
  );
}
