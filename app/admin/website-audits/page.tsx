"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ExternalLink,
  Loader2,
  Search,
  AlertTriangle,
  Download,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  WEBSITE_AUDIT_STATUSES,
  type WebsiteAuditSubmission,
} from "@shared/websiteAuditSchema";

type WebsiteAuditStatus = (typeof WEBSITE_AUDIT_STATUSES)[number];
type WebsiteAuditAdminMeta = {
  internalNotes?: string;
  updatedAt?: string;
  updatedBy?: string;
};
type WebsiteAuditDataWithMeta = WebsiteAuditSubmission & {
  __admin?: WebsiteAuditAdminMeta;
};

interface WebsiteAuditItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  role?: string | null;
  websiteUrl: string;
  status: string | null;
  auditData: WebsiteAuditDataWithMeta;
  createdAt: string;
}

interface WebsiteAuditResponse {
  items: WebsiteAuditItem[];
  missingTable?: boolean;
  message?: string;
}

function renderList(items: string[] | undefined) {
  if (!Array.isArray(items) || items.length === 0) return "Not provided";
  return items.join(", ");
}

function toTitle(value: string | undefined) {
  if (!value) return "Not provided";
  return value.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function safeFormatDateTime(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "PPp");
}

function getAdminMeta(auditData: WebsiteAuditDataWithMeta): WebsiteAuditAdminMeta {
  const raw = auditData?.__admin;
  if (!raw || typeof raw !== "object") return {};
  return raw;
}

export default function AdminWebsiteAuditsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<
    Record<number, { status: WebsiteAuditStatus; internalNotes: string }>
  >({});
  const [savingAuditId, setSavingAuditId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [authLoading, router, user]);

  const { data, isLoading, error } = useQuery<WebsiteAuditResponse>({
    queryKey: ["/api/admin/website-audits"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/website-audits");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) return null;

  const items = data?.items ?? [];

  const buildDefaultDraft = (item: WebsiteAuditItem) => {
    const status = WEBSITE_AUDIT_STATUSES.includes(item.status as WebsiteAuditStatus)
      ? (item.status as WebsiteAuditStatus)
      : "new";
    const adminMeta = getAdminMeta(item.auditData);
    return {
      status,
      internalNotes: adminMeta.internalNotes || "",
    };
  };

  const getDraft = (item: WebsiteAuditItem) => drafts[item.id] || buildDefaultDraft(item);

  const updateDraft = (
    item: WebsiteAuditItem,
    patch: Partial<{ status: WebsiteAuditStatus; internalNotes: string }>
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || buildDefaultDraft(item)),
        ...patch,
      },
    }));
  };

  const saveAuditUpdates = async (item: WebsiteAuditItem) => {
    const draft = getDraft(item);
    setSavingAuditId(item.id);
    try {
      await apiRequest("PATCH", `/api/admin/website-audits/${item.id}`, {
        status: draft.status,
        internalNotes: draft.internalNotes,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/website-audits"] });
      toast({
        title: "Website audit updated",
        description: `Saved status and internal notes for #${item.id}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not save website audit updates.",
        variant: "destructive",
      });
    } finally {
      setSavingAuditId(null);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Website Audit Requests
          </h1>
          <p className="text-muted-foreground">
            Review free audit submissions and prepare professional audit reports.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/admin/website-audits?format=csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </a>
        </Button>
      </div>

      {data?.missingTable ? (
        <Card className="mb-6 border-yellow-300 dark:border-yellow-900">
          <CardContent className="py-4 text-sm text-yellow-900 dark:text-yellow-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{data.message}</span>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {(error as Error).message || "Unable to load website audit requests."}
          </CardContent>
        </Card>
      ) : null}

      {!error && items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No website audit requests yet.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => {
          const audit = item.auditData;
          const adminMeta = getAdminMeta(audit);
          const draft = getDraft(item);
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="break-all">
                      {item.email}
                      {item.phone ? ` • ${item.phone}` : ""}
                      {item.company ? ` • ${item.company}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">ID #{item.id}</Badge>
                    <Badge>{toTitle(item.status ?? "new")}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                  >
                    {item.websiteUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <span className="text-muted-foreground">
                    Submitted {format(new Date(item.createdAt), "PPp")}
                  </span>
                </div>

                <Separator />

                <div className="rounded-md border bg-muted/30 p-4 space-y-4">
                  <p className="text-sm font-medium">Internal Audit Management</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor={`audit-status-${item.id}`}>Status</Label>
                      <select
                        id={`audit-status-${item.id}`}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={draft.status}
                        onChange={(e) =>
                          updateDraft(item, { status: e.target.value as WebsiteAuditStatus })
                        }
                      >
                        {WEBSITE_AUDIT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {toTitle(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor={`audit-notes-${item.id}`}>Internal Notes</Label>
                      <Textarea
                        id={`audit-notes-${item.id}`}
                        rows={4}
                        value={draft.internalNotes}
                        onChange={(e) =>
                          updateDraft(item, { internalNotes: e.target.value })
                        }
                        placeholder="Add audit findings, blockers, handoff notes, or follow-up context (admin-only)."
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {adminMeta.updatedAt
                        ? `Last internal update: ${safeFormatDateTime(adminMeta.updatedAt)}${adminMeta.updatedBy ? ` by @${adminMeta.updatedBy}` : ""}`
                        : "No internal notes saved yet."}
                    </p>
                    <Button
                      type="button"
                      onClick={() => saveAuditUpdates(item)}
                      disabled={savingAuditId === item.id}
                    >
                      {savingAuditId === item.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Updates
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <p className="font-medium mb-1">Business Context</p>
                    <p>Type: {toTitle(audit.businessType)}</p>
                    <p>Role: {audit.role || "Not provided"}</p>
                    <p>Target audience: {audit.targetAudience}</p>
                    <p>Target locations: {audit.targetLocations || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Audit Scope</p>
                    <p>Goals: {renderList(audit.primaryGoals)}</p>
                    <p>Conversions: {renderList(audit.primaryConversionActions)}</p>
                    <p>Priority pages: {renderList(audit.priorityPages)}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="font-medium mb-1">Top Challenges</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {audit.topChallenges}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <p className="font-medium mb-1">Technical / Data</p>
                    <p>CMS: {toTitle(audit.cmsPlatform)}</p>
                    <p>Analytics access: {audit.hasAnalyticsAccess ? "Yes" : "No"}</p>
                    <p>Search Console access: {audit.hasSearchConsoleAccess ? "Yes" : "No"}</p>
                    <p>Read-only access available: {audit.canProvideReadOnlyAccess ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Acquisition & KPIs</p>
                    <p>Running ads: {audit.runningAds ? "Yes" : "No"}</p>
                    <p>Ad platforms: {renderList(audit.adPlatforms)}</p>
                    <p>Monthly sessions: {audit.monthlySessions || "Not provided"}</p>
                    <p>Conversion rate: {audit.currentConversionRate || "Not provided"}</p>
                  </div>
                </div>

                {audit.additionalContext ? (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Additional Context</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{audit.additionalContext}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">Timeline: {toTitle(audit.preferredTimeline)}</Badge>
                  <Badge variant="secondary">Contact: {toTitle(audit.preferredContactMethod)}</Badge>
                  {audit.newsletter ? <Badge variant="outline">Newsletter opt-in</Badge> : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
          Back to Admin Dashboard
        </Button>
      </div>
    </div>
  );
}
