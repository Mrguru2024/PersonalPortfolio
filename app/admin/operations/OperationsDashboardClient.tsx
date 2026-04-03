"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { apiRequest } from "@/lib/queryClient";
import type {
  CaseStudyWorkflowItem,
  DiagnosticActivityRow,
  LeadSnapshotItem,
  OperationsDashboardPayload,
  OperationsQuickAction,
  PublishingQueueItem,
} from "@/lib/operations-dashboard/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/admin/operations-dashboard/DashboardHeader";
import { QuickActionCards } from "@/components/admin/operations-dashboard/QuickActionCards";
import { StatCards } from "@/components/admin/operations-dashboard/StatCards";
import { DiagnosticsTable } from "@/components/admin/operations-dashboard/DiagnosticsTable";
import { CaseStudyList } from "@/components/admin/operations-dashboard/CaseStudyList";
import { PublishingPanel } from "@/components/admin/operations-dashboard/PublishingPanel";
import { LeadPanel } from "@/components/admin/operations-dashboard/LeadPanel";
import { AIActionPanel } from "@/components/admin/operations-dashboard/AIActionPanel";
import { ContentHealthPanel } from "@/components/admin/operations-dashboard/ContentHealthPanel";

function trackAction(
  track: ReturnType<typeof useVisitorTracking>["track"],
  action: string,
  section: string,
  metadata?: Record<string, unknown>,
) {
  track("cta_click", {
    pageVisited: "/admin/operations",
    section,
    metadata: { action, ...metadata },
  });
}

