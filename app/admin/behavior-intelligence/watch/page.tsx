"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crosshair, FileBarChart, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WatchTargetScopeType } from "@shared/ascendraOsWatchScope";

type WatchTarget = {
  id: number;
  name: string;
  scopeType?: string | null;
  pathPattern: string;
  fullUrlPrefix?: string | null;
  aosAgencyProjectId?: number | null;
  metadataJson?: Record<string, unknown> | null;
  businessId: string | null;
  active: boolean;
  recordReplay: boolean;
  recordHeatmap: boolean;
  maxSessionRecordingMinutes: number | null;
  collectFrom: string | null;
  collectUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

type AosProjectRow = { id: number; name: string };

type WatchReport = {
  id: number;
  targetId: number | null;
  title: string;
  periodStart: string;
  periodEnd: string;
  summaryJson: Record<string, unknown>;
  createdAt: string;
};

const SCOPE_OPTIONS: { value: WatchTargetScopeType; label: string; hint: string }[] = [
  { value: "path_prefix", label: "Path prefix", hint: "On this property only (e.g. /pricing)" },
  { value: "full_url", label: "Full URL prefix", hint: "Match https://… including path and query prefix" },
  {
    value: "aos_agency_project",
    label: "Agency OS client project",
    hint: "CRM website on this app’s host auto-fills URL; external sites need a path below",
  },
];

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function scopeLabel(s: string | null | undefined): string {
  const o = SCOPE_OPTIONS.find((x) => x.value === s);
  return o?.label ?? (s || "path");
}

export default function BehaviorWatchPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState<WatchTargetScopeType>("path_prefix");
  const [newPath, setNewPath] = useState("/");
  const [newFullUrl, setNewFullUrl] = useState("");
  const [newAosProjectId, setNewAosProjectId] = useState<string>("");
  const [newOsTags, setNewOsTags] = useState("");
  const [newCap, setNewCap] = useState("30");
  const [newReplay, setNewReplay] = useState(true);
  const [newHeatmap, setNewHeatmap] = useState(true);
  const [newFrom, setNewFrom] = useState("");
  const [newUntil, setNewUntil] = useState("");

  const [reportTitle, setReportTitle] = useState("");
  const [reportTargetId, setReportTargetId] = useState<string>("");
  const [reportPath, setReportPath] = useState("");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [reportTargetChecks, setReportTargetChecks] = useState<Record<number, boolean>>({});

  const targetsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/watch-targets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/watch-targets");
      const j = (await res.json()) as { targets: WatchTarget[] };
      return j.targets ?? [];
    },
  });

  const aosQuery = useQuery({
    queryKey: ["/api/admin/agency-os/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/agency-os/projects");
      const j = (await res.json()) as { projects: AosProjectRow[] };
      return j.projects ?? [];
    },
  });

  const reportsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/watch-reports"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/watch-reports?limit=100");
      const j = (await res.json()) as { reports: WatchReport[] };
      return j.reports ?? [];
    },
  });

  const createTarget = useMutation({
    mutationFn: async () => {
      const cap = newCap.trim() ? Number(newCap) : null;
      const tags = newOsTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const metadataJson = tags.length > 0 ? { ascendraOsTags: tags } : undefined;
      const aosId = newAosProjectId.trim() ? Number(newAosProjectId) : null;

      const body: Record<string, unknown> = {
        name: newName.trim(),
        scopeType: newScope,
        businessId: "ascendra_main",
        active: true,
        recordReplay: newReplay,
        recordHeatmap: newHeatmap,
        maxSessionRecordingMinutes: cap !== null && Number.isFinite(cap) ? cap : null,
        collectFrom: newFrom.trim() || null,
        collectUntil: newUntil.trim() || null,
        metadataJson: metadataJson ?? null,
      };

      if (newScope === "path_prefix") {
        body.pathPattern = newPath.trim() || "/";
      } else if (newScope === "full_url") {
        body.fullUrlPrefix = newFullUrl.trim();
        body.pathPattern = "/";
      } else {
        body.aosAgencyProjectId = aosId;
        body.pathPattern = newPath.trim() || "/";
        if (newFullUrl.trim()) body.fullUrlPrefix = newFullUrl.trim();
      }

      return apiRequest("POST", "/api/admin/behavior-intelligence/watch-targets", body).then((r) => r.json());
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/watch-targets"] });
      setNewName("");
      setNewPath("/");
      setNewFullUrl("");
      setNewAosProjectId("");
      setNewOsTags("");
      setNewScope("path_prefix");
    },
  });

  const patchTarget = useMutation({
    mutationFn: async (p: { id: number; patch: Partial<WatchTarget> }) => {
      await apiRequest("PATCH", `/api/admin/behavior-intelligence/watch-targets/${p.id}`, p.patch);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/watch-targets"] }),
  });

  const deleteTarget = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/behavior-intelligence/watch-targets/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/watch-targets"] }),
  });

  const multiReportIds = useMemo(
    () => Object.entries(reportTargetChecks).filter(([, v]) => v).map(([k]) => Number(k)),
    [reportTargetChecks],
  );

  const createReport = useMutation({
    mutationFn: async () => {
      const base = {
        title: reportTitle.trim() || "Watch report",
        periodStart: new Date(reportStart).toISOString(),
        periodEnd: new Date(reportEnd).toISOString(),
      };

      if (multiReportIds.length >= 2) {
        return apiRequest("POST", "/api/admin/behavior-intelligence/watch-reports", {
          ...base,
          targetIds: multiReportIds,
        }).then((r) => r.json());
      }

      const tid = reportTargetId.trim() ? Number(reportTargetId) : null;
      return apiRequest("POST", "/api/admin/behavior-intelligence/watch-reports", {
        ...base,
        targetId: tid,
        pathPattern: !tid ? reportPath.trim() || "/" : undefined,
      }).then((r) => r.json());
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/watch-reports"] });
      setReportTitle("");
      setReportTargetChecks({});
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/behavior-intelligence/watch-reports/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/watch-reports"] }),
  });

  const defaultReportRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start: toLocalDatetimeValue(start.toISOString()), end: toLocalDatetimeValue(end.toISOString()) };
  }, []);

  useEffect(() => {
    setReportStart((prev) => prev || defaultReportRange.start);
    setReportEnd((prev) => prev || defaultReportRange.end);
  }, [defaultReportRange.start, defaultReportRange.end]);

  const targets = targetsQuery.data ?? [];
  const reports = reportsQuery.data ?? [];
  const aosProjects = aosQuery.data ?? [];

  const addDisabled =
    !newName.trim() ||
    createTarget.isPending ||
    (newScope === "full_url" && !newFullUrl.trim()) ||
    (newScope === "aos_agency_project" && !newAosProjectId.trim());

  const reportOk =
    multiReportIds.length >= 2 ||
    (multiReportIds.length === 0 && (reportTargetId.trim() !== "" || reportPath.trim() !== ""));
  const reportDisabled = !reportStart || !reportEnd || createReport.isPending || !reportOk;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Crosshair className="h-6 w-6 text-primary" />
            Watch targets & reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Target by <strong>path</strong>, full <strong>URL prefix</strong>, or an <strong>Agency OS</strong> client
            project (uses CRM account/contact website when it matches this app). Use <code className="text-xs">metadata</code> tags
            for other Ascendra OS workflows. Combined reports can include several saved targets at once.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New watch target</CardTitle>
          <CardDescription>
            With at least one <strong>active</strong> target in its date window, capture runs <em>only</em> where scopes
            match. No qualifying rows → legacy full-site capture on tracked pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="wt-scope">How to match (tracker + Behavior Intelligence)</Label>
            <select
              id="wt-scope"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newScope}
              onChange={(e) => setNewScope(e.target.value as WatchTargetScopeType)}
            >
              {SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{SCOPE_OPTIONS.find((o) => o.value === newScope)?.hint}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="wt-name">Label</Label>
              <Input id="wt-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Pricing page sprint" />
            </div>
            {newScope === "aos_agency_project" ?
              <div className="space-y-1">
                <Label htmlFor="wt-aos">Agency OS project</Label>
                <select
                  id="wt-aos"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newAosProjectId}
                  onChange={(e) => setNewAosProjectId(e.target.value)}
                >
                  <option value="">Select project…</option>
                  {aosProjects.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} (#{p.id})
                    </option>
                  ))}
                </select>
              </div>
            : null}
            {newScope === "full_url" ?
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="wt-url">Full URL prefix</Label>
                <Input
                  id="wt-url"
                  value={newFullUrl}
                  onChange={(e) => setNewFullUrl(e.target.value)}
                  placeholder={`${typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/growth-platform`}
                />
              </div>
            : null}
            {(newScope === "path_prefix" || newScope === "aos_agency_project") ?
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="wt-path">
                  Path prefix {newScope === "aos_agency_project" ? "(required if client site host ≠ this app)" : ""}
                </Label>
                <Input id="wt-path" value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="/pricing" />
              </div>
            : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="wt-tags">Ascendra OS tags (optional)</Label>
            <Input
              id="wt-tags"
              value={newOsTags}
              onChange={(e) => setNewOsTags(e.target.value)}
              placeholder="client-portal, q1-campaign"
            />
            <p className="text-xs text-muted-foreground">Stored on the target as <code className="text-xs">metadata.ascendraOsTags</code> for ops and future features.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="wt-cap">Max session recording (minutes)</Label>
              <Input id="wt-cap" type="number" min={1} max={240} value={newCap} onChange={(e) => setNewCap(e.target.value)} />
              <p className="text-xs text-muted-foreground">Caps replay chunks only; heatmaps continue.</p>
            </div>
            <div className="flex flex-wrap gap-6 items-end pb-1">
              <div className="flex items-center gap-2">
                <Checkbox id="wt-replay" checked={newReplay} onCheckedChange={(v) => setNewReplay(v === true)} />
                <Label htmlFor="wt-replay" className="font-normal cursor-pointer">
                  Session replay
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="wt-heat" checked={newHeatmap} onCheckedChange={(v) => setNewHeatmap(v === true)} />
                <Label htmlFor="wt-heat" className="font-normal cursor-pointer">
                  Heatmap clicks
                </Label>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="wt-from">Collect from (optional)</Label>
              <Input id="wt-from" type="datetime-local" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wt-until">Collect until (optional)</Label>
              <Input id="wt-until" type="datetime-local" value={newUntil} onChange={(e) => setNewUntil(e.target.value)} />
            </div>
          </div>
          <Button type="button" disabled={addDisabled} onClick={() => void createTarget.mutateAsync()}>
            {createTarget.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add target
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active targets</CardTitle>
        </CardHeader>
        <CardContent>
          {targetsQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          : targets.length === 0 ?
            <p className="text-sm text-muted-foreground">No targets yet — ingestion uses legacy full-site capture.</p>
          : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Path / URL</TableHead>
                    <TableHead>AOS</TableHead>
                    <TableHead>Replay</TableHead>
                    <TableHead>Heatmap</TableHead>
                    <TableHead>Cap</TableHead>
                    <TableHead>On</TableHead>
                    <TableHead className="w-[72px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-xs">{scopeLabel(t.scopeType)}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={t.fullUrlPrefix ?? t.pathPattern}>
                        {t.fullUrlPrefix ?? t.pathPattern}
                      </TableCell>
                      <TableCell className="text-xs">{t.aosAgencyProjectId ?? "—"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={t.recordReplay}
                          onCheckedChange={(v) => void patchTarget.mutateAsync({ id: t.id, patch: { recordReplay: v } })}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={t.recordHeatmap}
                          onCheckedChange={(v) => void patchTarget.mutateAsync({ id: t.id, patch: { recordHeatmap: v } })}
                        />
                      </TableCell>
                      <TableCell>{t.maxSessionRecordingMinutes ?? "—"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={t.active}
                          onCheckedChange={(v) => void patchTarget.mutateAsync({ id: t.id, patch: { active: v } })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => void deleteTarget.mutateAsync(t.id)}
                          aria-label={`Delete ${t.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Watch reports
          </CardTitle>
          <CardDescription>
            One target, custom path, or check two or more saved targets for a combined rollup. Reports stay until deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="rp-title">Title</Label>
              <Input id="rp-title" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="March homepage review" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rp-target">Single target</Label>
              <select
                id="rp-target"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                value={reportTargetId}
                onChange={(e) => setReportTargetId(e.target.value)}
                disabled={multiReportIds.length >= 2}
              >
                <option value="">Custom path below</option>
                {targets.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name} ({t.pathPattern})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Multi-project / multi-target rollup</p>
            <p className="text-xs text-muted-foreground">Select two or more rows below to merge metrics (OR of paths). Single-target dropdown is disabled when 2+ are checked.</p>
            <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto">
              {targets.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!reportTargetChecks[t.id]}
                    onCheckedChange={(v) => {
                      setReportTargetChecks((prev) => ({ ...prev, [t.id]: v === true }));
                      if (v === true) setReportTargetId("");
                    }}
                  />
                  <span className="truncate max-w-[200px]">{t.name}</span>
                </label>
              ))}
            </div>
            {multiReportIds.length > 0 ?
              <p className="text-xs text-muted-foreground">
                Selected: {multiReportIds.length} target{multiReportIds.length === 1 ? "" : "s"}
              </p>
            : null}
          </div>

          {!reportTargetId && multiReportIds.length < 2 ?
            <div className="space-y-1">
              <Label htmlFor="rp-path">Path prefix (custom report only)</Label>
              <Input id="rp-path" value={reportPath} onChange={(e) => setReportPath(e.target.value)} placeholder="/" />
            </div>
          : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="rp-start">Period start</Label>
              <Input id="rp-start" type="datetime-local" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rp-end">Period end</Label>
              <Input id="rp-end" type="datetime-local" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
            </div>
          </div>
          <Button type="button" disabled={reportDisabled} onClick={() => void createReport.mutateAsync()}>
            {createReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save report
          </Button>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-medium">Saved reports</h3>
            {reportsQuery.isLoading ?
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            : reports.length === 0 ?
              <p className="text-sm text-muted-foreground">No saved reports.</p>
            : <ul className="space-y-3">
                {reports.map((r) => {
                  const s = r.summaryJson;
                  const multi = s.mode === "multi_target";
                  const rollup = multi && s.rollup && typeof s.rollup === "object" ? (s.rollup as Record<string, unknown>) : null;
                  return (
                    <li key={r.id} className="rounded-lg border p-3 text-sm space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.periodStart).toLocaleString()} → {new Date(r.periodEnd).toLocaleString()}
                          </p>
                          {multi && Array.isArray(s.targetIds) ?
                            <p className="text-xs text-muted-foreground mt-1">Targets: {(s.targetIds as number[]).join(", ")}</p>
                          : null}
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => void deleteReport.mutateAsync(r.id)}>
                          Delete
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          Heatmap sessions: {String((rollup ?? s).uniqueSessionsWithHeatmap ?? "—")}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5">Clicks: {String((rollup ?? s).heatmapClicks ?? "—")}</span>
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          Replay sessions: {String((rollup ?? s).replaySessionsWithRecording ?? "—")}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5">Replay chunks: {String((rollup ?? s).replaySegmentCount ?? "—")}</span>
                      </div>
                      {multi && Array.isArray(s.byTarget) ?
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                          {(s.byTarget as { name: string; summary: Record<string, unknown> }[]).map((row, i) => (
                            <li key={i}>
                              {row.name}: {String(row.summary?.heatmapClicks ?? "—")} clicks,{" "}
                              {String(row.summary?.uniqueSessionsWithHeatmap ?? "—")} sessions
                            </li>
                          ))}
                        </ul>
                      : null}
                      {!multi && Array.isArray(s.topPages) && s.topPages.length > 0 ?
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Top pages: </span>
                          {(s.topPages as { page: string; clicks: number }[])
                            .slice(0, 5)
                            .map((p) => `${p.page} (${p.clicks})`)
                            .join(" · ")}
                        </div>
                      : null}
                    </li>
                  );
                })}
              </ul>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
