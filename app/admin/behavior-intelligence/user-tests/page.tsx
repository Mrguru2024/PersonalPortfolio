"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download, Loader2, Wrench } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BehaviorVisitorHubResponse } from "@server/services/behavior/behaviorIngestService";
import { visitorAliasFromSessionId } from "@/lib/behaviorVisitorAlias";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AdminDevOnly } from "@/components/admin/AdminDevOnly";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const NONE_VISIT = "__none__";

const VISIT_WINDOWS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
] as const;

const OBS_LIMITS = [50, 100, 200] as const;

function visitSummaryLine(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

type Campaign = {
  id: number;
  name: string;
  hypothesis: string | null;
  active: boolean;
  businessId: string | null;
  createdAt: string;
};

type Observation = {
  id: number;
  campaignId: number;
  sessionId: string | null;
  crmContactId: number | null;
  notes: string;
  createdAt: string;
};

function exportObservationsCsv(campaign: Campaign, rows: Observation[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const head = ["observation_id", "created_at", "notes", "visitor_label", "session_id", "crm_contact_id"];
  const lines = [
    head.join(","),
    ...rows.map((o) =>
      [
        o.id,
        o.createdAt,
        esc(o.notes),
        o.sessionId ? esc(visitorAliasFromSessionId(o.sessionId)) : "",
        o.sessionId ?? "",
        o.crmContactId ?? "",
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `user-test-${campaign.id}-observations.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function BehaviorUserTestsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [newBusinessId, setNewBusinessId] = useState("");
  const [newAdvOpen, setNewAdvOpen] = useState(false);

  const [visitDays, setVisitDays] = useState("14");
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [visitFromList, setVisitFromList] = useState<string>(NONE_VISIT);
  const [visitManualRef, setVisitManualRef] = useState("");
  const [obsNotes, setObsNotes] = useState("");
  const [obsCrmContactId, setObsCrmContactId] = useState("");
  const [supportVisitOpen, setSupportVisitOpen] = useState(false);
  const [obsSearch, setObsSearch] = useState("");
  const [obsLimit, setObsLimit] = useState<number>(100);
  const [campaignAdvOpen, setCampaignAdvOpen] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftHypothesis, setDraftHypothesis] = useState("");
  const [draftActive, setDraftActive] = useState(true);
  const [draftBusinessId, setDraftBusinessId] = useState("");

  const resolvedVisitKey = visitManualRef.trim() || (visitFromList !== NONE_VISIT ? visitFromList : "");

  const recentVisitsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/sessions", "hub", "user-tests-pick", visitDays],
    queryFn: async () => {
      const params = new URLSearchParams({
        hub: "1",
        days: visitDays,
        limit: "50",
        offset: "0",
      });
      const res = await apiRequest("GET", `/api/admin/behavior-intelligence/sessions?${params}`);
      return res.json() as Promise<BehaviorVisitorHubResponse>;
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/user-tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/user-tests");
      return res.json() as Promise<Campaign[]>;
    },
  });

  const selectedCampaign = useMemo(
    () => campaignsQuery.data?.find((c) => c.id === selectedCampaignId),
    [campaignsQuery.data, selectedCampaignId],
  );

  useEffect(() => {
    if (!selectedCampaign) return;
    setDraftName(selectedCampaign.name);
    setDraftHypothesis(selectedCampaign.hypothesis ?? "");
    setDraftActive(selectedCampaign.active);
    setDraftBusinessId(selectedCampaign.businessId ?? "");
  }, [selectedCampaign]);

  const observationsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/user-tests/observations", selectedCampaignId, obsLimit],
    queryFn: async () => {
      if (selectedCampaignId == null) return [];
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/user-tests/observations?campaignId=${selectedCampaignId}&limit=${obsLimit}`,
      );
      return res.json() as Promise<Observation[]>;
    },
    enabled: selectedCampaignId != null,
  });

  const createCampaignMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/behavior-intelligence/user-tests", {
        name,
        hypothesis: hypothesis.trim() || null,
        active: newActive,
        businessId: newBusinessId.trim() || null,
      });
      return (await res.json()) as Campaign;
    },
    onSuccess: (row) => {
      setName("");
      setHypothesis("");
      setNewBusinessId("");
      setNewActive(true);
      toast({ title: "Campaign created", description: row.name });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/user-tests"] });
      setSelectedCampaignId(row.id);
    },
    onError: (e: Error) => toast({ title: "Could not create", description: e.message, variant: "destructive" }),
  });

  const patchCampaignMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (selectedCampaignId == null) throw new Error("no campaign");
      const res = await apiRequest(
        "PATCH",
        `/api/admin/behavior-intelligence/user-tests/${selectedCampaignId}`,
        body,
      );
      return (await res.json()) as Campaign;
    },
    onSuccess: () => {
      toast({ title: "Campaign updated" });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/user-tests"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const saveCampaignSettings = useCallback(() => {
    patchCampaignMut.mutate({
      name: draftName.trim(),
      hypothesis: draftHypothesis.trim() || null,
      active: draftActive,
      businessId: draftBusinessId.trim() || null,
    });
  }, [draftActive, draftBusinessId, draftHypothesis, draftName, patchCampaignMut]);

  const addObsMut = useMutation({
    mutationFn: async () => {
      if (selectedCampaignId == null) throw new Error("campaign");
      const crmRaw = obsCrmContactId.trim();
      let crmContactId: number | null = null;
      if (crmRaw) {
        const n = Number.parseInt(crmRaw, 10);
        if (!Number.isFinite(n)) throw new Error("CRM contact id must be a number");
        crmContactId = n;
      }
      await apiRequest("POST", "/api/admin/behavior-intelligence/user-tests/observations", {
        campaignId: selectedCampaignId,
        sessionId: resolvedVisitKey.length >= 8 ? resolvedVisitKey : null,
        notes: obsNotes,
        crmContactId: crmContactId ?? null,
      });
    },
    onSuccess: () => {
      setObsNotes("");
      setObsCrmContactId("");
      setVisitManualRef("");
      setVisitFromList(NONE_VISIT);
      void qc.invalidateQueries({
        queryKey: ["/api/admin/behavior-intelligence/user-tests/observations", selectedCampaignId],
      });
      toast({ title: "Observation saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const filteredObservations = useMemo(() => {
    const rows = observationsQuery.data ?? [];
    const q = obsSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((o) => {
      if (o.notes.toLowerCase().includes(q)) return true;
      if (o.sessionId && visitorAliasFromSessionId(o.sessionId).toLowerCase().includes(q)) return true;
      if (o.sessionId?.toLowerCase().includes(q)) return true;
      if (o.crmContactId != null && String(o.crmContactId).includes(q)) return true;
      return false;
    });
  }, [observationsQuery.data, obsSearch]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">User testing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run lightweight qualitative studies: campaigns with hypotheses, session-linked notes, and exports.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New campaign</CardTitle>
          <CardDescription>Group observations for a flow, page, or device class.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-w-2xl">
          <div className="space-y-1">
            <Label htmlFor="bi-ut-name">Name</Label>
            <Input id="bi-ut-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Booking funnel — mobile" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bi-ut-hyp">Hypothesis (optional)</Label>
            <Textarea
              id="bi-ut-hyp"
              rows={2}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Users abandon because the CTA is below the fold on small screens."
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="new-ut-active" checked={newActive} onCheckedChange={setNewActive} />
            <Label htmlFor="new-ut-active" className="text-sm font-normal cursor-pointer">
              Active
            </Label>
          </div>

          <Collapsible open={newAdvOpen} onOpenChange={setNewAdvOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="gap-2">
                {newAdvOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Wrench className="h-4 w-4" />
                Advanced tools
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-1">
                <Label htmlFor="new-ut-biz">Workspace / business id (optional)</Label>
                <Input
                  id="new-ut-biz"
                  value={newBusinessId}
                  onChange={(e) => setNewBusinessId(e.target.value)}
                  placeholder="Multi-tenant routing — leave blank for default"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Paused campaigns stay in the list for history; select one to resume or edit anytime.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Button type="button" disabled={!name.trim() || createCampaignMut.isPending} onClick={() => createCampaignMut.mutate()}>
            {createCampaignMut.isPending ? "Saving…" : "Create campaign"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaigns &amp; observations</CardTitle>
          <CardDescription>Select a campaign to log notes, optionally tie a CRM contact, filter the log, or export.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaignsQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(campaignsQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          : <ul className="space-y-2">
              {campaignsQuery.data.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded-lg border p-3 text-sm hover:bg-muted/60 transition-colors ${selectedCampaignId === c.id ? "ring-2 ring-primary bg-muted/20" : ""}`}
                    onClick={() => setSelectedCampaignId(c.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.active ?
                        <span className="text-[10px] uppercase text-green-600 dark:text-green-400">active</span>
                      : <span className="text-[10px] uppercase text-muted-foreground">paused</span>}
                    </div>
                    {c.hypothesis ?
                      <p className="text-muted-foreground text-xs mt-1">{c.hypothesis}</p>
                    : null}
                  </button>
                </li>
              ))}
            </ul>
          }

          {selectedCampaignId != null && selectedCampaign ?
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Campaign settings</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    id="camp-active"
                    checked={draftActive}
                    onCheckedChange={(v) => {
                      setDraftActive(v);
                      patchCampaignMut.mutate({ active: v });
                    }}
                    disabled={patchCampaignMut.isPending}
                  />
                  <Label htmlFor="camp-active" className="text-xs cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ed-name">Name</Label>
                  <Input id="ed-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ed-hyp">Hypothesis</Label>
                <Textarea id="ed-hyp" rows={2} value={draftHypothesis} onChange={(e) => setDraftHypothesis(e.target.value)} />
              </div>

              <Collapsible open={campaignAdvOpen} onOpenChange={setCampaignAdvOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-2">
                    {campaignAdvOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Advanced — workspace &amp; metadata
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="ed-biz">Workspace / business id</Label>
                    <Input id="ed-biz" value={draftBusinessId} onChange={(e) => setDraftBusinessId(e.target.value)} />
                  </div>
                  <AdminDevOnly>
                    <p className="text-[11px] text-muted-foreground">
                      Campaign id <span className="font-mono">{selectedCampaign.id}</span> · created{" "}
                      {new Date(selectedCampaign.createdAt).toLocaleString()}
                    </p>
                  </AdminDevOnly>
                </CollapsibleContent>
              </Collapsible>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!draftName.trim() || patchCampaignMut.isPending}
                onClick={saveCampaignSettings}
              >
                {patchCampaignMut.isPending ? "Saving…" : "Save name & hypothesis"}
              </Button>

              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-medium">Add observation</h3>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Recent visits window</Label>
                    <Select value={visitDays} onValueChange={setVisitDays}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIT_WINDOWS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bi-ut-visit">Link to a recent visit (optional)</Label>
                  {recentVisitsQuery.isLoading ?
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : <Select
                      value={visitFromList && visitFromList !== NONE_VISIT ? visitFromList : NONE_VISIT}
                      onValueChange={(v) => setVisitFromList(v === NONE_VISIT ? NONE_VISIT : v)}
                    >
                      <SelectTrigger id="bi-ut-visit" className="w-full">
                        <SelectValue placeholder="Choose a visit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VISIT}>None — notes only</SelectItem>
                        {(recentVisitsQuery.data?.sessions ?? []).map((s) => (
                          <SelectItem key={s.sessionId} value={s.sessionId}>
                            {s.alias} · {visitSummaryLine(s.startTime)}
                            {s.samplePage ? ` · ${s.samplePage.replace(/^https?:\/\/[^/]+/, "")}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                  <p className="text-xs text-muted-foreground">
                    Pick the visit you watched so notes stay easy to find later.
                  </p>
                  <AdminDevOnly>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-left text-xs text-muted-foreground hover:text-foreground py-1"
                      onClick={() => setSupportVisitOpen((o) => !o)}
                      aria-expanded={supportVisitOpen}
                    >
                      {supportVisitOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Support sent you a reference string? Enter it here.
                    </button>
                    {supportVisitOpen ?
                      <Input
                        id="bi-ut-sid"
                        value={visitManualRef}
                        onChange={(e) => {
                          setVisitManualRef(e.target.value);
                          if (e.target.value.trim()) setVisitFromList(NONE_VISIT);
                        }}
                        className="font-mono text-xs"
                        placeholder="Internal reference (engineering only)"
                      />
                    : null}
                  </AdminDevOnly>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bi-ut-crm">CRM contact id (optional)</Label>
                  <Input
                    id="bi-ut-crm"
                    inputMode="numeric"
                    value={obsCrmContactId}
                    onChange={(e) => setObsCrmContactId(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Link this note to a CRM row"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bi-ut-notes">Notes</Label>
                  <Textarea id="bi-ut-notes" rows={3} value={obsNotes} onChange={(e) => setObsNotes(e.target.value)} />
                </div>
                <Button type="button" disabled={!obsNotes.trim() || addObsMut.isPending} onClick={() => addObsMut.mutate()}>
                  {addObsMut.isPending ? "Saving…" : "Save observation"}
                </Button>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observation log</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select value={String(obsLimit)} onValueChange={(v) => setObsLimit(Number(v))}>
                      <SelectTrigger className="h-8 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OBS_LIMITS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} rows
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 w-[200px]"
                      placeholder="Search log…"
                      value={obsSearch}
                      onChange={(e) => setObsSearch(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={!(observationsQuery.data?.length)}
                      onClick={() =>
                        exportObservationsCsv(selectedCampaign, observationsQuery.data ?? [])
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                {observationsQuery.isLoading ?
                  <Loader2 className="h-5 w-5 animate-spin" />
                : !filteredObservations.length ?
                  <p className="text-xs text-muted-foreground">No observations match.</p>
                : <ul className="space-y-2 max-h-72 overflow-y-auto text-sm">
                    {filteredObservations.map((o) => (
                      <li key={o.id} className="rounded border p-2">
                        {o.sessionId ?
                          <p className="text-xs text-muted-foreground mb-1">
                            Visit:{" "}
                            <span className="font-medium text-foreground">
                              {visitorAliasFromSessionId(o.sessionId)}
                            </span>
                          </p>
                        : null}
                        {o.crmContactId != null ?
                          <p className="text-[11px] text-muted-foreground mb-1">CRM contact #{o.crmContactId}</p>
                        : null}
                        <p>{o.notes}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                }
              </div>
            </div>
          : null}
        </CardContent>
      </Card>
    </div>
  );
}
