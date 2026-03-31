"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BehaviorRrwebPlayer } from "@/components/admin/behavior-intelligence/BehaviorRrwebPlayer";

type SessionRow = {
  id: number;
  sessionId: string;
  startTime: string;
  device: string | null;
  converted: boolean;
};

type ReplayPlayback = {
  maxSeq: number;
  segmentCount: number;
  sessionEndTime: string | null;
  recordingActive: boolean;
  unavailableReason?: string;
};

type ReplayResponse = {
  sessionId: string;
  events: unknown[];
  playback: ReplayPlayback;
};

export default function BehaviorReplaysPage() {
  const [pick, setPick] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [replayLive, setReplayLive] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/sessions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/sessions?limit=40");
      return res.json() as Promise<SessionRow[]>;
    },
  });

  const sessionId = pick ?? (manual.trim() || null);

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Session replays</h1>
          <p className="text-sm text-muted-foreground">
            Video-style rrweb playback; live tail when the visitor is still active (same 3-minute window as Visitors).
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
          <CardDescription>Select a row to load replay events.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : <ul className="divide-y rounded-md border max-h-56 overflow-auto text-sm">
              {(sessions ?? []).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-muted/50 ${pick === s.sessionId ? "bg-muted" : ""}`}
                    onClick={() => setPick(s.sessionId)}
                  >
                    <span className="font-mono text-xs">{s.sessionId}</span>
                    <span className="text-muted-foreground ml-2">{s.device ?? "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Load by session id</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="sid">sessionId</Label>
          <Input id="sid" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="paste session id" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Replay</CardTitle>
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
              Session is in retention trash. Restore from{" "}
              <Link href="/admin/storage-retention" className="underline">
                Storage &amp; retention
              </Link>
              .
            </p>
          : null}
          <BehaviorRrwebPlayer events={events} live={liveTail} />
        </CardContent>
      </Card>
    </div>
  );
}
