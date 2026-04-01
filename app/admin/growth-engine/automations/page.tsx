"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthAutomationRule } from "@shared/schema";
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

export default function GrowthEngineAutomationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("Follow up — form abandon");
  const [trigger, setTrigger] = useState<"form_abandon" | "pricing_view" | "booking_view" | "cta_spike">("form_abandon");
  const [delay, setDelay] = useState("30");
  const [emailTo, setEmailTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/automation-rules"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/automation-rules");
      return res.json() as Promise<{ rules: GrowthAutomationRule[] }>;
    },
    enabled: !!user?.isAdmin,
  });

  const mut = useMutation({
    mutationFn: async () => {
      const d = Number(delay);
      const res = await apiRequest("POST", "/api/admin/growth-engine/automation-rules", {
        name: name.trim(),
        triggerType: trigger,
        delayMinutes: Number.isFinite(d) ? d : 0,
        actionsJson: {
          emailTo: emailTo.trim() || undefined,
          emailSubject: `[Ascendra] ${name}`,
          emailHtml: "<p>Automation fired — configure richer templates in a later iteration.</p>",
        },
      });
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/automation-rules"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/overview"] });
      toast({ title: "Rule created" });
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
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-muted-foreground mt-1">Rule queue + Brevo sends when keys are configured. Runs process via cron.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">New rule</CardTitle>
          <CardDescription>Optional email — requires BREVO_API_KEY and FROM_EMAIL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Trigger</Label>
            <Select value={trigger} onValueChange={(v) => setTrigger(v as typeof trigger)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="form_abandon">form_abandon</SelectItem>
                <SelectItem value="pricing_view">pricing_view</SelectItem>
                <SelectItem value="booking_view">booking_view</SelectItem>
                <SelectItem value="cta_spike">cta_spike</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delay (minutes)</Label>
            <Input value={delay} onChange={(e) => setDelay(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email to (optional)</Label>
            <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="ops@..." />
          </div>
          <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Create"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin" />
      : <Card>
          <CardHeader>
            <CardTitle className="text-base">Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {(data?.rules ?? []).map((r) => (
              <div key={r.id} className="border-b border-border/60 py-2">
                <span className="font-medium">{r.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {r.triggerType} · delay {r.delayMinutes}m · {r.enabled ? "on" : "off"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      }
    </div>
  );
}
