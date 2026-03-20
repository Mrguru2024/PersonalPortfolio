"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Inbox } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BootstrapModule {
  id: number;
  moduleKey: string;
  displayName: string;
  description: string | null;
  defaultDataVisibility: string;
  minAdminAccessRole: string;
  active: boolean;
}

interface BootstrapResponse {
  accessRole: string;
  dataVisibilityTiers: string[];
  modules: BootstrapModule[];
}

export default function GrowthOsOverviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteBody, setNoteBody] = useState("");
  const [entityType, setEntityType] = useState("foundation");
  const [entityId, setEntityId] = useState("demo");
  const [overrideType, setOverrideType] = useState("growth_report");
  const [overrideId, setOverrideId] = useState("example-1");
  const [overrideVisibility, setOverrideVisibility] = useState("internal_only");

  const { data, isLoading, error } = useQuery<BootstrapResponse>({
    queryKey: ["/api/admin/growth-os/bootstrap"],
    queryFn: async () => {
      const res = await fetch("/api/admin/growth-os/bootstrap", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json();
    },
  });

  const notesQuery = useQuery({
    queryKey: ["/api/admin/growth-os/internal-notes", entityType, entityId],
    queryFn: async () => {
      const q = new URLSearchParams({ resourceType: entityType, resourceId: entityId });
      const res = await fetch(`/api/admin/growth-os/internal-notes?${q}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load notes");
      return res.json() as Promise<{ notes: { id: number; body: string; createdAt: string }[] }>;
    },
    enabled: !!data,
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/growth-os/internal-notes", {
        resourceType: entityType,
        resourceId: entityId,
        body: noteBody,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setNoteBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/growth-os/internal-notes"] });
      toast({ title: "Internal note saved", description: "Stored as internal_only." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveOverride = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/growth-os/entity-visibility", {
        entityType: overrideType,
        entityId: overrideId,
        visibility: overrideVisibility,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/growth-os/bootstrap"] });
      toast({ title: "Visibility override saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Could not load Growth OS</CardTitle>
          <CardDescription>{error instanceof Error ? error.message : "Unknown error"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Module registry</CardTitle>
          <CardDescription>
            Default visibility per module. Overrides appear in bootstrap payload and Security page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Inbox className="h-10 w-10 mb-2 opacity-50" />
              <p>No modules registered yet. Run DB push and reload.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border/60">
              {data.modules.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{m.displayName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.moduleKey}</div>
                    {m.description && (
                      <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                    )}
                  </div>
                  <VisibilityBadge tier={m.defaultDataVisibility} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Internal notes</CardTitle>
            <CardDescription>
              <VisibilityBadge tier="internal_only" className="mt-2" /> Never expose via client/public APIs
              without a sanitize layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="res-type">Resource type</Label>
                <Input
                  id="res-type"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="res-id">Resource id</Label>
                <Input id="res-id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-body">Note</Label>
              <Textarea
                id="note-body"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={4}
                placeholder="Internal team note — not visible to clients."
              />
            </div>
            <Button
              onClick={() => addNote.mutate()}
              disabled={!noteBody.trim() || addNote.isPending}
            >
              {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save internal note
            </Button>
            <div className="text-sm text-muted-foreground border-t border-border pt-4">
              <p className="font-medium text-foreground mb-2">Recent on this resource</p>
              {notesQuery.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (notesQuery.data?.notes?.length ?? 0) === 0 ? (
                <p>No notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notesQuery.data!.notes.map((n) => (
                    <li key={n.id} className="rounded-md bg-muted/40 p-2 text-foreground">
                      {n.body}
                      <div className="text-xs text-muted-foreground mt-1">{n.createdAt}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity visibility override</CardTitle>
            <CardDescription>
              Example override for a logical entity (report, asset, audit). Used by future export pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Entity type</Label>
              <Input value={overrideType} onChange={(e) => setOverrideType(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Entity id</Label>
              <Input value={overrideId} onChange={(e) => setOverrideId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Visibility</Label>
              <Select value={overrideVisibility} onValueChange={setOverrideVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.dataVisibilityTiers.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => saveOverride.mutate()} disabled={saveOverride.isPending}>
              {saveOverride.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save override
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
