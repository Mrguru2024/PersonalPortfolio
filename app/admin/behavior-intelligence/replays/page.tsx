"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

export default function BehaviorReplaysPage() {
  const [pick, setPick] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/sessions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/sessions?limit=40");
      return res.json() as Promise<SessionRow[]>;
    },
  });

  const sessionId = pick ?? (manual.trim() || null);

  const { data: replay, isFetching } = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/replays", sessionId],
    queryFn: async () => {
      if (!sessionId) return { sessionId: "", events: [] as unknown[] };
      const res = await apiRequest("GET", `/api/admin/behavior-intelligence/replays/${encodeURIComponent(sessionId)}`);
      return res.json() as Promise<{ sessionId: string; events: unknown[] }>;
    },
    enabled: !!sessionId && sessionId.length >= 8,
  });

  const events = useMemo(() => replay?.events ?? [], [replay?.events]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Session replays</h1>
          <p className="text-sm text-muted-foreground">rrweb payloads stored per session (admin only).</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
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
          {isFetching ? <CardDescription>Loading…</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <BehaviorRrwebPlayer events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
