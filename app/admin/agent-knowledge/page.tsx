"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type KnowledgeEntry = {
  id: number;
  userId: number;
  title: string;
  body: string;
  useInAgent: boolean;
  useInResearch: boolean;
  useInMessages: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminAgentKnowledgePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [useInAgent, setUseInAgent] = useState(true);
  const [useInResearch, setUseInResearch] = useState(true);
  const [useInMessages, setUseInMessages] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const listQuery = useQuery({
    queryKey: ["/api/admin/agent/knowledge"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/agent/knowledge");
      const data = (await res.json()) as { entries: KnowledgeEntry[] };
      return data.entries;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/agent/knowledge", {
        title: title.trim(),
        body: body.trim(),
        useInAgent,
        useInResearch,
        useInMessages,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      setUseInAgent(true);
      setUseInResearch(true);
      setUseInMessages(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent/knowledge"] });
      toast({ title: "Knowledge entry saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const patchMutation = useMutation({
    mutationFn: async (vars: { id: number; patch: Partial<Pick<KnowledgeEntry, "title" | "body" | "useInAgent" | "useInResearch" | "useInMessages">> }) => {
      const res = await apiRequest("PATCH", `/api/admin/agent/knowledge/${vars.id}`, vars.patch);
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent/knowledge"] });
      toast({ title: "Updated" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/agent/knowledge/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agent/knowledge"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <BookOpen className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assistant knowledge base</h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Add notes, positioning, and internal facts. Toggle where each entry is allowed: <strong>Use in assistant</strong> injects trusted context into the floating mentor (commands, media, and prompts). <strong>Use in research</strong> adds deeper notes into the same assistant for reasoning and suggestions. <strong>Use in messages</strong> allows newsletter and similar AI copy flows to reference your wording (when that flow loads knowledge). Keep spellings accurate—the model treats this as source of truth.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New entry</CardTitle>
            <CardDescription>Short title plus detailed body. Keep facts accurate; the model treats this as trusted context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q2 offer positioning"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-body">Notes</Label>
              <Textarea
                id="kb-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Facts, tone, pricing bands, process…"
                rows={6}
                className="min-h-[120px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2">
                <Label htmlFor="kb-agent" className="text-sm cursor-pointer">
                  Use in assistant
                </Label>
                <Switch id="kb-agent" checked={useInAgent} onCheckedChange={setUseInAgent} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2">
                <Label htmlFor="kb-research" className="text-sm cursor-pointer">
                  Use in research
                </Label>
                <Switch id="kb-research" checked={useInResearch} onCheckedChange={setUseInResearch} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2">
                <Label htmlFor="kb-msg" className="text-sm cursor-pointer">
                  Use in messages
                </Label>
                <Switch id="kb-msg" checked={useInMessages} onCheckedChange={setUseInMessages} />
              </div>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || !body.trim() || createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add entry
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your entries</h2>
          {listQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : listQuery.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet. Add one above.</p>
          ) : (
            <ul className="space-y-4 list-none p-0 m-0">
              {listQuery.data?.map((e) => (
                <li key={e.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <CardTitle className="text-base font-semibold">{e.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        aria-label="Delete entry"
                        onClick={() => deleteMutation.mutate(e.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      defaultValue={e.body}
                      rows={5}
                      className="text-sm"
                      onBlur={(ev) => {
                        const next = ev.target.value.trim();
                        if (next && next !== e.body) {
                          patchMutation.mutate({ id: e.id, patch: { body: next } });
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={e.useInAgent}
                          onCheckedChange={(v) => patchMutation.mutate({ id: e.id, patch: { useInAgent: v } })}
                          id={`agent-${e.id}`}
                        />
                        <Label htmlFor={`agent-${e.id}`} className="text-sm cursor-pointer">
                          Assistant
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={e.useInResearch}
                          onCheckedChange={(v) => patchMutation.mutate({ id: e.id, patch: { useInResearch: v } })}
                          id={`research-${e.id}`}
                        />
                        <Label htmlFor={`research-${e.id}`} className="text-sm cursor-pointer">
                          Research
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={e.useInMessages}
                          onCheckedChange={(v) => patchMutation.mutate({ id: e.id, patch: { useInMessages: v } })}
                          id={`msg-${e.id}`}
                        />
                        <Label htmlFor={`msg-${e.id}`} className="text-sm cursor-pointer">
                          Messages
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
