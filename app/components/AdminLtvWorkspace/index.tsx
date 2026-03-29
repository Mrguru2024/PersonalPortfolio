"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  CircleDollarSign,
  Download,
  GitBranch,
  LineChart,
  ListTodo,
  PlayCircle,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CollapsibleLongList } from "@/components/admin/CollapsibleLongList";
import type { CrmLtvReport, CrmLtvReportParams, CrmLtvSnapshot } from "@shared/crmLtvSnapshot";
import {
  DEFAULT_CRM_LTV_REPORT_PARAMS,
  serializeCrmLtvReportParams,
} from "@shared/crmLtvSnapshot";

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
  /** Report builder metadata and scenario overlay (from `/api/admin/crm/ltv/report`). */
  reportExtras?: Pick<CrmLtvReport, "reportMeta" | "scenarioAdjustments" | "combinedScenarioClientLtvCents"> | null;
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
  reportExtras,
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
        Loading LTV report…
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Revenue view from CRM: deal amounts on the pipeline board plus estimated value on contacts. Adjust filters
        above to narrow the audience, then optionally layer uplift or imputed lead value for planning scenarios.
      </p>

      {reportExtras ? (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This run</CardTitle>
            <CardDescription>
              Generated {formatLocaleMediumDateTime(reportExtras.reportMeta.generatedAt)} (your locale)
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid gap-1 sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Contacts: </span>
              {reportExtras.reportMeta.params.contactTypeFilter}
            </p>
            <p>
              <span className="font-medium text-foreground">Min estimate: </span>
              {formatLtvUsd(reportExtras.reportMeta.params.minEstimatedValueCents)}
            </p>
            <p>
              <span className="font-medium text-foreground">Top contacts / sources: </span>
              {reportExtras.reportMeta.params.topContactsLimit} / {reportExtras.reportMeta.params.topSourcesLimit}
            </p>
            <p>
              <span className="font-medium text-foreground">Deal view: </span>
              {reportExtras.reportMeta.params.dealView.replace("_", " ")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {reportExtras && reportExtras.scenarioAdjustments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {reportExtras.scenarioAdjustments.map((row) => (
            <Card key={row.label} className="rounded-xl border shadow-sm border-dashed border-primary/25">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium leading-snug">{row.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums">{formatLtvUsd(row.valueCents)}</div>
              </CardContent>
            </Card>
          ))}
          {reportExtras.combinedScenarioClientLtvCents != null ? (
            <Card className="rounded-xl border shadow-sm sm:col-span-2 border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Scenario combined (client estimates)</CardTitle>
                <CardDescription>Uplift and imputed missing-lead rows summed for quick planning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {formatLtvUsd(reportExtras.combinedScenarioClientLtvCents)}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Won deals (board)"
          value={formatLtvUsd(snapshot.wonDealValueCents)}
          icon={Wallet}
          hint="Sum of deal value in Won stage (per deal view)"
        />
        <MetricCard
          title="Open pipeline"
          value={formatLtvUsd(snapshot.openPipelineValueCents)}
          icon={TrendingUp}
          hint="Active stages excluding lost (per deal view)"
        />
        <MetricCard
          title="Client estimates (LTV proxy)"
          value={formatLtvUsd(snapshot.totalClientEstimatedLtvCents)}
          icon={CircleDollarSign}
          hint={`${snapshot.clientsWithEstimateCount} of ${snapshot.clientCount} clients in scope with an estimate`}
        />
        <MetricCard
          title="Avg estimate per client"
          value={
            snapshot.avgClientEstimatedLtvCents != null ? formatLtvUsd(snapshot.avgClientEstimatedLtvCents) : "—"
          }
          icon={Users}
          hint={snapshot.clientsWithEstimateCount > 0 ? "Among clients in scope with estimates" : "Add estimates on client records"}
        />
        <MetricCard
          title="Lead pipeline (est.)"
          value={formatLtvUsd(snapshot.totalLeadEstimatedValueCents)}
          icon={LineChart}
          hint={`${snapshot.leadsWithEstimateCount} leads in scope with a dollar estimate`}
        />
        <MetricCard
          title="Missing estimates"
          value={String(snapshot.contactsMissingEstimateCount)}
          icon={ListTodo}
          hint="Leads and clients in scope without a positive estimate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top sources by estimated value</CardTitle>
            <CardDescription>Attributed value on contacts in scope with estimates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.topSourcesByValue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No source/value data for this filter.</p>
            ) : (
              <CollapsibleLongList
                items={snapshot.topSourcesByValue}
                previewCount={6}
                nounPlural="sources"
                listClassName="space-y-2"
                getKey={(row) => row.source}
                renderItem={(row) => (
                  <div className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium truncate" title={row.source}>
                      {row.source}
                    </span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {formatLtvUsd(row.totalCents)} <span className="text-xs">({row.contactCount})</span>
                    </span>
                  </div>
                )}
              />
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
              <p className="text-sm text-muted-foreground">No contacts match this filter with positive estimates.</p>
            ) : (
              <CollapsibleLongList
                items={snapshot.topContactsByEstimate}
                previewCount={6}
                nounPlural="contacts"
                listClassName="space-y-2"
                getKey={(c) => c.id}
                renderItem={(c) => (
                  <div className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        href={`${contactBasePath}/${c.id}`}
                        className="font-medium text-primary hover:underline truncate block"
                      >
                        {c.name}
                      </Link>
                      {c.company ? <p className="text-xs text-muted-foreground truncate">{c.company}</p> : null}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {c.type}
                      </Badge>
                      <span className="tabular-nums font-medium">{formatLtvUsd(c.estimatedValueCents)}</span>
                    </div>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Connect to workflows</h2>
        <CollapsibleLongList
          items={WORKFLOW_LINKS}
          previewCount={6}
          nounPlural="shortcuts"
          listClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          getKey={(l) => l.href}
          renderItem={({ href, title, description, icon: Icon }) => (
            <Card className="rounded-xl border shadow-sm hover:border-primary/25 transition-colors">
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
          )}
        />
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

function dollarsToCents(d: string): number {
  const n = Number.parseFloat(d);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

/** Fetches `/api/admin/crm/ltv/report` with admin-controlled parameters and CSV export. */
export default function AdminLtvWorkspace({ contactBasePath, className }: AdminLtvWorkspaceProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<CrmLtvReportParams>(() => ({ ...DEFAULT_CRM_LTV_REPORT_PARAMS }));
  const [applied, setApplied] = useState<CrmLtvReportParams>(() => ({ ...DEFAULT_CRM_LTV_REPORT_PARAMS }));

  const minDollarsStr = (form.minEstimatedValueCents / 100).toFixed(2);
  const imputeDollarsStr =
    form.imputedMissingLeadEstimateCents == null ? "" : (form.imputedMissingLeadEstimateCents / 100).toFixed(2);

  const queryKey = ["/api/admin/crm/ltv/report", applied] as const;

  const { data, isLoading, error, isFetching } = useQuery<CrmLtvReport>({
    queryKey,
    queryFn: async () => {
      const q = serializeCrmLtvReportParams(applied);
      const res = await apiRequest("GET", `/api/admin/crm/ltv/report?${q}`);
      return res.json();
    },
  });

  const runReport = useCallback(() => {
    setApplied({ ...form });
  }, [form]);

  const resetForm = useCallback(() => {
    const d = { ...DEFAULT_CRM_LTV_REPORT_PARAMS };
    setForm(d);
    setApplied(d);
  }, []);

  const downloadCsv = useCallback(async () => {
    try {
      const q = serializeCrmLtvReportParams(applied) + "&format=csv";
      const res = await fetch(`/api/admin/crm/ltv/report?${q}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ltv-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Could not download CSV", variant: "destructive" });
    }
  }, [applied, toast]);

  const extras = data
    ? {
        reportMeta: data.reportMeta,
        scenarioAdjustments: data.scenarioAdjustments,
        combinedScenarioClientLtvCents: data.combinedScenarioClientLtvCents,
      }
    : null;

  const showLoading = !data && (isLoading || isFetching);

  return (
    <div className={cn("space-y-8", className)}>
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Report inputs</CardTitle>
          <CardDescription>Narrow which contacts and deals feed the metrics, then run the report.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Contact scope</Label>
            <Select
              value={form.contactTypeFilter}
              onValueChange={(v: CrmLtvReportParams["contactTypeFilter"]) =>
                setForm((f) => ({ ...f, contactTypeFilter: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Leads + clients</SelectItem>
                <SelectItem value="lead">Leads only</SelectItem>
                <SelectItem value="client">Clients only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ltv-min-est">Minimum estimate (USD)</Label>
            <Input
              id="ltv-min-est"
              type="number"
              min={0}
              step="0.01"
              value={minDollarsStr}
              onChange={(e) =>
                setForm((f) => ({ ...f, minEstimatedValueCents: dollarsToCents(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Pipeline / deal totals</Label>
            <Select
              value={form.dealView}
              onValueChange={(v: CrmLtvReportParams["dealView"]) => setForm((f) => ({ ...f, dealView: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Won + open</SelectItem>
                <SelectItem value="won_only">Won only</SelectItem>
                <SelectItem value="open_only">Open only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ltv-top-contacts">Top contacts</Label>
            <Input
              id="ltv-top-contacts"
              type="number"
              min={5}
              max={100}
              value={form.topContactsLimit}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                setForm((f) => ({ ...f, topContactsLimit: Number.isFinite(n) ? n : f.topContactsLimit }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ltv-top-sources">Top sources</Label>
            <Input
              id="ltv-top-sources"
              type="number"
              min={3}
              max={30}
              value={form.topSourcesLimit}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                setForm((f) => ({ ...f, topSourcesLimit: Number.isFinite(n) ? n : f.topSourcesLimit }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ltv-uplift">Client estimate uplift (%)</Label>
            <Input
              id="ltv-uplift"
              type="number"
              step="0.1"
              value={form.clientLtvUpliftPercent}
              onChange={(e) => {
                const n = Number.parseFloat(e.target.value);
                setForm((f) => ({ ...f, clientLtvUpliftPercent: Number.isFinite(n) ? n : f.clientLtvUpliftPercent }));
              }}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ltv-impute">Imputed value per lead missing estimate (USD, optional)</Label>
            <Input
              id="ltv-impute"
              type="number"
              min={0}
              step="1"
              placeholder="Leave empty for none"
              value={imputeDollarsStr}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v === "") {
                  setForm((f) => ({ ...f, imputedMissingLeadEstimateCents: null }));
                  return;
                }
                setForm((f) => ({
                  ...f,
                  imputedMissingLeadEstimateCents: dollarsToCents(v) || null,
                }));
              }}
            />
          </div>
        </CardContent>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button type="button" size="sm" onClick={runReport} disabled={isFetching}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {isFetching ? "Running…" : "Run report"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={resetForm}>
            Reset defaults
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={downloadCsv} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </CardContent>
      </Card>

      <AdminLtvWorkspaceView
        snapshot={data}
        isLoading={showLoading}
        error={error instanceof Error ? error : error ? new Error(String(error)) : null}
        contactBasePath={contactBasePath}
        reportExtras={extras}
      />
    </div>
  );
}
