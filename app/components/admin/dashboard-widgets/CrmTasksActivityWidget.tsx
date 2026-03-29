"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ListTodo, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatLocaleDateTime } from "@/lib/localeDateTime";
import type { CrmDashboardStats } from "./crmDashboardStatsTypes";

export function CrmTasksActivityWidget() {
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
    return <p className="text-sm text-muted-foreground py-4">Loading tasks &amp; activity…</p>;
  }

  return (
    <div className="grid gap-6 mt-0 lg:grid-cols-2">
      <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-primary/10 p-1.5">
              <ListTodo className="h-4 w-4 text-primary" />
            </span>
            Recent tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <span>{t.title}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t.dueAt ? format(new Date(t.dueAt), "MMM d") : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-primary/10 p-1.5">
              <Activity className="h-4 w-4 text-primary" />
            </span>
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentActivity.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatLocaleDateTime(a.createdAt, "monthDayTime")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
