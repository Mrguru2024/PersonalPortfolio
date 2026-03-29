"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Building2,
  Target,
  ListTodo,
  AlertCircle,
  Activity,
  Search,
  ArrowRight,
  Video,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { formatLocaleDateTime } from "@/lib/localeDateTime";
import { getPipelineStageLabel } from "@/lib/crm-pipeline-stages";

interface DashboardStats {
  totalContacts: number;
  totalAccounts: number;
  totalActiveLeads: number;
  leadsMissingData: number;
  proposalReadyCount?: number;
  followUpNeededCount?: number;
  sequenceReadyCount?: number;
  leadsByPipelineStage: { stage: string; count: number }[];
  topSources?: { source: string; count: number }[];
  topTags?: { tag: string; count: number }[];
  recentTasks: Array<{
    id: number;
    title: string;
    dueAt: string | null;
    priority: string | null;
    contactId: number;
    contact?: { name: string };
  }>;
  overdueTasks: Array<{
    id: number;
    title: string;
    dueAt: string | null;
    contact?: { name: string };
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    title: string;
    createdAt: string;
  }>;
  accountsNeedingResearch: number;
  discoveryWorkspacesIncomplete?: number;
  proposalPrepNeedingAttention?: number;
}

export default function CrmDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/crm/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/dashboard");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-6xl py-6 px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM Overview</h1>
            <p className="text-muted-foreground mt-0.5">Contacts, accounts, pipeline, insights</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm">Contacts</Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/accounts">Accounts</Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/pipeline">Pipeline</Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/ltv">LTV snapshot</Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/tasks">Tasks</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.totalContacts}</div>
                <Button variant="link" className="p-0 h-auto mt-1 text-primary" asChild>
                  <Link href="/admin/crm">View all <ArrowRight className="inline h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Accounts</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.totalAccounts}</div>
                <Button variant="link" className="p-0 h-auto mt-1 text-primary" asChild>
                  <Link href="/admin/crm/accounts">View all <ArrowRight className="inline h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active leads</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.totalActiveLeads}</div>
                <Button variant="link" className="p-0 h-auto mt-1 text-primary" asChild>
                  <Link href="/admin/crm/pipeline">Pipeline <ArrowRight className="inline h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Accounts needing research</CardTitle>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.accountsNeedingResearch}</div>
                <p className="text-xs text-muted-foreground mt-1">No research profile yet</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-500/30 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads missing data</CardTitle>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.leadsMissingData ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Pain point, budget, or timeline</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Proposal ready</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.proposalReadyCount ?? 0}</div>
                <Button variant="link" className="p-0 h-auto mt-1 text-primary" asChild>
                  <Link href="/admin/crm/pipeline?stage=proposal_ready">View pipeline <ArrowRight className="inline h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-500/30 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Follow-up needed</CardTitle>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <ListTodo className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.followUpNeededCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Outreach due or overdue</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sequence ready</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Target className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.sequenceReadyCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready for outreach</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Discovery (draft/scheduled)</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Video className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.discoveryWorkspacesIncomplete ?? 0}</div>
                <Button variant="link" className="p-0 h-auto mt-1 text-primary" asChild>
                  <Link href="/admin/crm">From lead <ArrowRight className="inline h-3 w-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-500/30 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Proposal prep (needs attention)</CardTitle>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stats.proposalPrepNeedingAttention ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Draft or needs clarification</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {stats && ((stats.topSources?.length ?? 0) > 0 || (stats.topTags?.length ?? 0) > 0) ? (
          <div className="grid gap-6 mt-8 md:grid-cols-2">
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
                      <Badge key={tag} variant="secondary" className="rounded-md shrink-0">{tag} ({count})</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {stats && (
          <div className="grid gap-6 mt-8 lg:grid-cols-2">
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
        )}

        {stats && (
          <div className="grid gap-6 mt-8 lg:grid-cols-2">
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
                        <span className="text-muted-foreground tabular-nums">{t.dueAt ? format(new Date(t.dueAt), "MMM d") : "—"}</span>
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
                        <span className="text-muted-foreground ml-2">{formatLocaleDateTime(a.createdAt, "monthDayTime")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link href="/admin/dashboard">← Back to main dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
