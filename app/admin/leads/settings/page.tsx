"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadControlRoutingRule } from "@shared/leadControlOrgSettingsTypes";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";

type RuleRow = {
  id: string;
  enabled: boolean;
  label: string;
  hint: string;
  intentCsv: string;
  statusCsv: string;
  lifecycleCsv: string;
  minScore: string;
  maxScore: string;
  booked: "any" | "yes" | "no";
  tagsCsv: string;
  sourceCsv: string;
};

function csvToArray(s: string): string[] {
  return s
    .split(/[,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function ruleToRow(r: LeadControlRoutingRule): RuleRow {
  const c = r.if ?? {};
  const hasBooked =
    c.hasBookedCall === true ? "yes" : c.hasBookedCall === false ? "no" : "any";
  return {
    id: r.id,
    enabled: r.enabled,
    label: r.label ?? "",
    hint: r.hint,
    intentCsv: (c.intentIncludes ?? []).join(", "),
    statusCsv: (c.statusIn ?? []).join(", "),
    lifecycleCsv: (c.lifecycleStageIn ?? []).join(", "),
    minScore: c.minLeadScore != null ? String(c.minLeadScore) : "",
    maxScore: c.maxLeadScore != null ? String(c.maxLeadScore) : "",
    booked: hasBooked,
    tagsCsv: (c.tagIncludes ?? []).join(", "),
    sourceCsv: (c.sourceIncludes ?? []).join(", "),
  };
}

function rowToRule(row: RuleRow): LeadControlRoutingRule {
  const intentIncludes = csvToArray(row.intentCsv);
  const statusIn = csvToArray(row.statusCsv);
  const lifecycleStageIn = csvToArray(row.lifecycleCsv);
  const tagIncludes = csvToArray(row.tagsCsv);
  const sourceIncludes = csvToArray(row.sourceCsv);
  const minV = row.minScore.trim();
  const maxV = row.maxScore.trim();
  const minLeadScore = minV !== "" && Number.isFinite(Number(minV)) ? Number(minV) : undefined;
  const maxLeadScore = maxV !== "" && Number.isFinite(Number(maxV)) ? Number(maxV) : undefined;
  const hasBookedCall = row.booked === "yes" ? true : row.booked === "no" ? false : undefined;

  const ifCond: LeadControlRoutingRule["if"] = {};
  if (intentIncludes.length) ifCond.intentIncludes = intentIncludes;
  if (statusIn.length) ifCond.statusIn = statusIn;
  if (lifecycleStageIn.length) ifCond.lifecycleStageIn = lifecycleStageIn;
  if (minLeadScore != null) ifCond.minLeadScore = minLeadScore;
  if (maxLeadScore != null) ifCond.maxLeadScore = maxLeadScore;
  if (hasBookedCall !== undefined) ifCond.hasBookedCall = hasBookedCall;
  if (tagIncludes.length) ifCond.tagIncludes = tagIncludes;
  if (sourceIncludes.length) ifCond.sourceIncludes = sourceIncludes;

  return {
    id: row.id,
    enabled: row.enabled,
    label: row.label.trim() || undefined,
    hint: row.hint.trim(),
    if: ifCond,
  };
}

function newRow(): RuleRow {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r-${Date.now()}`,
    enabled: true,
    label: "",
    hint: "qualify_first",
    intentCsv: "",
    statusCsv: "",
    lifecycleCsv: "",
    minScore: "",
    maxScore: "",
    booked: "any",
    tagsCsv: "",
    sourceCsv: "",
  };
}

export default function LeadControlSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/lead-control/routing-rules"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/lead-control/routing-rules");
      return res.json() as Promise<{ routingRules: LeadControlRoutingRule[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const [rows, setRows] = useState<RuleRow[]>([]);

  useEffect(() => {
    if (data?.routingRules) {
      setRows(data.routingRules.length ? data.routingRules.map(ruleToRow) : []);
    }
  }, [data?.routingRules]);

  const dirty = useMemo(() => {
    if (!data?.routingRules) return false;
    const fromServer = JSON.stringify(data.routingRules);
    const fromForm = JSON.stringify(rows.map(rowToRule));
    return fromServer !== fromForm;
  }, [data?.routingRules, rows]);

  const save = useMutation({
    mutationFn: async () => {
      const rules = rows.map(rowToRule);
      await apiRequest("PUT", "/api/admin/lead-control/routing-rules", { routingRules: rules });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-control/routing-rules"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-control/summary"] });
      toast({ title: "Routing rules saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const recomputeHints = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/lead-control/recompute", {
        updatePriority: false,
        updateRoutingHint: true,
      });
      return res.json() as Promise<{ updated: number; scanned: number }>;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-control/summary"] });
      toast({ title: `Updated hints on ${r.updated} / ${r.scanned} leads` });
    },
    onError: () => toast({ title: "Recompute failed", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin/leads" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Lead command center
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Lead Control — routing rules
            <AdminHelpTip
              content="Rules run **top to bottom**; the first match sets `lead_routing_hint` on the **CRM contact** (no extra tables). Use an enabled rule with **no conditions** last as a default. After saving, run **Apply hints to leads** or use command center **Recompute**."
              ariaLabel="Help: routing rules"
            />
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Configured hints sync to <code className="text-xs">crm_contacts.lead_routing_hint</code> for ops and
            reporting — still one canonical CRM lead record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/crm">CRM</Link>
          </Button>
          <Button
            variant="secondary"
            disabled={recomputeHints.isPending}
            onClick={() => recomputeHints.mutate()}
            className="gap-1"
          >
            {recomputeHints.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Apply hints to leads
          </Button>
          <Button disabled={!dirty || save.isPending || rows.some((r) => !r.hint.trim())} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save rules
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rules (ordered)</CardTitle>
            <CardDescription>
              Match conditions use <strong>AND</strong> within a rule. Example hints:{" "}
              <code className="text-xs">book_call</code>, <code className="text-xs">qualify_first</code>,{" "}
              <code className="text-xs">nurture_only</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rules yet. Add one or leave empty — hints stay manual until rules match.</p>
            ) : null}
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="rounded-lg border border-border bg-card/50 p-4 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(v) => {
                        const next = [...rows];
                        next[idx] = { ...row, enabled: v };
                        setRows(next);
                      }}
                    />
                    <span className="text-sm font-medium">Rule {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={idx === 0}
                      onClick={() => {
                        const next = [...rows];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        setRows(next);
                      }}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={idx === rows.length - 1}
                      onClick={() => {
                        const next = [...rows];
                        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                        setRows(next);
                      }}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                      aria-label="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Label (optional)</Label>
                    <Input
                      value={row.label}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, label: e.target.value };
                        setRows(next);
                      }}
                      placeholder="e.g. Hot + new → book"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Routing hint (stored on contact)</Label>
                    <Input
                      value={row.hint}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, hint: e.target.value };
                        setRows(next);
                      }}
                      placeholder="book_call"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Intent contains (comma-separated)</Label>
                    <Input
                      value={row.intentCsv}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, intentCsv: e.target.value };
                        setRows(next);
                      }}
                      placeholder="hot, high_intent"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status in (exact, comma-separated)</Label>
                    <Input
                      value={row.statusCsv}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, statusCsv: e.target.value };
                        setRows(next);
                      }}
                      placeholder="new, contacted"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lifecycle stage (exact, comma-separated)</Label>
                    <Input
                      value={row.lifecycleCsv}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, lifecycleCsv: e.target.value };
                        setRows(next);
                      }}
                      placeholder="sales_ready, qualified"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Booked call</Label>
                    <Select
                      value={row.booked}
                      onValueChange={(v: "any" | "yes" | "no") => {
                        const next = [...rows];
                        next[idx] = { ...row, booked: v };
                        setRows(next);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="yes">Must have booked call</SelectItem>
                        <SelectItem value="no">Must not have booked call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min lead score</Label>
                    <Input
                      value={row.minScore}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, minScore: e.target.value };
                        setRows(next);
                      }}
                      inputMode="numeric"
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max lead score</Label>
                    <Input
                      value={row.maxScore}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, maxScore: e.target.value };
                        setRows(next);
                      }}
                      inputMode="numeric"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Tags contain (comma-separated substrings)</Label>
                    <Input
                      value={row.tagsCsv}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, tagsCsv: e.target.value };
                        setRows(next);
                      }}
                      placeholder="enterprise, webinar"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Source contains (comma-separated)</Label>
                    <Input
                      value={row.sourceCsv}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...row, sourceCsv: e.target.value };
                        setRows(next);
                      }}
                      placeholder="google, referral"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="gap-1" onClick={() => setRows([...rows, newRow()])}>
              <Plus className="h-4 w-4" />
              Add rule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
