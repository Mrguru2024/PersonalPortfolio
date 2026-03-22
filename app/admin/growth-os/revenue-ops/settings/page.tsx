"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import type { RevenueOpsSettingsConfig } from "@shared/crmSchema";

interface SettingsRow {
  id: number;
  config: RevenueOpsSettingsConfig;
  updatedAt: string;
}

export default function RevenueOpsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [missedEnabled, setMissedEnabled] = useState(false);
  const [welcomeTpl, setWelcomeTpl] = useState("");
  const [missedTpl, setMissedTpl] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");

  const { data, isLoading } = useQuery<SettingsRow>({
    queryKey: ["/api/admin/revenue-ops/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/revenue-ops/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (!data?.config) return;
    setWelcomeEnabled(!!data.config.welcomeSmsEnabled);
    setMissedEnabled(!!data.config.missedCallSmsEnabled);
    setWelcomeTpl(data.config.welcomeSmsTemplate ?? "");
    setMissedTpl(data.config.missedCallSmsTemplate ?? "");
    setBookingUrl(data.config.defaultBookingUrl ?? "");
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/revenue-ops/settings", {
        welcomeSmsEnabled: welcomeEnabled,
        missedCallSmsEnabled: missedEnabled,
        welcomeSmsTemplate: welcomeTpl || undefined,
        missedCallSmsTemplate: missedTpl || undefined,
        defaultBookingUrl: bookingUrl || undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue-ops/settings"] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/admin/growth-os/revenue-ops">
          <ArrowLeft className="h-4 w-4" />
          Back to Revenue ops
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue ops settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Templates support {"{{first_name}}"}, {"{{name}}"}, and {"{{booking_link}}"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default booking URL</CardTitle>
          <CardDescription>Calendly, TidyCal, or any scheduler link used in SMS templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="bookingUrl">URL</Label>
          <Input
            id="bookingUrl"
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
            placeholder="https://calendly.com/..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>New lead welcome SMS</CardTitle>
              <CardDescription>When a CRM lead is created (admin or form intake)</CardDescription>
            </div>
            <Switch checked={welcomeEnabled} onCheckedChange={setWelcomeEnabled} />
          </div>
        </CardHeader>
        <CardContent>
          <Label htmlFor="welcomeTpl">Message</Label>
          <Textarea
            id="welcomeTpl"
            className="mt-2 min-h-[100px] font-mono text-sm"
            value={welcomeTpl}
            onChange={(e) => setWelcomeTpl(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Missed call SMS</CardTitle>
              <CardDescription>After Twilio reports no-answer / busy / failed on inbound</CardDescription>
            </div>
            <Switch checked={missedEnabled} onCheckedChange={setMissedEnabled} />
          </div>
        </CardHeader>
        <CardContent>
          <Label htmlFor="missedTpl">Message</Label>
          <Textarea
            id="missedTpl"
            className="mt-2 min-h-[100px] font-mono text-sm"
            value={missedTpl}
            onChange={(e) => setMissedTpl(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
      </Button>
    </div>
  );
}
