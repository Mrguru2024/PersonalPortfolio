"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  CircleDollarSign,
  GitBranch,
  LineChart,
  ListTodo,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { CrmLtvSnapshot } from "@shared/crmLtvSnapshot";

export function formatLtvUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export interface AdminLtvWorkspaceViewProps {
  snapshot: CrmLtvSnapshot | undefined;
  isLoading: boolean;
  error?: Error | null;
  /** Prefix for contact profile links */
  contactBasePath?: string;
  className?: string;
}

const WORKFLOW_LINKS: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/admin/crm",
    title: "Contacts",
    description: "Fill in estimated value, source, and lifecycle on each record.",
    icon: Users,
  },
  {
    href: "/admin/crm/pipeline",
    title: "Pipeline",
    description: "Deal stages and amounts roll into won vs open pipeline totals.",
    icon: GitBranch,
  },
  {
    href: "/admin/crm/proposal-prep",
    title: "Proposal prep",
    description: "Move qualified opportunities toward closed-won value.",
    icon: Briefcase,
  },
  {
    href: "/admin/crm/sequences",
    title: "Sequences",
    description: "Nurture and re-engage leads tied to revenue follow-up.",
    icon: LineChart,
  },
  {
    href: "/admin/crm/tasks",
    title: "Tasks",
    description: "Follow-ups that protect pipeline and client expansion.",
    icon: ListTodo,
  },
];

export function AdminLtvWorkspaceView({
  snapshot,
  isLoading,
  error,
  contactBasePath = "/admin/crm",
  className,
}: AdminLtvWorkspaceViewProps) {
  if (error) {
    return (
      <div className={cn("rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm", className)}>
        {error.message || "Could not load LTV data."}
      </div>
    );
  }

  if (isLoading || !snapshot) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)} data-testid="ltv-loading">
        Loading LTV snapshot…
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Revenue snapshot from CRM: deal amounts on the pipeline board plus estimated value on contacts. True cohort LTV
        can be layered on later; today this is your operating picture for pipeline and client estimates.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Won deals (board)"
          value={formatLtvUsd(snapshot.wonDealValueCents)}
          icon={Wallet}
          hint="Sum of deal value in Won stage"
        />
        <MetricCard
          title="Open pipeline"
          value={formatLtvUsd(snapshot.openPipelineValueCents)}
          icon={TrendingUp}
          hint="Active stages excluding lost"
        />
        <MetricCard
          title="Client estimates (LTV proxy)"
          value={formatLtvUsd(snapshot.totalClientEstimatedLtvCents)}
          icon={CircleDollarSign}
          hint={`${snapshot.clientsWithEstimateCount} of ${snapshot.clientCount} clients with an estimate`}
        />
        <MetricCard
          title="Avg estimate per client"
          value={
            snapshot.avgClientEstimatedLtvCents != null
              ? formatLtvUsd(snapshot.avgClientEstimatedLtvCents)
              : "—"
          }
          icon={Users}
          hint={snapshot.clientsWithEstimateCount > 0 ? "Among clients with estimates" : "Add estimates on client records"}
        />
        <MetricCard
          title="Lead pipeline (est.)"
          value={formatLtvUsd(snapshot.totalLeadEstimatedValueCents)}
          icon={LineChart}
          hint={`${snapshot.leadsWithEstimateCount} leads with a dollar estimate`}
        />
        <MetricCard
          title="Missing estimates"
          value={String(snapshot.contactsMissingEstimateCount)}
          icon={ListTodo}
          hint="Leads and clients without a positive estimate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top sources by estimated value</CardTitle>
            <CardDescription>Attributed value on contacts with estimates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.topSourcesByValue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No source/value data yet.</p>
            ) : (
              snapshot.topSourcesByValue.map((row) => (
                <div
                  key={row.source}
                  className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-medium truncate" title={row.source}>
                    {row.source}
                  </span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {formatLtvUsd(row.totalCents)}{" "}
                    <span className="text-xs">({row.contactCount})</span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Highest-value contacts</CardTitle>
            <CardDescription>Open a record to update estimate, stage, and follow-ups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.topContactsByEstimate.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add estimated values on contacts to see rankings.</p>
            ) : (
              snapshot.topContactsByEstimate.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`${contactBasePath}/${c.id}`}
                      className="font-medium text-primary hover:underline truncate block"
                    >
                      {c.name}
                    </Link>
                    {c.company ? (
                      <p className="text-xs text-muted-foreground truncate">{c.company}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {c.type}
                    </Badge>
                    <span className="tabular-nums font-medium">{formatLtvUsd(c.estimatedValueCents)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Connect to workflows</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {WORKFLOW_LINKS.map(({ href, title, description, icon: Icon }) => (
            <Card key={href} className="rounded-xl border shadow-sm hover:border-primary/25 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm">{title}</CardTitle>
                </div>
                <CardDescription className="text-xs leading-snug">{description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" className="px-0 h-auto text-primary" asChild>
                  <Link href={href}>
                    Open <ArrowRight className="inline h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-xl border shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium leading-tight">{title}</CardTitle>
        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      </CardContent>
    </Card>
  );
}

export interface AdminLtvWorkspaceProps {
  contactBasePath?: string;
  className?: string;
}

/** Fetches `/api/admin/crm/ltv` and renders the full LTV workspace. Use on admin pages after auth. */
export default function AdminLtvWorkspace({ contactBasePath, className }: AdminLtvWorkspaceProps) {
  const { data, isLoading, error } = useQuery<CrmLtvSnapshot>({
    queryKey: ["/api/admin/crm/ltv"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/ltv");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to load LTV snapshot");
      }
      return res.json();
    },
  });

  return (
    <AdminLtvWorkspaceView
      snapshot={data}
      isLoading={isLoading}
      error={error instanceof Error ? error : error ? new Error(String(error)) : null}
      contactBasePath={contactBasePath}
      className={className}
    />
  );
}
