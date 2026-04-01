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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import type {
  RevenueOpsLedgerEntry,
  RevenueOpsOperatingCostLine,
  RevenueOpsSettingsConfig,
} from "@shared/crmSchema";
import { REVENUE_OPS_DEFAULT_OPERATING_COST_LINES } from "@shared/revenueOpsDefaults";

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
  const [reportingPeriodDays, setReportingPeriodDays] = useState(30);
  const [operatingLines, setOperatingLines] = useState<RevenueOpsOperatingCostLine[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<RevenueOpsLedgerEntry[]>([]);
  const [bankDataNote, setBankDataNote] = useState("");
  const [marginTarget, setMarginTarget] = useState<string>("");

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
    const fin = data.config.finance;
    setReportingPeriodDays(fin?.reportingPeriodDays ?? 30);
    setOperatingLines(fin?.operatingCostLines ? [...fin.operatingCostLines] : []);
    setLedgerEntries(fin?.ledgerEntries ? [...fin.ledgerEntries] : []);
    setBankDataNote(fin?.bankDataNote ?? "");
    setMarginTarget(
      fin?.targetGrossMarginPercent != null && Number.isFinite(fin.targetGrossMarginPercent)
        ? String(fin.targetGrossMarginPercent)
        : "",
    );
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const marginN = marginTarget.trim() === "" ? undefined : parseFloat(marginTarget);
      const res = await apiRequest("PUT", "/api/admin/revenue-ops/settings", {
        welcomeSmsEnabled: welcomeEnabled,
        missedCallSmsEnabled: missedEnabled,
        welcomeSmsTemplate: welcomeTpl || undefined,
        missedCallSmsTemplate: missedTpl || undefined,
        defaultBookingUrl: bookingUrl || undefined,
        finance: {
          reportingPeriodDays,
          operatingCostLines: operatingLines,
          ledgerEntries,
          bankDataNote: bankDataNote.trim() || undefined,
          targetGrossMarginPercent:
            marginN != null && Number.isFinite(marginN) ? Math.min(100, Math.max(0, marginN)) : undefined,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue-ops/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue-ops/dashboard"] });
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

function LedgerQuickAdd({ onAdd }: { onAdd: (e: RevenueOpsLedgerEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<"revenue" | "cost">("cost");
  const [source, setSource] = useState<"manual" | "bank_import" | "stripe_report">("manual");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add ledger row
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-border/60 bg-muted/20 w-full sm:w-auto sm:min-w-[280px]">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount (USD)</Label>
          <Input type="number" step="0.01" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Kind</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as "revenue" | "cost")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Source</Label>
          <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="bank_import">Bank import</SelectItem>
              <SelectItem value="stripe_report">Stripe report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. AWS true-up" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            const dollars = parseFloat(amount);
            if (!label.trim() || !Number.isFinite(dollars)) return;
            onAdd({
              id: crypto.randomUUID(),
              occurredAt: new Date(occurredAt + "T12:00:00").toISOString(),
              kind,
              source,
              amountCents: Math.round(dollars * 100),
              label: label.trim(),
            });
            setAmount("");
            setLabel("");
            setOpen(false);
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
