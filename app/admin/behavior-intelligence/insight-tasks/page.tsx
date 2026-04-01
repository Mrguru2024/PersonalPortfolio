"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CrmAccount, GrowthInsightTask } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InsightTasksPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createShareWithClient, setCreateShareWithClient] = useState(false);
  const [createCrmAccountId, setCreateCrmAccountId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-intelligence/insight-tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-intelligence/insight-tasks?limit=100");
      return res.json() as Promise<{ tasks: GrowthInsightTask[] }>;
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/admin/crm/accounts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/accounts");
      if (!res.ok) return [] as CrmAccount[];
      return res.json() as Promise<CrmAccount[]>;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const acc =
        createShareWithClient && createCrmAccountId ? Number(createCrmAccountId) : undefined;
      if (createShareWithClient && (!acc || acc < 1)) {
        throw new Error("Pick a CRM account to share with the client portal.");
      }
      const res = await apiRequest("POST", "/api/admin/growth-intelligence/insight-tasks", {
        title: title.trim() || "Untitled insight",
        body: body.trim() || null,
        priority: "medium",
        visibleToClient: createShareWithClient && acc != null && acc > 0,
        clientCrmAccountId: createShareWithClient && acc != null && acc > 0 ? acc : null,
      });
      return res.json() as Promise<{ task: GrowthInsightTask }>;
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      setCreateShareWithClient(false);
      setCreateCrmAccountId("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-intelligence/insight-tasks"] });
    },
    onError: (e: Error) => {
      toast({ title: "Could not create task", description: e.message, variant: "destructive" });
    },
  });

  const patchMut = useMutation({
    mutationFn: async (p: {
      id: number;
      status?: string;
      visibleToClient?: boolean;
      clientCrmAccountId?: number | null;
    }) => {
      const { id, ...patch } = p;
      await apiRequest("PATCH", `/api/admin/growth-intelligence/insight-tasks/${id}`, patch);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/growth-intelligence/insight-tasks"] }),
    onError: (e: Error) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
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
          <div className="flex flex-col gap-3 rounded-lg border p-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <Switch
                id="create-share"
                checked={createShareWithClient}
                onCheckedChange={(v) => {
                  setCreateShareWithClient(v);
                  if (!v) setCreateCrmAccountId("");
                }}
              />
              <Label htmlFor="create-share" className="text-sm cursor-pointer">
                Show on client portal (Conversion Diagnostics workspace)
              </Label>
            </div>
            {createShareWithClient ?
              <div className="space-y-2 max-w-md">
                <Label className="text-xs">CRM account (required for client visibility)</Label>
                <Select value={createCrmAccountId || undefined} onValueChange={setCreateCrmAccountId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select account…" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name} (#{a.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            : null}
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
                  <div className="flex flex-col gap-3 w-full border-t pt-3 mt-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`vis-${t.id}`}
                          checked={!!t.visibleToClient}
                          disabled={patchMut.isPending}
                          onCheckedChange={(checked) => {
                            const fallback = accounts[0]?.id;
                            if (checked && !t.clientCrmAccountId && !fallback) {
                              toast({
                                title: "No CRM account",
                                description: "Create or select a CRM account before sharing with clients.",
                                variant: "destructive",
                              });
                              return;
                            }
                            patchMut.mutate({
                              id: t.id,
                              visibleToClient: checked,
                              clientCrmAccountId: checked ? (t.clientCrmAccountId ?? fallback ?? null) : null,
                            });
                          }}
                        />
                        <Label htmlFor={`vis-${t.id}`} className="text-xs text-muted-foreground cursor-pointer">
                          Client portal
                        </Label>
                      </div>
                      {t.visibleToClient ?
                        <Select
                          value={t.clientCrmAccountId ? String(t.clientCrmAccountId) : ""}
                          onValueChange={(v) =>
                            patchMut.mutate({
                              id: t.id,
                              visibleToClient: true,
                              clientCrmAccountId: Number(v),
                            })
                          }
                          disabled={patchMut.isPending}
                        >
                          <SelectTrigger className="w-[220px] h-8 text-xs">
                            <SelectValue placeholder="CRM account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={String(a.id)}>
                                {a.name} (#{a.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={t.status}
                    onValueChange={(v) => patchMut.mutate({ id: t.id, status: v })}
                    disabled={patchMut.isPending}
                  >
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
