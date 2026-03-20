"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { INTERNAL_CMS_CONTENT_TYPES, WORKFLOW_STATUSES } from "@/lib/content-studio/constants";

export default function ContentStudioDocumentEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [contentType, setContentType] = useState("blog_draft");
  const [workflowStatus, setWorkflowStatus] = useState("draft");
  const [visibility, setVisibility] = useState("internal_only");
  const [funnelStage, setFunnelStage] = useState("");
  const [offerSlug, setOfferSlug] = useState("");
  const [personaTags, setPersonaTags] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("none");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/content-studio/documents", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/content-studio/documents/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<{
        document: {
          title: string;
          bodyHtml: string;
          contentType: string;
          workflowStatus: string;
          visibility: string;
          funnelStage: string | null;
          offerSlug: string | null;
          personaTags: string[] | null;
          bodyMarkdown: string | null;
          approvalStatus: string;
        };
      }>;
    },
  });

  useEffect(() => {
    if (!data?.document) return;
    const d = data.document;
    setTitle(d.title);
    setBodyHtml(d.bodyHtml ?? "");
    setContentType(d.contentType);
    setWorkflowStatus(d.workflowStatus);
    setVisibility(d.visibility);
    setFunnelStage(d.funnelStage ?? "");
    setOfferSlug(d.offerSlug ?? "");
    setPersonaTags((d.personaTags ?? []).join(", "));
    setBodyMarkdown(d.bodyMarkdown ?? "");
    setApprovalStatus(d.approvalStatus ?? "none");
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (opts?: { triggerContentInsight?: boolean }) => {
      const res = await fetch(`/api/admin/content-studio/documents/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          bodyHtml,
          contentType,
          workflowStatus,
          visibility,
          funnelStage: funnelStage || null,
          offerSlug: offerSlug || null,
          personaTags: personaTags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bodyMarkdown: bodyMarkdown || null,
          approvalStatus,
          ...(opts?.triggerContentInsight ? { triggerContentInsight: true } : {}),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/documents"] });
      toast({
        title: "Saved",
        description: vars?.triggerContentInsight ? "Content insight queued (async)." : undefined,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const insightsQuery = useQuery({
    queryKey: ["growth-intelligence-insights", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/growth-os/intelligence/content/${id}/insights`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load insights");
      return res.json() as Promise<{
        runs: Array<{ id: number; status: string; providerMode: string; startedAt: string }>;
        suggestions: Array<{
          id: number;
          title: string;
          body: string;
          suggestionKind: string;
          reviewStatus: string;
          clientSafeExcerpt: string | null;
        }>;
      }>;
    },
    enabled: !!id && !!data?.document,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/growth-os/intelligence/content/${id}/analyze`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Analyze failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["growth-intelligence-insights", id] });
      toast({ title: "Insight run completed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reviewSuggestion = useMutation({
    mutationFn: async (input: { suggestionId: number; reviewStatus: string }) => {
      const res = await fetch(`/api/admin/growth-os/intelligence/suggestions/${input.suggestionId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: input.reviewStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["growth-intelligence-insights", id] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/content-studio/documents">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Library
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERNAL_CMS_CONTENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Workflow</Label>
              <Select value={workflowStatus} onValueChange={setWorkflowStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal_only">internal_only</SelectItem>
                  <SelectItem value="client_visible">client_visible</SelectItem>
                  <SelectItem value="public_visible">public_visible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Funnel stage</Label>
              <Input value={funnelStage} onChange={(e) => setFunnelStage(e.target.value)} placeholder="awareness / consideration…" />
            </div>
            <div className="space-y-1">
              <Label>Offer slug</Label>
              <Input value={offerSlug} onChange={(e) => setOfferSlug(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Personas (comma-separated)</Label>
              <Input value={personaTags} onChange={(e) => setPersonaTags(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Body (rich HTML)</Label>
            <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
          </div>
          <div className="space-y-1">
            <Label>Markdown (optional alternate)</Label>
            <Textarea
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              rows={6}
              className="font-mono text-sm"
              placeholder="# Optional markdown draft or notes"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate(undefined)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => saveMutation.mutate({ triggerContentInsight: true })}
              disabled={saveMutation.isPending}
            >
              Save + queue insight
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/content-studio/calendar")}>
              Open calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI content insights
          </CardTitle>
          <CardDescription>
            Internal scores and rationale stay in Growth OS APIs only. Client-safe excerpts are optional per
            suggestion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Run analysis now
            </Button>
          </div>
          {insightsQuery.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-2">Recent runs</p>
                <ul className="text-muted-foreground space-y-1">
                  {(insightsQuery.data?.runs ?? []).slice(0, 5).map((r) => (
                    <li key={r.id}>
                      #{r.id} · {r.status} · {r.providerMode} · {r.startedAt}
                    </li>
                  ))}
                  {(insightsQuery.data?.runs?.length ?? 0) === 0 ? <li>No runs yet.</li> : null}
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Suggestions (review)</p>
                <ul className="space-y-3">
                  {(insightsQuery.data?.suggestions ?? []).map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg border border-border/60 p-3 bg-muted/20 space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{s.title}</span>
                        <span className="text-xs text-muted-foreground">{s.suggestionKind}</span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {s.reviewStatus}
                        </span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{s.body}</p>
                      {s.clientSafeExcerpt ? (
                        <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-2">
                          Client-safe excerpt: {s.clientSafeExcerpt}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewSuggestion.isPending}
                          onClick={() =>
                            reviewSuggestion.mutate({ suggestionId: s.id, reviewStatus: "accepted" })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={reviewSuggestion.isPending}
                          onClick={() =>
                            reviewSuggestion.mutate({ suggestionId: s.id, reviewStatus: "dismissed" })
                          }
                        >
                          Dismiss
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
