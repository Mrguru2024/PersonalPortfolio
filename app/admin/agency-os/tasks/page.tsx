"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { AosAgencyTask } from "@shared/schema";
import { AdminDevOnly, useIsAdminSuperUser } from "@/components/admin/AdminDevOnly";
import { cn } from "@/lib/utils";

const VALUE_OPTS = [
  { id: "leads", label: "Leads" },
  { id: "conversions", label: "Conversions" },
  { id: "revenue", label: "Revenue" },
  { id: "retention", label: "Retention" },
  { id: "efficiency", label: "Efficiency" },
  { id: "visibility", label: "Visibility" },
  { id: "training", label: "Training" },
] as const;

export default function AgencyOsTasksPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const superAdmin = useIsAdminSuperUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get("projectId");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [understanding, setUnderstanding] = useState(false);
  const [responsibility, setResponsibility] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [clarifyMsg, setClarifyMsg] = useState("");

  const [title, setTitle] = useState("");
  const [primaryHvd, setPrimaryHvd] = useState("conversion_funnel");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [impactMetric, setImpactMetric] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [values, setValues] = useState<Record<string, boolean>>({
    leads: true,
    conversions: false,
    revenue: false,
    retention: false,
    efficiency: false,
    visibility: false,
    training: false,
  });

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.id != null) {
      setAssigneeId(String(user.id));
    }
  }, [user?.id]);

  const { data: configData } = useQuery({
    queryKey: ["/api/admin/agency-os/config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load config");
      return res.json() as Promise<{ adminTaskAcceptanceAllowed: boolean }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/tasks", projectIdFilter ?? ""],
    queryFn: async () => {
      const u = new URL("/api/admin/agency-os/tasks", window.location.origin);
      if (projectIdFilter) u.searchParams.set("projectId", projectIdFilter);
      const res = await fetch(u.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json() as Promise<{ tasks: AosAgencyTask[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const vc = (Object.entries(values).filter(([, v]) => v).map(([k]) => k) ?? []) as string[];
      if (vc.length === 0) throw new Error("Select at least one value contribution.");
      const aid = Number.parseInt(assigneeId, 10);
      if (!Number.isFinite(aid)) throw new Error("Assignee user ID must be a number.");
      const proj = projectIdFilter ? Number.parseInt(projectIdFilter, 10) : NaN;
      const res = await fetch("/api/admin/agency-os/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          primaryHvdSlug: primaryHvd.trim(),
          secondaryHvdSlugs: [],
          valueContributions: vc,
          expectedOutcome: expectedOutcome.trim(),
          impactMetric: impactMetric.trim(),
          expectedOutput: expectedOutput.trim() || null,
          description: description.trim() || null,
          assigneeUserId: aid,
          projectId: Number.isFinite(proj) ? proj : null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown };
      if (!res.ok) throw new Error(j.error ?? `Create failed (${res.status})`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/tasks"] });
      setTitle("");
      setDescription("");
      setExpectedOutcome("");
      setImpactMetric("");
      setExpectedOutput("");
      toast({ title: "Task created", description: "Awaiting acceptance." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const acceptanceMut = useMutation({
    mutationFn: async (input: {
      taskId: number;
      action: "accept" | "decline" | "clarify";
    }) => {
      let body: Record<string, unknown>;
      if (input.action === "accept") {
        body = {
          action: "accept",
          understandingConfirmed: understanding,
          responsibilityConfirmed: responsibility,
        };
      } else if (input.action === "decline") {
        body = { action: "decline", declineReason: declineReason.trim() };
      } else {
        body = { action: "clarify", clarificationMessage: clarifyMsg.trim() };
      }
      const res = await fetch(`/api/admin/agency-os/tasks/${input.taskId}/acceptance`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/tasks"] });
      setExpandedId(null);
      setUnderstanding(false);
      setResponsibility(false);
      setDeclineReason("");
      setClarifyMsg("");
      toast({
        title: vars.action === "accept" ? "Accepted" : vars.action === "decline" ? "Declined" : "Clarification sent",
      });
    },
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

  const tasks = tasksData?.tasks ?? [];
  const myId = typeof user?.id === "number" ? user.id : Number(user?.id);
  const adminAccept = !!configData?.adminTaskAcceptanceAllowed;
  const canRespondToAcceptance = (assigneeUserId: number | null) =>
    (assigneeUserId != null && Number.isFinite(myId) && assigneeUserId === myId) || adminAccept;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tasks & acceptance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          By default only the <strong className="text-foreground">assignee</strong> may accept, decline, or clarify. Enable{" "}
          <code className="text-xs">AGENCY_OS_ADMIN_TASK_ACCEPTANCE=1</code> so any approved admin can override. API:{" "}
          <code className="text-xs">POST /api/admin/agency-os/tasks/[id]/acceptance</code>.{" "}
          <Link href="/admin/agency-os/hvd" className="text-primary underline">
            HVD registry
          </Link>
        </p>
        {projectIdFilter && (
          <p className="text-sm text-muted-foreground mt-2">
            Filtered to project #{projectIdFilter}.{" "}
            <Link href="/admin/agency-os/tasks" className="text-primary underline">
              Show all tasks
            </Link>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New task</CardTitle>
          <CardDescription>
            {superAdmin ?
              "Creates a task in pending acceptance with assignment + HVD fields (validated)."
            : "Creates a task for someone to accept. They confirm understanding before work starts."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Primary HVD slug</Label>
            <Input
              value={primaryHvd}
              onChange={(e) => setPrimaryHvd(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className={superAdmin ? "font-mono text-sm" : "text-sm"}
            />
          </div>
          <div className="space-y-2">
            <Label>Value contributions</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VALUE_OPTS.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={values[o.id]}
                    onCheckedChange={(c) => setValues((v) => ({ ...v, [o.id]: c === true }))}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Expected outcome</Label>
            <Textarea value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Impact metric</Label>
            <Textarea value={impactMetric} onChange={(e) => setImpactMetric(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Expected output (optional)</Label>
            <Textarea value={expectedOutput} onChange={(e) => setExpectedOutput(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <AdminDevOnly
            fallback={
              <p className="text-xs text-muted-foreground">
                New tasks assign to you. To route to another admin, ask a super admin to create the task or adjust assignment.
              </p>
            }
          >
            <div className="space-y-1.5">
              <Label>Assignee user ID</Label>
              <Input value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Defaults to your user id; change to route to another admin.</p>
            </div>
          </AdminDevOnly>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create task"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet. Create one above.</p>
          )}
          {tasks.map((t) => (
            <div key={t.id} className="rounded-lg border border-border/80 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className={cn("text-xs text-muted-foreground mt-0.5", superAdmin && "font-mono")}>
                    {superAdmin ?
                      <>HVD: {t.primaryHvdSlug} · assignee #{t.assigneeUserId}</>
                    : <>
                        Step: {t.primaryHvdSlug}
                        {typeof t.assigneeUserId === "number" &&
                        typeof myId === "number" &&
                        t.assigneeUserId === myId ?
                          " · Assigned to you"
                        : " · Assigned to a teammate"}
                      </>}
                  </p>
                </div>
                <Badge variant={t.status === "pending_acceptance" ? "secondary" : "outline"}>{t.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t.expectedOutcome}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                  {expandedId === t.id ? "Hide" : "Accept / decline / clarify"}
                </Button>
              </div>
              {expandedId === t.id && t.status === "pending_acceptance" && (
                <div className="space-y-4 pt-2 border-t border-border/60">
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Impact metric:</span> {t.impactMetric}
                    </p>
                    {t.expectedOutput && (
                      <p>
                        <span className="text-muted-foreground">Expected output:</span> {t.expectedOutput}
                      </p>
                    )}
                  </div>
                  {canRespondToAcceptance(t.assigneeUserId ?? null) ? (
                    <>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={understanding} onCheckedChange={(c) => setUnderstanding(c === true)} />
                          I understand the purpose and scope
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={responsibility} onCheckedChange={(c) => setResponsibility(c === true)} />
                          I take responsibility for delivery
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => acceptanceMut.mutate({ taskId: t.id, action: "accept" })}
                          disabled={acceptanceMut.isPending}
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => acceptanceMut.mutate({ taskId: t.id, action: "decline" })}
                          disabled={acceptanceMut.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => acceptanceMut.mutate({ taskId: t.id, action: "clarify" })}
                          disabled={acceptanceMut.isPending}
                        >
                          <HelpCircle className="h-3.5 w-3.5" /> Clarify
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Decline reason</Label>
                          <Input value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Clarification message</Label>
                          <Input value={clarifyMsg} onChange={(e) => setClarifyMsg(e.target.value)} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground rounded-md border border-border/80 bg-muted/30 px-3 py-2">
                      {superAdmin ?
                        <>
                          Only assignee user #{t.assigneeUserId} can respond while strict mode is on. Set{" "}
                          <code className="text-xs">AGENCY_OS_ADMIN_TASK_ACCEPTANCE=1</code> in the environment so any
                          approved admin can accept on their behalf.
                        </>
                      : "Only the assigned teammate can respond while strict mode is on. A super admin can allow broader acceptance in server settings."}
                    </p>
                  )}
                </div>
              )}
              {expandedId === t.id && t.status !== "pending_acceptance" && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
                  Acceptance already resolved ({t.status}).
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
