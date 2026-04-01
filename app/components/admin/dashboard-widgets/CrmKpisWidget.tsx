"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Building2,
  Target,
  ListTodo,
  AlertCircle,
  Search,
  ArrowRight,
  Video,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { CrmDashboardStats } from "./crmDashboardStatsTypes";

export function CrmKpisWidget() {
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
    return <p className="text-sm text-muted-foreground py-4">Loading CRM metrics…</p>;
  }

  return (
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
              <Link href="/admin/crm">
                View all <ArrowRight className="inline h-3 w-3 ml-1" />
              </Link>
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
              <Link href="/admin/crm/accounts">
                View all <ArrowRight className="inline h-3 w-3 ml-1" />
              </Link>
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
              <Link href="/admin/crm/pipeline">
                Pipeline <ArrowRight className="inline h-3 w-3 ml-1" />
              </Link>
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
              <Link href="/admin/crm/pipeline?stage=proposal_ready">
                View pipeline <ArrowRight className="inline h-3 w-3 ml-1" />
              </Link>
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
              <Link href="/admin/crm">
                From lead <ArrowRight className="inline h-3 w-3 ml-1" />
              </Link>
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
  );
}
