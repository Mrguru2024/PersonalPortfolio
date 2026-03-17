"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FileText, Loader2, Save, CheckSquare, ListTodo, BookOpen } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["draft", "needs_clarification", "internal_review", "ready_to_write"];

export default function ProposalPrepWorkspacePage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["/api/admin/crm/proposal-prep", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/proposal-prep/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!id,
  });

  const contactId = workspace?.contactId;
  const { data: contact } = useQuery({
    queryKey: ["/api/admin/crm/contacts", contactId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${contactId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!contactId,
  });

  const { data: guidanceData } = useQuery({
    queryKey: ["/api/admin/crm/guidance/contact", contactId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/guidance/contact/${contactId}`);
      return res.ok ? res.json() : { guidance: {} };
    },
    enabled: !!contactId,
  });

  const { data: playbooksData } = useQuery<{ playbooks: Array<{ id: number; title: string; slug: string }> }>({
    queryKey: ["/api/admin/crm/playbooks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/playbooks");
      return res.ok ? res.json() : { playbooks: [] };
    },
  });

  const createTasksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/proposal-prep/${id}/create-tasks`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "timeline"] });
      toast({ title: "Tasks created from incomplete checklist items" });
    },
    onError: () => toast({ title: "Failed to create tasks", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/proposal-prep/${id}`, payload);
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/proposal-prep", id] });
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const updateField = (field: string, value: unknown) => {
    updateMutation.mutate({ [field]: value });
  };

  const toggleChecklistItem = (itemId: string) => {
    const list = workspace?.checklist ?? [];
    const next = list.map((item: { id: string; label: string; done: boolean }) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateMutation.mutate({ checklist: next });
  };

  if (isLoading || !workspace) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const proposalPrepGuidance = guidanceData?.guidance?.proposal_prep?.content as {
    likelyOfferDirection?: string;
    assumptionsRequiringValidation?: string[];
  } | undefined;

  const checklist = workspace.checklist ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={contactId ? `/admin/crm/proposal-prep?contactId=${contactId}` : "/admin/crm"}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proposal prep
                </CardTitle>
                <CardDescription className="mt-1">
                  {contact && <Link href={`/admin/crm/${contactId}`} className="hover:underline">{contact.name}</Link>}
                </CardDescription>
              </div>
              <Select value={workspace.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Offer direction</Label>
              <Input
                value={workspace.offerDirection ?? ""}
                onChange={(e) => updateField("offerDirection", e.target.value || null)}
                placeholder="e.g. Website redesign + funnel"
              />
            </div>
            <div>
              <Label>Readiness score (0–100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={workspace.proposalReadinessScore ?? ""}
                onChange={(e) => updateField("proposalReadinessScore", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Linked playbook</Label>
              <Select
                value={workspace.playbookId != null ? String(workspace.playbookId) : "none"}
                onValueChange={(v) => updateField("playbookId", v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(playbooksData?.playbooks ?? []).map((pb) => (
                    <SelectItem key={pb.id} value={String(pb.id)}>{pb.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workspace.playbookId != null && (
                <Button variant="link" className="p-0 h-auto mt-1 text-primary" asChild>
                  <Link href={`/admin/crm/playbooks/${workspace.playbookId}`}>View playbook →</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {proposalPrepGuidance && (proposalPrepGuidance.likelyOfferDirection || (proposalPrepGuidance.assumptionsRequiringValidation?.length ?? 0) > 0) && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">AI proposal prep (from guidance)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {proposalPrepGuidance.likelyOfferDirection && (
                <p><strong>Likely offer direction:</strong> {proposalPrepGuidance.likelyOfferDirection}</p>
              )}
              {(proposalPrepGuidance.assumptionsRequiringValidation?.length ?? 0) > 0 && (
                <p className="text-muted-foreground">Validate: {proposalPrepGuidance.assumptionsRequiringValidation!.join(", ")}</p>
              )}
            </CardContent>
          </Card>
        )}

        {workspace.aiSummary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">AI summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{workspace.aiSummary}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Scope & deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Scope summary</Label>
              <Textarea
                value={workspace.scopeSummary ?? ""}
                onChange={(e) => updateField("scopeSummary", e.target.value || null)}
                rows={3}
              />
            </div>
            <div>
              <Label>Deliverables draft</Label>
              <Textarea
                value={workspace.deliverablesDraft ?? ""}
                onChange={(e) => updateField("deliverablesDraft", e.target.value || null)}
                rows={3}
              />
            </div>
            <div>
              <Label>Assumptions</Label>
              <Textarea
                value={workspace.assumptions ?? ""}
                onChange={(e) => updateField("assumptions", e.target.value || null)}
                rows={2}
              />
            </div>
            <div>
              <Label>Exclusions</Label>
              <Textarea
                value={workspace.exclusions ?? ""}
                onChange={(e) => updateField("exclusions", e.target.value || null)}
                rows={2}
              />
            </div>
            <div>
              <Label>Pricing notes</Label>
              <Input
                value={workspace.pricingNotes ?? ""}
                onChange={(e) => updateField("pricingNotes", e.target.value || null)}
              />
            </div>
            <div>
              <Label>Timeline notes</Label>
              <Input
                value={workspace.timelineNotes ?? ""}
                onChange={(e) => updateField("timelineNotes", e.target.value || null)}
              />
            </div>
            <div>
              <Label>Risks</Label>
              <Textarea
                value={workspace.risks ?? ""}
                onChange={(e) => updateField("risks", e.target.value || null)}
                rows={2}
              />
            </div>
            <div>
              <Label>Dependencies</Label>
              <Textarea
                value={workspace.dependencies ?? ""}
                onChange={(e) => updateField("dependencies", e.target.value || null)}
                rows={2}
              />
            </div>
            <div>
              <Label>Cross-sell opportunities</Label>
              <Input
                value={workspace.crossSellOpportunities ?? ""}
                onChange={(e) => updateField("crossSellOpportunities", e.target.value || null)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Proposal checklist</CardTitle>
            <CardDescription>Required items before writing the proposal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {checklist.map((item: { id: string; label: string; done: boolean }) => (
                <li key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className="rounded border p-1"
                    aria-label={item.done ? "Mark undone" : "Mark done"}
                  >
                    {item.done ? <CheckSquare className="h-4 w-4 text-primary" /> : <span className="w-4 h-4 block border rounded" />}
                  </button>
                  <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                </li>
              ))}
            </ul>
            {checklist.some((item: { done: boolean }) => !item.done) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => createTasksMutation.mutate()}
                disabled={createTasksMutation.isPending}
              >
                {createTasksMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTodo className="h-4 w-4 mr-2" />}
                Create tasks from incomplete items
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
