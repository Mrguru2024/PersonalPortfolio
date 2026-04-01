"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type {
  AosAgencyProject,
  AosAgencyTask,
  AosDeliveryMilestone,
  AosProjectPhase,
} from "@shared/schema";

type ProjectDetail = {
  project: AosAgencyProject;
  phases: AosProjectPhase[];
  milestones: AosDeliveryMilestone[];
  tasks: AosAgencyTask[];
};

export default function AgencyOsProjectDetailPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const idRaw = params?.id as string;
  const projectId = Number.parseInt(idRaw, 10);

  const [phaseName, setPhaseName] = useState("");
  const [msName, setMsName] = useState("");
  const [msPhaseId, setMsPhaseId] = useState<string>("none");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/projects", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/agency-os/projects/${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load project");
      return res.json() as Promise<ProjectDetail>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && Number.isFinite(projectId),
  });

  const patchProject = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/agency-os/projects/${projectId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Update failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/projects", projectId] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/projects"] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addPhase = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/agency-os/projects/${projectId}/phases`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: phaseName.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/projects", projectId] });
      setPhaseName("");
      toast({ title: "Phase added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addMilestone = useMutation({
    mutationFn: async () => {
      const body = {
        name: msName.trim(),
        phaseId: msPhaseId === "none" ? null : Number.parseInt(msPhaseId, 10),
      };
      const res = await fetch(`/api/admin/agency-os/projects/${projectId}/milestones`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/projects", projectId] });
      setMsName("");
      toast({ title: "Milestone added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const patchMilestone = useMutation({
    mutationFn: async (vars: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/agency-os/milestones/${vars.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: vars.status }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/projects", projectId] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
        {authLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </span>
        ) : (
          "Redirecting…"
        )}
      </div>
    );
  }

  if (!Number.isFinite(projectId)) {
    return <p className="text-sm text-destructive">Invalid project id.</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { project, phases, milestones, tasks } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            <Link href="/admin/agency-os/projects" className="underline">
              Projects
            </Link>
          </p>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{project.primaryHvdSlug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/agency-os/tasks?projectId=${project.id}`}>Tasks for this project</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status & health</CardTitle>
          <CardDescription>Quick patch—full financial links stay on the API.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={project.status}
              onValueChange={(v) => patchProject.mutate({ status: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["draft", "planning", "active", "on_hold", "completed", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Health</Label>
            <Select
              value={project.health ?? "on_track"}
              onValueChange={(v) => patchProject.mutate({ health: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_track">on_track</SelectItem>
                <SelectItem value="at_risk">at_risk</SelectItem>
                <SelectItem value="blocked">blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Progress %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              className="w-24"
              defaultValue={project.progressPercent}
              onBlur={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(n)) patchProject.mutate({ progressPercent: n });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Narrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-3xl">
          <p className="text-sm text-muted-foreground">{project.description ?? "—"}</p>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Expected outcome: </span>
              {project.expectedOutcome}
            </div>
            <div>
              <span className="text-muted-foreground">Impact metric: </span>
              {project.impactMetric}
            </div>
            <div>
              <span className="text-muted-foreground">Data source: </span>
              {project.dataSource}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {phases.length === 0 && <li className="text-muted-foreground">No phases yet.</li>}
            {phases.map((ph) => (
              <li key={ph.id}>
                <span className="font-medium">{ph.name}</span>
                {ph.description ? (
                  <span className="text-muted-foreground"> — {ph.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 items-end max-w-lg">
            <div className="flex-1 min-w-[160px] space-y-1">
              <Label>New phase name</Label>
              <Input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => addPhase.mutate()} disabled={addPhase.isPending || !phaseName.trim()}>
              Add phase
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {milestones.length === 0 && <li className="text-sm text-muted-foreground">No milestones yet.</li>}
            {milestones.map((m) => (
              <li key={m.id} className="rounded-md border border-border/80 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{m.name}</span>
                  <Badge variant="outline">{m.status}</Badge>
                </div>
                <Select
                  value={m.status}
                  onValueChange={(v) => patchMilestone.mutate({ id: m.id, status: v })}
                >
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Set status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["pending", "in_progress", "done", "skipped"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 max-w-lg">
            <div className="space-y-1">
              <Label>New milestone</Label>
              <Input value={msName} onChange={(e) => setMsName(e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phase (optional)</Label>
              <Select value={msPhaseId} onValueChange={setMsPhaseId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {phases.map((ph) => (
                    <SelectItem key={ph.id} value={String(ph.id)}>
                      {ph.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={() => addMilestone.mutate()} disabled={addMilestone.isPending || !msName.trim()}>
              Add milestone
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks ({tasks.length})</CardTitle>
          <CardDescription>Task board lives on Tasks; filtered by this project id.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks linked.</p>}
          {tasks.slice(0, 8).map((t) => (
            <div key={t.id} className="text-sm flex flex-wrap gap-2">
              <span className="font-medium">{t.title}</span>
              <Badge variant="secondary">{t.status}</Badge>
            </div>
          ))}
          {tasks.length > 8 && (
            <Button asChild variant="link" className="px-0 h-auto text-sm">
              <Link href={`/admin/agency-os/tasks?projectId=${project.id}`}>View all ({tasks.length})</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
