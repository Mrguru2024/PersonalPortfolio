"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { CrmDashboardStats } from "./crmDashboardStatsTypes";

export function CrmSourcesTagsWidget() {
  const { user } = useAuth();
  const enabled = !!user?.isAdmin && !!user?.adminApproved;

  const { data: stats, isLoading } = useQuery<CrmDashboardStats>({
    queryKey: ["/api/admin/crm/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/dashboard");
      return res.json();
    },
    enabled,
  });

  if (!enabled) return null;
  if (isLoading || !stats) {
    return <p className="text-sm text-muted-foreground py-4">Loading sources &amp; tags…</p>;
  }

  if ((stats.topSources?.length ?? 0) === 0 && (stats.topTags?.length ?? 0) === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 mt-0 md:grid-cols-2">
      {stats.topSources && stats.topSources.length > 0 && (
        <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top sources</CardTitle>
            <CardDescription>Where contacts and leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {stats.topSources.slice(0, 8).map(({ source, count }) => (
                <li key={source} className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{source === "unknown" ? "Unknown" : source}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {stats.topTags && stats.topTags.length > 0 && (
        <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top tags</CardTitle>
            <CardDescription>Most used contact segments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {stats.topTags.slice(0, 12).map(({ tag, count }) => (
                <Badge key={tag} variant="secondary" className="rounded-md shrink-0">
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
