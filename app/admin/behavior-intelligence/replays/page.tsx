"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BehaviorVisitorHubResponse } from "@server/services/behavior/behaviorIngestService";
import { trackedSiteLabel, visitorAliasFromSessionId } from "@/lib/behaviorVisitorAlias";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BehaviorRrwebPlayer } from "@/components/admin/behavior-intelligence/BehaviorRrwebPlayer";
import { AdminDevOnly } from "@/components/admin/AdminDevOnly";
import { cn } from "@/lib/utils";

type ReplayPlayback = {
  maxSeq: number;
  segmentCount: number;
  sessionEndTime: string | null;
  recordingActive: boolean;
  unavailableReason?: string;
};

type ReplayResponse = {
  sessionId: string;
  startTime: string;
  endTime: string | null;
  device: string | null;
  converted: boolean;
  replaySegmentsCount: number;
  eventCount: number;
  lastReplayAt: string | null;
  events: unknown[];
  playback: ReplayPlayback;
};

const HUB_LIMIT = 50;
const NONE_WORKSPACE = "__none__";

function hubUrl(days: number, q: string, businessId: string): string {
  const params = new URLSearchParams({
    hub: "1",
    days: String(days),
    limit: String(HUB_LIMIT),
    offset: "0",
  });
  const trimmedQ = q.trim();
  if (trimmedQ) params.set("q", trimmedQ);
  if (businessId && businessId !== "all") params.set("businessId", businessId);
  return `/api/admin/behavior-intelligence/sessions?${params}`;
}

function truncatePath(path: string, max = 52): string {
  const p = path.trim();
  if (p.length <= max) return p;
  return `${p.slice(0, Math.floor(max / 2) - 1)}…${p.slice(-Math.floor(max / 2) + 1)}`;
}

function shortDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function BehaviorReplaysPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pick, setPick] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [replayLive, setReplayLive] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const [days, setDays] = useState(14);
  const [searchInput, setSearchInput] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all");

  const { data: filterOptions } = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/sessions", "filters"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/sessions?filters=1");
      return res.json() as Promise<{ businessIds: string[] }>;
    },
  });

  const sessionId = pick ?? (manual.trim() || null);
  const filteredSessions = useMemo(
    () => (sessions ?? []).filter((s) => s.replaySegmentsCount > 0),
    [sessions],
  );
  const hubQueryKey = useMemo(
    () => ["replays-hub", days, searchInput.trim(), workspaceFilter] as const,
    [days, searchInput, workspaceFilter],
  );

  const { data: hubData, isLoading: hubLoading } = useQuery({
    queryKey: hubQueryKey,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        hubUrl(days, searchInput, workspaceFilter),
      );
      return res.json() as Promise<BehaviorVisitorHubResponse>;
    },
  });

  const sessions = hubData?.sessions ?? [];

  const syncSessionUrl = useCallback(
    (internalSessionKey: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      if (internalSessionKey && internalSessionKey.length >= 8) p.set("session", internalSessionKey);
      else p.delete("session");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const s = searchParams.get("session")?.trim() ?? "";
    if (s.length >= 8) {
      setPick(s);
      setManual("");
    }
  }, [searchParams]);

  const sessionId = (pick ?? manual.trim()) || null;

  const { data: replay, isFetching } = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/replays", sessionId, replayLive],
    queryFn: async () => {
      if (!sessionId) {
        return { sessionId: "", events: [] as unknown[], playback: null as ReplayPlayback | null };
      }
      const res = await apiRequest("GET", `/api/admin/behavior-intelligence/replays/${encodeURIComponent(sessionId)}`);
      return res.json() as Promise<ReplayResponse>;
    },
    enabled: !!sessionId && sessionId.length >= 8,
    refetchInterval: (q) => {
      const d = q.state.data as ReplayResponse | undefined;
      if (!sessionId || !replayLive) return false;
      return d?.playback?.recordingActive ? 2500 : false;
    },
  });

  const events = useMemo(() => replay?.events ?? [], [replay?.events]);

  useEffect(() => {
    setReplayLive(true);
  }, [sessionId]);

  const liveTail =
    !!sessionId && replayLive && !!replay?.playback?.recordingActive;

  const selectedFromList = useMemo(
    () => (pick ? sessions.find((s) => s.sessionId === pick) : undefined),
    [pick, sessions],
  );

  const selectedHeading = useMemo(() => {
    if (selectedFromList) {
      return `${selectedFromList.alias} · ${shortDateTime(selectedFromList.startTime)}`;
    }
    const key = (pick ?? manual.trim()) || "";
    if (key.length >= 8) {
      const row = sessions.find((s) => s.sessionId === key);
      return row
        ? `${visitorAliasFromSessionId(key)} · ${shortDateTime(row.startTime)}`
        : `${visitorAliasFromSessionId(key)} · opened from link`;
    }
    return null;
  }, [selectedFromList, pick, manual, sessions]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Session replays</h1>
          <p className="text-sm text-muted-foreground">
            Choose a visit from the list, search by page or link, then watch the recording. If someone is still on your
            site, you can follow along live (same short window as the Visitors hub).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/storage-retention">Storage</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/behavior-intelligence/visitors">Visitors hub</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/behavior-intelligence">← Overview</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent sessions</CardTitle>
          <CardDescription>Select a row with replay data to load events.</CardDescription>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Find a visit</CardTitle>
          <CardDescription>
            Search by page path, full URL, or the friendly visitor name. Narrow by site if you track more than one
            property.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 min-w-[200px] flex-1">
              <Label htmlFor="replay-search">Search</Label>
              <Input
                id="replay-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. /pricing, yoursite.com/contact, or Swift Finch"
              />
            </div>
            <div className="space-y-2 w-full sm:w-52">
              <Label>Site / property</Label>
              <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sites</SelectItem>
                  <SelectItem value={NONE_WORKSPACE}>Not assigned to a site</SelectItem>
                  {(filterOptions?.businessIds ?? []).map((id) => (
                    <SelectItem key={id} value={id}>
                      {trackedSiteLabel(id) ?? id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full sm:w-40">
              <Label>Time range</Label>
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hubLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : filteredSessions.length === 0 ?
            <p className="text-sm text-muted-foreground">
              No replay-ready sessions yet. Tracking is active on public pages now; browse the site and refresh this page.
            </p>
          : <ul className="divide-y rounded-md border max-h-72 overflow-auto text-sm">
              {filteredSessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-muted/50 ${pick === s.sessionId ? "bg-muted" : ""}`}
                    onClick={() => setPick(s.sessionId)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs">{s.sessionId}</span>
                      <span className="text-muted-foreground">{s.device ?? "—"}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      segments: {s.replaySegmentsCount} · events: {s.eventCount}
                      {s.lastReplayAt ? ` · last replay: ${new Date(s.lastReplayAt).toLocaleString()}` : ""}
                    </div>
                  </button>
          : <ul className="divide-y rounded-md border max-h-72 overflow-auto text-sm">
              {sessions.length === 0 ?
                <li className="px-3 py-6 text-center text-muted-foreground">
                  No visits match. Try another site filter, widen the dates, or shorten the search.
                </li>
              : sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2.5 hover:bg-muted/50 space-y-0.5",
                        pick === s.sessionId && "bg-muted",
                      )}
                      onClick={() => {
                        setManual("");
                        setPick(s.sessionId);
                        syncSessionUrl(s.sessionId);
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.alias}</span>
                        {s.hasReplay ?
                          <Badge variant="secondary" className="text-[10px]">
                            Recording
                          </Badge>
                        : <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            No recording yet
                          </Badge>
                        }
                        {s.isOnline ?
                          <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-600">Live now</Badge>
                        : null}
                      </div>
                      {s.samplePage ?
                        <div className="text-xs text-muted-foreground truncate" title={s.samplePage}>
                          {truncatePath(s.samplePage)}
                        </div>
                      : null}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{shortDateTime(s.startTime)}</span>
                        <span>{s.locationLabel}</span>
                        {s.businessId ?
                          <span className="text-[11px]">{trackedSiteLabel(s.businessId) ?? s.businessId}</span>
                        : null}
                      </div>
                    </button>
                  </li>
                ))
              }
            </ul>
          }
          {sessionId && selectedHeading ?
            <p className="text-sm text-foreground">
              <span className="font-medium">Playing:</span> {selectedHeading}
              {" · "}
              <button
                type="button"
                className="text-muted-foreground underline hover:text-foreground text-xs"
                onClick={() => {
                  setPick(null);
                  setManual("");
                  syncSessionUrl(null);
                }}
              >
                Clear
              </button>
            </p>
          : null}
        </CardContent>
      </Card>

      <AdminDevOnly>
        <Card>
          <button
            type="button"
            className="flex w-full items-center gap-2 text-left px-6 py-4 hover:bg-muted/30 rounded-t-lg border-b"
            onClick={() => setSupportOpen((o) => !o)}
            aria-expanded={supportOpen}
          >
            {supportOpen ?
              <ChevronDown className="h-4 w-4 shrink-0" />
            : <ChevronRight className="h-4 w-4 shrink-0" />}
            <span className="font-medium text-sm">Support &amp; engineering</span>
            <span className="text-xs text-muted-foreground font-normal">— optional internal reference or shared admin link</span>
          </button>
          {supportOpen ?
            <CardContent className="pt-4 space-y-2">
              <Label htmlFor="sid">Internal session reference</Label>
              <Input
                id="sid"
                value={manual}
                onChange={(e) => {
                  setPick(null);
                  setManual(e.target.value);
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v.length >= 8) {
                    setPick(v);
                    syncSessionUrl(v);
                  }
                }}
                placeholder="Only if support sent you a reference string"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Bookmarked admin links may include this automatically. You normally do not need this field.
              </p>
            </CardContent>
          : null}
        </Card>
      </AdminDevOnly>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Player</CardTitle>
          {isFetching && !liveTail ? <CardDescription>Loading…</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {replay?.playback?.recordingActive ?
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={replayLive ? "default" : "outline"} onClick={() => setReplayLive(true)}>
                Live
              </Button>
              <Button type="button" size="sm" variant={!replayLive ? "default" : "outline"} onClick={() => setReplayLive(false)}>
                Recorded
              </Button>
            </div>
          : null}
          {replay?.playback?.unavailableReason === "soft_deleted" ?
            <p className="text-sm text-destructive">
              This visit is in the retention trash. Restore it from{" "}
              <Link href="/admin/storage-retention" className="underline">
                Storage &amp; retention
              </Link>
              .
            </p>
          : null}
          {!sessionId ?
            <p className="text-sm text-muted-foreground">Select a visit from the list to load the player.</p>
          : null}
          <BehaviorRrwebPlayer events={events} live={liveTail} />
        </CardContent>
      </Card>
    </div>
  );
}
