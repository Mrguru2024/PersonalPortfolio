"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthInsightTask } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function InsightTasksPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-intelligence/insight-tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-intelligence/insight-tasks?limit=100");
      return res.json() as Promise<{ tasks: GrowthInsightTask[] }>;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/growth-intelligence/insight-tasks", {
        title: title.trim() || "Untitled insight",
        body: body.trim() || null,
        priority: "medium",
      });
      return res.json() as Promise<{ task: GrowthInsightTask }>;
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-intelligence/insight-tasks"] });
    },
  });

  const patchMut = useMutation({
    mutationFn: async (p: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/growth-intelligence/insight-tasks/${p.id}`, { status: p.status });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/growth-intelligence/insight-tasks"] }),
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insight tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Turn friction signals, replay notes, and diagnostics into owned work. Link experiments from the task row when you
          promote a test (
          <Link href="/admin/experiments" className="text-primary underline-offset-4 hover:underline">
            Experiments
          </Link>
          ).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New task
          </CardTitle>
          <CardDescription>Creates from an operator insight — attach evidence JSON later via API if needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dead clicks on mobile /pricing CTA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-body">Details</Label>
            <Textarea
              id="task-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Replay id, page path, heatmap link, owner…"
            />
          </div>
          <Button type="button" disabled={createMut.isPending} onClick={() => createMut.mutate()}>
            {createMut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Create task"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ?
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          : tasks.length === 0 ?
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          : tasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border p-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{t.title}</span>
                    <Badge variant="outline">{t.priority}</Badge>
                    <Badge variant="secondary">{t.status}</Badge>
                  </div>
                  {t.body ?
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.body}</p>
                  : null}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {t.pagePath ?
                      <span>
                        Page: <code className="bg-muted px-1 rounded">{t.pagePath}</code>
                      </span>
                    : null}
                    {t.behaviorSessionKey ?
                      <span>
                        Session: <code className="bg-muted px-1 rounded">{t.behaviorSessionKey}</code>
                      </span>
                    : null}
                    {t.heatmapPage ?
                      <Link className="text-primary hover:underline" href={`/admin/behavior-intelligence/heatmaps?page=${encodeURIComponent(t.heatmapPage)}`}>
                        Heatmap
                      </Link>
                    : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={t.status} onValueChange={(v) => patchMut.mutate({ id: t.id, status: v })}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">open</SelectItem>
                      <SelectItem value="in_progress">in_progress</SelectItem>
                      <SelectItem value="done">done</SelectItem>
                      <SelectItem value="cancelled">cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