export function OperationsDashboardClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { track } = useVisitorTracking();
  const [statusOverrides, setStatusOverrides] = useState<Record<number, "published" | "draft">>({});

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.isAdmin || !user.adminApproved) return;
    track("page_view", {
      pageVisited: "/admin/operations",
      section: "operations_dashboard",
      metadata: { dashboard: "ascendra_operations_dashboard" },
    });
  }, [track, user?.isAdmin, user?.adminApproved]);

  const dashboardQuery = useQuery<OperationsDashboardPayload>({
    queryKey: ["/api/admin/operations-dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/operations-dashboard");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const updateDocumentStatusMutation = useMutation({
    mutationFn: async (input: { id: number; nextStatus: "published" | "draft" }) => {
      await apiRequest("PATCH", `/api/admin/content-studio/documents/${input.id}`, {
        workflowStatus: input.nextStatus,
      });
      if (input.nextStatus === "published") {
        await apiRequest("POST", "/api/admin/content-studio/publish/manual", {
          documentId: input.id,
          platform: "manual",
        }).catch(() => null);
      }
    },
    onMutate: (variables) => {
      setStatusOverrides((prev) => ({ ...prev, [variables.id]: variables.nextStatus }));
      return variables;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      toast({
        title: variables.nextStatus === "published" ? "Item published" : "Item unpublished",
      });
    },
    onError: (error: Error, variables) => {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      toast({
        title: "Could not update publish status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const duplicateDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const existingRes = await apiRequest("GET", `/api/admin/content-studio/documents/${id}`);
      const existing = (await existingRes.json()) as {
        document: {
          contentType: string;
          title: string;
          bodyHtml: string;
          bodyMarkdown: string | null;
          excerpt: string | null;
          tags: string[] | null;
          categories: string[] | null;
          personaTags: string[] | null;
          funnelStage: string | null;
          offerSlug: string | null;
          leadMagnetSlug: string | null;
          campaignId: number | null;
          projectKey: string;
          platformTargets: string[] | null;
          visibility: string;
        };
      };

      const createRes = await apiRequest("POST", "/api/admin/content-studio/documents", {
        contentType: existing.document.contentType,
        title: `${existing.document.title} (Copy)`,
        bodyHtml: existing.document.bodyHtml ?? "",
        bodyMarkdown: existing.document.bodyMarkdown ?? null,
        excerpt: existing.document.excerpt ?? null,
        tags: existing.document.tags ?? [],
        categories: existing.document.categories ?? [],
        personaTags: existing.document.personaTags ?? [],
        funnelStage: existing.document.funnelStage ?? null,
        offerSlug: existing.document.offerSlug ?? null,
        leadMagnetSlug: existing.document.leadMagnetSlug ?? null,
        campaignId: existing.document.campaignId ?? null,
        projectKey: existing.document.projectKey ?? "ascendra_main",
        platformTargets: existing.document.platformTargets ?? [],
        workflowStatus: "draft",
        visibility: existing.document.visibility ?? "internal_only",
      });
      return (await createRes.json()) as { document: { id: number } };
    },
    onSuccess: ({ document }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      toast({ title: "Case study duplicated" });
      router.push(`/admin/content-studio/documents/${document.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Could not duplicate case study", description: error.message, variant: "destructive" });
    },
  });

  const createFollowUpMutation = useMutation({
    mutationFn: async (input: { contactId: number; title: string; description: string }) => {
      await apiRequest("POST", "/api/admin/crm/tasks", {
        contactId: input.contactId,
        type: "follow_up",
        title: input.title,
        description: input.description,
        priority: "high",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/operations-dashboard"] });
      toast({ title: "Follow-up task created" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not create follow-up task", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user.isAdmin || !user.adminApproved) return null;

  const payload = dashboardQuery.data;
  const followUpPendingContactId = createFollowUpMutation.isPending
    ? createFollowUpMutation.variables?.contactId ?? null
    : null;
  const displayCaseStudies = useMemo(() => {
    if (!payload) return [];
    return payload.caseStudies.map((item) => ({
      ...item,
      workflowStatus: statusOverrides[item.id] ?? item.workflowStatus,
    }));
  }, [payload, statusOverrides]);
  const displayPublishingQueue = useMemo(() => {
    if (!payload) return [];
    return payload.publishingQueue.map((item) => ({
      ...item,
      workflowStatus: statusOverrides[item.id] ?? item.workflowStatus,
    }));
  }, [payload, statusOverrides]);

  return (
    <div className="min-h-screen w-full min-w-0 max-w-7xl mx-auto px-3 fold:px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DashboardHeader
          title="Ascendra Operations Dashboard"
          context="Manage diagnostics, proof assets, publishing, and lead activity from one place."
          description="Everything you need to track, improve, and convert your business systems — in one place."
          subtext="Review diagnostics, build proof, and turn insights into revenue."
          generatedAt={payload?.generatedAt}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            trackAction(track, "refresh_dashboard", "header");
            dashboardQuery.refetch();
          }}
          disabled={dashboardQuery.isFetching}
        >
          {dashboardQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {dashboardQuery.isLoading && !payload ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {dashboardQuery.error ? (
        <p className="text-sm text-destructive">Could not load operations data. Try refreshing.</p>
      ) : null}

      {payload ? (
        <>
          <QuickActionCards
            actions={payload.quickActions}
            onActionClick={(action: OperationsQuickAction) => {
              trackAction(track, action.key, "quick_actions", { href: action.href });
            }}
          />

          <StatCards summary={payload.summary} />

          <DiagnosticsTable
            diagnostics={payload.diagnostics}
            followUpPendingContactId={followUpPendingContactId}
            onAction={(action: string, row: DiagnosticActivityRow) => {
              const event = action === "view_breakdown" ? "diagnostic_review_click" : action;
              trackAction(track, event, "diagnostics", { diagnosticId: row.id, kind: row.kind });
            }}
            onMarkFollowUp={(row: DiagnosticActivityRow) => {
              if (!row.crmContactId) return;
              createFollowUpMutation.mutate({
                contactId: row.crmContactId,
                title: `Follow up diagnostic: ${row.businessType}`,
                description: `Diagnostic score ${row.score ?? "n/a"} · ${row.recommendedSystem}`,
              });
            }}
          />

          <CaseStudyList
            caseStudies={displayCaseStudies}
            onAction={(action: string, item: CaseStudyWorkflowItem) => {
              trackAction(track, action, "case_study_pipeline", { documentId: item.id });
            }}
            onPublishToggle={(item: CaseStudyWorkflowItem, nextStatus: "published" | "draft") => {
              trackAction(track, nextStatus === "published" ? "publish_action" : "unpublish_action", "case_study_pipeline", {
                documentId: item.id,
              });
              updateDocumentStatusMutation.mutate({ id: item.id, nextStatus });
            }}
            onDuplicate={(item: CaseStudyWorkflowItem) => {
              duplicateDocumentMutation.mutate(item.id);
            }}
          />

          <PublishingPanel
            items={displayPublishingQueue}
            onAction={(action: string, item: PublishingQueueItem) => {
              const trackedAction =
                action === "publish_item" || action === "unpublish_item" ? "publish_action" : action;
              trackAction(track, trackedAction, "publishing_queue", { documentId: item.id, status: item.workflowStatus });
            }}
            onPublishToggle={(item: PublishingQueueItem, nextStatus: "published" | "draft") => {
              updateDocumentStatusMutation.mutate({ id: item.id, nextStatus });
            }}
          />

          <LeadPanel
            leads={payload.leads}
            followUpPendingContactId={followUpPendingContactId}
            onAction={(action: string, lead: LeadSnapshotItem) => {
              trackAction(track, action, "lead_snapshot", { contactId: lead.contactId });
            }}
            onStartFollowUp={(lead: LeadSnapshotItem) => {
              createFollowUpMutation.mutate({
                contactId: lead.contactId,
                title: `Follow up lead: ${lead.leadName}`,
                description: `Opportunity ${lead.opportunity} · Source ${lead.source}`,
              });
            }}
          />

          <AIActionPanel
            actions={payload.aiActions}
            onActionClick={(action) => {
              trackAction(track, action.key, "ai_tools", { href: action.href });
            }}
          />

          <ContentHealthPanel summary={payload.contentHealth} />
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-background">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary shrink-0" aria-hidden />
                Client growth guarantees
              </CardTitle>
              <CardDescription>
                Guarantee control panel and sales preview calculator live under{" "}
                <strong className="text-foreground">Growth OS</strong> with revenue ops, bookings, and lead intake — the
                same client-outcome thread as the portal dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="default" className="min-h-[44px]">
                <Link href="/admin/growth-os/guarantees">Open guarantee center</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
