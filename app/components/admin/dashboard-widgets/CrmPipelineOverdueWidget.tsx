"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { getPipelineStageLabel } from "@/lib/crm-pipeline-stages";
import type { CrmDashboardStats } from "./crmDashboardStatsTypes";

export function CrmPipelineOverdueWidget() {
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
    return <p className="text-sm text-muted-foreground py-4">Loading pipeline…</p>;
  }

  return (
    <div className="grid gap-6 mt-0 lg:grid-cols-2">
      <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leads by stage</CardTitle>
          <CardDescription>Pipeline stage counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {stats.leadsByPipelineStage.map(({ stage, count }) => (
              <Badge key={stage} variant={count > 0 ? "default" : "secondary"} className="rounded-md shrink-0">
                {getPipelineStageLabel(stage)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-0 shadow-sm overflow-hidden border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-destructive/10 p-1.5">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </span>
            Overdue tasks
          </CardTitle>
          <CardDescription>{stats.overdueTasks.length} overdue</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.overdueTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No overdue tasks</p>
          ) : (
            <ul className="space-y-2">
              {stats.overdueTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <span>{t.title}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{t.contact?.name ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-3 rounded-lg" asChild>
            <Link href="/admin/crm/tasks">All tasks</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
