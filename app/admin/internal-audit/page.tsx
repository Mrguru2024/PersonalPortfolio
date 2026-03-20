"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AuditRunRow {
  id: number;
  projectKey: string;
  label: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  summaryJson: Record<string, unknown> | null;
}

export default function InternalAuditDashboardPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [projectKey, setProjectKey] = useState("ascendra_main");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/internal-audit/runs", projectKey, statusFilter],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("projectKey", projectKey);
      if (statusFilter !== "all") q.set("status", statusFilter);
      const res = await fetch(`/api/admin/internal-audit/runs?${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load runs");
      return res.json() as Promise<{ runs: AuditRunRow[] }>;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/internal-audit/runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey, execute: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Run failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/internal-audit/runs"] });
      toast({ title: "Audit completed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run audit</CardTitle>
          <CardDescription>
            Executes a fresh pass across DB signals + repo path checks. Prior runs remain for comparison.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Project key</Label>
            <Input value={projectKey} onChange={(e) => setProjectKey(e.target.value)} className="w-56" />
          </div>
          <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            Run now
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Filter by status; open a run for category / path filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Label className="shrink-0">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <div className="rounded-lg border border-border/60 divide-y">
              {(data?.runs ?? []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No runs yet.</p>
              ) : (
                data!.runs.map((r) => {
                  const overall = (r.summaryJson as { overallScore?: number } | null)?.overallScore;
                  return (
                    <div
                      key={r.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <div className="font-medium flex flex-wrap items-center gap-2">
                          {r.label ?? `Run #${r.id}`}
                          <Badge variant="secondary">{r.status}</Badge>
                          {overall != null && <Badge variant="outline">Score {overall}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {r.projectKey} · started {format(new Date(r.startedAt), "PPp")}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/internal-audit/${r.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
