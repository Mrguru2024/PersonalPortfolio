"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Loader2,
  MapPin,
  Play,
  Search,
  Star,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BehaviorVisitorHubResponse } from "@server/services/behavior/behaviorIngestService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BehaviorRrwebPlayer } from "@/components/admin/behavior-intelligence/BehaviorRrwebPlayer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

function formatVisitorTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (startThat.getTime() === startToday.getTime()) return `today at ${time}`;
  const y = new Date(startToday);
  y.setDate(y.getDate() - 1);
  if (startThat.getTime() === y.getTime()) return `yesterday at ${time}`;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function hubQueryKey(days: number, onlineOnly: boolean, q: string, offset: number) {
  const params = new URLSearchParams({
    hub: "1",
    days: String(days),
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  if (onlineOnly) params.set("online", "1");
  if (q.trim()) params.set("q", q.trim());
  return `/api/admin/behavior-intelligence/sessions?${params}` as const;
}

function exportHubCsv(data: BehaviorVisitorHubResponse) {
  const header = [
    "alias",
    "sessionId",
    "startTime",
    "endTime",
    "device",
    "locationLabel",
    "pageViews",
    "clickEvents",
    "durationLabel",
    "hasReplay",
    "hasHeatmap",
    "samplePage",
    "isOnline",
    "converted",
    "retentionImportant",
    "retentionArchived",
  ];
  const lines = data.sessions.map((s) =>
    [
      s.alias,
      s.sessionId,
      s.startTime,
      s.endTime ?? "",
      s.device ?? "",
      s.locationLabel,
      s.pageViews,
      s.clickEvents,
      s.durationLabel,
      s.hasReplay,
      s.hasHeatmap,
      s.samplePage ?? "",
      s.isOnline,
      s.converted,
      s.retentionImportant,
      s.retentionArchived,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `behavior-visitors-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

type ReplayPlayback = {
  maxSeq: number;
  segmentCount: number;
  sessionEndTime: string | null;
  recordingActive: boolean;
  unavailableReason?: string;
};

type ReplayApiResponse = {
  sessionId: string;
  events: unknown[];
  playback: ReplayPlayback;
};

type ReplaySheetContext = {
  sessionId: string;
  isOnline: boolean;
  retentionImportant: boolean;
  retentionArchived: boolean;
};

export default function BehaviorVisitorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [days, setDays] = useState(7);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [replayContext, setReplayContext] = useState<ReplaySheetContext | null>(null);
  const [replayLive, setReplayLive] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setOffset(0);
  }, [days, onlineOnly, debouncedSearch]);

  const listPath = useMemo(
    () => hubQueryKey(days, onlineOnly, debouncedSearch, offset),
    [days, onlineOnly, debouncedSearch, offset],
  );

  const hub = useQuery({
    queryKey: ["behavior-visitor-hub", listPath],
    queryFn: async () => {
      const res = await apiRequest("GET", listPath);
      return res.json() as Promise<BehaviorVisitorHubResponse>;
    },
  });

  const replay = useQuery({
    queryKey: [
      "/api/admin/behavior-intelligence/replays",
      replayContext?.sessionId ?? "",
      replayLive,
      !!replayContext?.isOnline,
    ],
    queryFn: async () => {
      if (!replayContext?.sessionId) {
        return { sessionId: "", events: [] as unknown[], playback: null as ReplayPlayback | null };
      }
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/replays/${encodeURIComponent(replayContext.sessionId)}`,
      );
      return res.json() as Promise<ReplayApiResponse>;
    },
    enabled: !!replayContext?.sessionId && replayContext.sessionId.length >= 8,
    refetchInterval: (q) => {
      const d = q.state.data as ReplayApiResponse | undefined;
      const liveMode = q.queryKey[2] === true;
      const visitorOnline = q.queryKey[3] === true;
      if (!liveMode || !visitorOnline) return false;
      return d?.playback?.recordingActive ? 2500 : false;
    },
  });

  const liveTail =
    !!replayContext?.isOnline && replayLive && !!replay.data?.playback?.recordingActive;

  const retentionMutation = useMutation({
    mutationFn: async (vars: { sessionId: string; retentionImportant?: boolean; retentionArchived?: boolean }) => {
      await apiRequest(
        "PATCH",
        `/api/admin/behavior-intelligence/sessions/${encodeURIComponent(vars.sessionId)}/retention`,
        { retentionImportant: vars.retentionImportant, retentionArchived: vars.retentionArchived },
      );
    },
    onSuccess: () => {
      toast({ title: "Retention updated" });
      void queryClient.invalidateQueries({ queryKey: ["behavior-visitor-hub"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const openReplay = useCallback((s: BehaviorVisitorHubResponse["sessions"][number]) => {
    setReplayContext({
      sessionId: s.sessionId,
      isOnline: s.isOnline,
      retentionImportant: s.retentionImportant,
      retentionArchived: s.retentionArchived,
    });
    setReplayLive(s.isOnline && s.hasReplay);
  }, []);

  const onCopySession = useCallback(
    (sessionId: string) => {
      void navigator.clipboard.writeText(sessionId);
      toast({ title: "Session id copied" });
    },
    [toast],
  );

  const data = hub.data;
  const total = data?.summary.totalInRange ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Session list with replay and heatmap shortcuts — same data as legacy{" "}
            <code className="text-xs bg-muted px-1 rounded">GET /sessions</code> when{" "}
            <code className="text-xs bg-muted px-1 rounded">hub</code> is omitted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/storage-retention">
              <Database className="h-4 w-4 mr-2" />
              Storage
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/behavior-intelligence">← Overview</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity</CardTitle>
          <CardDescription>
            {hub.isLoading ?
              "Loading summary…"
            : data ?
              <>
                There {data.summary.visitsToday === 1 ? "was" : "were"}{" "}
                <span className="font-medium text-foreground">{data.summary.visitsToday}</span> visit
                {data.summary.visitsToday === 1 ? "" : "s"} today,{" "}
                <button
                  type="button"
                  className={cn(
                    "underline-offset-2 hover:underline font-medium text-foreground",
                    !onlineOnly && "text-primary",
                  )}
                  onClick={() => {
                    setOnlineOnly(true);
                    setOffset(0);
                  }}
                >
                  {data.summary.onlineNow}
                </button>{" "}
                currently online (end time within 3 minutes).
              </>
            : "—"}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/admin/behavior-intelligence/watch">
                  <MapPin className="h-4 w-4 mr-2" />
                  Watch targets
                </Link>
              </Button>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date range</Label>
                <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Today</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6 lg:pt-0">
                <Switch id="online-only" checked={onlineOnly} onCheckedChange={setOnlineOnly} />
                <Label htmlFor="online-only" className="text-sm cursor-pointer">
                  Only show online visitors
                </Label>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!data?.sessions.length}
                onClick={() => data && exportHubCsv(data)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-[220px] sm:w-64"
                  placeholder="Search session id…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search visitors"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hub.isLoading ?
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          : hub.isError ?
            <p className="text-sm text-destructive">Could not load visitors.</p>
          : !data?.sessions.length ?
            <p className="text-sm text-muted-foreground py-6 text-center">
              No sessions in this range. Enable tracking and ingest events to see visitors here.
            </p>
          : <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Showing {offset + 1}–{Math.min(offset + data.sessions.length, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canPrev}
                    onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canNext}
                    onClick={() => setOffset((o) => o + PAGE_SIZE)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date / time</TableHead>
                    <TableHead className="text-right">Pages</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                              s.isOnline ?
                                "bg-primary/15 text-primary ring-2 ring-primary/30"
                              : "bg-muted text-muted-foreground",
                            )}
                            title={s.isOnline ? "Recent activity" : undefined}
                          >
                            {s.alias.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.alias}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.locationLabel}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.hasReplay ?
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 font-normal">
                                  Replay
                                </Badge>
                              : null}
                              {s.hasHeatmap ?
                                <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                                  Heatmap
                                </Badge>
                              : null}
                              {s.converted ?
                                <Badge className="text-[10px] px-1 py-0 font-normal">Converted</Badge>
                              : null}
                              {s.retentionImportant ?
                                <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal gap-0.5">
                                  <Star className="h-2.5 w-2.5" />
                                  Kept
                                </Badge>
                              : null}
                              {s.retentionArchived ?
                                <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal gap-0.5">
                                  <Archive className="h-2.5 w-2.5" />
                                  Archived
                                </Badge>
                              : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatVisitorTime(s.startTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{s.pageViews}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.clickEvents}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.durationLabel}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-primary"
                            title="Copy session id"
                            onClick={() => onCopySession(s.sessionId)}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className={cn("h-8 w-8", s.retentionImportant ? "text-amber-600" : "text-muted-foreground")}
                            title="Keep from auto-delete (90d policy)"
                            onClick={() =>
                              retentionMutation.mutate({
                                sessionId: s.sessionId,
                                retentionImportant: !s.retentionImportant,
                              })
                            }
                          >
                            <Star className="h-4 w-4" fill={s.retentionImportant ? "currentColor" : "none"} />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground"
                            title="Archive (exempt from auto-delete)"
                            onClick={() =>
                              retentionMutation.mutate({
                                sessionId: s.sessionId,
                                retentionArchived: !s.retentionArchived,
                              })
                            }
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-primary"
                            title="Play session replay"
                            disabled={!s.hasReplay}
                            onClick={() => openReplay(s)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          {s.samplePage ?
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                              <Link
                                href={`/admin/behavior-intelligence/heatmaps?page=${encodeURIComponent(s.samplePage)}`}
                              >
                                Map
                              </Link>
                            </Button>
                          : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>

      <Sheet
        open={!!replayContext}
        onOpenChange={(open) => {
          if (!open) setReplayContext(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Session replay</SheetTitle>
            <SheetDescription className="font-mono text-xs break-all">
              {replayContext?.sessionId}
            </SheetDescription>
          </SheetHeader>
          {replayContext?.isOnline && replay.data?.playback?.recordingActive ?
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={replayLive ? "default" : "outline"} onClick={() => setReplayLive(true)}>
                Live (follow visitor)
              </Button>
              <Button type="button" size="sm" variant={!replayLive ? "default" : "outline"} onClick={() => setReplayLive(false)}>
                Recorded (static)
              </Button>
            </div>
          : null}
          {replay.data?.playback?.unavailableReason === "soft_deleted" ?
            <p className="mt-4 text-sm text-destructive">
              This session is in retention trash. Restore it from{" "}
              <Link href="/admin/storage-retention" className="underline">
                Storage &amp; retention
              </Link>{" "}
              to view replay data.
            </p>
          : null}
          <div className="mt-6">
            {replay.isFetching && !liveTail ?
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            : <BehaviorRrwebPlayer events={replay.data?.events ?? []} live={liveTail} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
