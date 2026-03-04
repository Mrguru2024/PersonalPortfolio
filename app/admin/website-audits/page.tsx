"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Loader2, Search, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { WebsiteAuditSubmission } from "@shared/websiteAuditSchema";

interface WebsiteAuditItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  role?: string | null;
  websiteUrl: string;
  status: string | null;
  auditData: WebsiteAuditSubmission;
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

export default function AdminWebsiteAuditsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

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

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Website Audit Requests
        </h1>
        <p className="text-muted-foreground">
          Review free audit submissions and prepare professional audit reports.
        </p>
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
