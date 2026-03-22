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
import { Loader2, Inbox, RefreshCw, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DATA_VISIBILITY_LABELS,
  NOTE_RESOURCE_PRESETS,
  VISIBILITY_OVERRIDE_PRESETS,
  presetByValue,
} from "@/lib/growth-os/friendlyCopy";
import type { DataVisibilityTier } from "@shared/accessScope";

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

const NOTE_PRESET_VALUES = new Set(NOTE_RESOURCE_PRESETS.map((p) => p.value));
const OVERRIDE_PRESET_VALUES = new Set(VISIBILITY_OVERRIDE_PRESETS.map((p) => p.value));

export default function GrowthOsOverviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteBody, setNoteBody] = useState("");
  const [entityType, setEntityType] = useState("foundation");
  const [entityId, setEntityId] = useState("main");
  const [overrideType, setOverrideType] = useState("growth_report");
  const [overrideId, setOverrideId] = useState("quarterly-summary");
  const [overrideVisibility, setOverrideVisibility] = useState<DataVisibilityTier>("internal_only");

  const { data, isLoading, error, refetch, isFetching } = useQuery<BootstrapResponse>({
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

  const refreshOverview = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["/api/admin/growth-os/internal-notes"] }),
    ]);
    toast({ title: "Refreshed", description: "Modules and notes were reloaded." });
  };

  const fillNoteExampleIds = () => {
    const p = presetByValue(NOTE_RESOURCE_PRESETS, entityType);
    if (p) setEntityId(p.exampleId);
    else setEntityId("my-item-id");
    toast({ title: "Example id filled", description: "You can edit it to match your real record." });
  };

  const fillOverrideExampleIds = () => {
    const p = presetByValue(VISIBILITY_OVERRIDE_PRESETS, overrideType);
    if (p) {
      setOverrideId(p.exampleId);
      toast({ title: "Example id filled" });
    }
  };

  const resetFormsToSamples = () => {
    setEntityType("foundation");
    setEntityId("main");
    setOverrideType("growth_report");
    setOverrideId("quarterly-summary");
    setOverrideVisibility("internal_only");
    setNoteBody("");
    toast({ title: "Forms reset", description: "Sample values restored." });
  };

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/growth-os/internal-notes", {
        resourceType: entityType.trim(),
        resourceId: entityId.trim(),
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
      toast({
        title: "Note saved",
        description: "Visible to your team only — not exposed on client or public pages.",
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveOverride = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/growth-os/entity-visibility", {
        entityType: overrideType.trim(),
        entityId: overrideId.trim(),
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
      toast({ title: "Visibility saved", description: "This rule is stored for that item." });
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
          <CardTitle>Could not load this page</CardTitle>
          <CardDescription>{error instanceof Error ? error.message : "Unknown error"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const noteKindSelectValue = NOTE_PRESET_VALUES.has(entityType) ? entityType : "custom";
  const overrideKindSelectValue = OVERRIDE_PRESET_VALUES.has(overrideType) ? overrideType : "custom";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refreshOverview()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh data
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetFormsToSamples}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset sample fields
        </Button>
      </div>

      <Alert>
        <AlertTitle>What you can do on Overview</AlertTitle>
        <AlertDescription className="space-y-2 mt-2 text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Modules</span> lists every Growth OS feature area and
            its default privacy level. Use{" "}
            <span className="text-foreground font-medium">Team notes</span> to jot context only staff should see,
            tied to a specific item (pick a category and id below). Use{" "}
            <span className="text-foreground font-medium">Who can see this item</span> when you need to override
            the default for one report or diagnosis.
          </p>
          <p className="text-xs">
            Technical ids (like <code className="text-foreground">growth_report</code>) are still stored for the
            API — menus show plain-English names so you do not have to memorize them.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Modules in your workspace</CardTitle>
          <CardDescription>
            Each row is a feature area. The badge shows the default privacy level before any override.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Inbox className="h-10 w-10 mb-2 opacity-50" />
              <p>No modules registered yet. Run the database migration and reload.</p>
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
                    <div className="text-xs text-muted-foreground" title="Internal key for engineers">
                      Key: {m.moduleKey}
                    </div>
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
            <CardTitle>Team-only notes</CardTitle>
            <CardDescription className="space-y-2">
              <span className="inline-flex items-center gap-2 flex-wrap">
                <VisibilityBadge tier="internal_only" />
                Never shown to clients unless you copy them into a sanitized share yourself.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="note-kind">What are you noting?</Label>
                <Select
                  value={noteKindSelectValue}
                  onValueChange={(v) => {
                    if (v === "custom") {
                      setEntityType((prev) => (NOTE_PRESET_VALUES.has(prev) ? "" : prev));
                    } else {
                      setEntityType(v);
                      const p = presetByValue(NOTE_RESOURCE_PRESETS, v);
                      if (p) setEntityId(p.exampleId);
                    }
                  }}
                >
                  <SelectTrigger id="note-kind">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_RESOURCE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Other… (type below)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {presetByValue(NOTE_RESOURCE_PRESETS, entityType)?.hint ??
                    "Choose a preset or pick “Other” and type a short category name."}
                </p>
              </div>
              {!NOTE_PRESET_VALUES.has(entityType) ? (
                <div className="space-y-1">
                  <Label htmlFor="res-type-custom">Custom category (short name)</Label>
                  <Input
                    id="res-type-custom"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    placeholder="e.g. campaign_launch"
                    autoComplete="off"
                    list="gos-note-custom-suggestions"
                  />
                  <datalist id="gos-note-custom-suggestions">
                    <option value="campaign_brief" />
                    <option value="client_account" />
                    <option value="experiment" />
                  </datalist>
                </div>
              ) : null}
              <div className="space-y-1">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <Label htmlFor="res-id">Which item?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={fillNoteExampleIds}
                  >
                    Use example id
                  </Button>
                </div>
                <Input
                  id="res-id"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder={
                    presetByValue(NOTE_RESOURCE_PRESETS, entityType)?.exampleId
                      ? `e.g. ${presetByValue(NOTE_RESOURCE_PRESETS, entityType)!.exampleId}`
                      : "e.g. client-acme-jan or 128"
                  }
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Usually matches an id from a report, diagnosis, or Content Studio URL.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-body">Note</Label>
              <Textarea
                id="note-body"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={4}
                placeholder="Example: Follow up on Q2 goals — pricing page tests stalled. Not for the client email."
              />
            </div>
            <Button
              onClick={() => addNote.mutate()}
              disabled={!noteBody.trim() || !entityType.trim() || !entityId.trim() || addNote.isPending}
            >
              {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save team note
            </Button>
            <div className="text-sm text-muted-foreground border-t border-border pt-4">
              <p className="font-medium text-foreground mb-2">Notes for this item</p>
              {notesQuery.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (notesQuery.data?.notes?.length ?? 0) === 0 ? (
                <p>No notes yet for this category and id.</p>
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
            <CardTitle>Who can see this item?</CardTitle>
            <CardDescription>
              Override the default privacy for one specific report, diagnosis, or share record. Use when a
              client should (or should not) see that row.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="override-kind">Item type</Label>
              <Select
                value={overrideKindSelectValue}
                onValueChange={(v) => {
                  if (v === "custom") {
                    setOverrideType((prev) => (OVERRIDE_PRESET_VALUES.has(prev) ? "" : prev));
                  } else {
                    setOverrideType(v);
                    const p = presetByValue(VISIBILITY_OVERRIDE_PRESETS, v);
                    if (p) setOverrideId(p.exampleId);
                  }
                }}
              >
                <SelectTrigger id="override-kind">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OVERRIDE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Other… (type below)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {presetByValue(VISIBILITY_OVERRIDE_PRESETS, overrideType)?.hint ??
                  "Pick a preset or choose Other and type the internal category."}
              </p>
            </div>
            {!OVERRIDE_PRESET_VALUES.has(overrideType) ? (
              <div className="space-y-1">
                <Label htmlFor="override-type-custom">Custom type</Label>
                <Input
                  id="override-type-custom"
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value)}
                  placeholder="e.g. growth_report"
                  autoComplete="off"
                />
              </div>
            ) : null}
            <div className="space-y-1">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label htmlFor="override-id">Item id</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={fillOverrideExampleIds}
                >
                  Use example id
                </Button>
              </div>
              <Input
                id="override-id"
                value={overrideId}
                onChange={(e) => setOverrideId(e.target.value)}
                placeholder={
                  presetByValue(VISIBILITY_OVERRIDE_PRESETS, overrideType)?.exampleId
                    ? `e.g. ${presetByValue(VISIBILITY_OVERRIDE_PRESETS, overrideType)!.exampleId}`
                    : "e.g. quarterly-summary"
                }
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="override-vis">Visibility</Label>
              <Select
                value={overrideVisibility}
                onValueChange={(v) => setOverrideVisibility(v as DataVisibilityTier)}
              >
                <SelectTrigger id="override-vis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.dataVisibilityTiers.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DATA_VISIBILITY_LABELS[t as DataVisibilityTier] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {DATA_VISIBILITY_LABELS[overrideVisibility] ?? overrideVisibility}
              </p>
            </div>
            <Button
              onClick={() => saveOverride.mutate()}
              disabled={saveOverride.isPending || !overrideType.trim() || !overrideId.trim()}
            >
              {saveOverride.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save visibility
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
