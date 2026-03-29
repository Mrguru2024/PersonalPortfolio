"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { ConfidenceBadge } from "@/components/aee/ConfidenceBadge";
import { RecommendationPanel, type RecommendationItem } from "@/components/aee/RecommendationPanel";
import { InsightCard } from "@/components/aee/InsightCard";
import { PersonaBreakdown } from "@/components/aee/PersonaBreakdown";
import { MarketBreakdown } from "@/components/aee/MarketBreakdown";
import { FunnelBreakdown } from "@/components/aee/FunnelBreakdown";
import { ExperimentChannelLinksPanel, ExperimentRollupActions } from "@/components/aee/ExperimentChannelLinksPanel";
import { ContentExperimentAiPanel } from "@/components/aee/ContentExperimentAiPanel";

type DetailPayload = {
  experiment: {
    id: number;
    key: string;
    name: string;
    status: string;
    workspaceKey: string;
    description: string | null;
    hypothesis: string | null;
    funnelStage: string | null;
    primaryPersonaKey: string | null;
    offerType: string | null;
    channelsJson: string[] | null;
    decisionRationale: string | null;
    experimentTemplateKey: string | null;
  };
  variants: Array<{
    id: number;
    key: string;
    name: string;
    allocationWeight: number | null;
    isControl: boolean | null;
    config: Record<string, unknown> | null;
  }>;
  channelLinks: Array<{ id: number; channelType: string; landingPath: string | null }>;
  metricsPreview: Array<{ metricDate: string; dimensionKey: string; leads: number; visitors: number }>;
  insights: Array<{
    id: number;
    title: string;
    body: string;
    insightType: string;
    severity: string;
    confidence0to100: number;
  }>;
  rollups: Array<{
    variantId: number;
    variantKey: string;
    variantName: string;
    visitors: number;
    leads: number;
    revenueCents: number;
    costCents: number;
    ctr: number | null;
    convRate: number | null;
  }>;
  recommendations: RecommendationItem[];
  experimentScore: {
    score: number;
    confidence0to100: number;
    factors: { conversionLift: number; revenueIndex: number; sampleStrength: number };
  } | null;
  ppcSnapshotJoin?: Array<{
    linkId: number;
    campaignId: number;
    campaignName: string;
    platform: string;
    variantId: number | null;
    totals: { impressions: number; clicks: number; spendCents: number; conversions: number };
  }>;
};

export default function AdminExperimentDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (
      !authLoading &&
      user &&
      (!user.isAdmin || !user.adminApproved) &&
      user.permissions?.experiments !== true &&
      user.isSuperUser !== true
    ) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const canSee =
    !!user &&
    ((user.isAdmin && user.adminApproved) || user.permissions?.experiments === true || user.isSuperUser === true);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/experiments", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/experiments/${id}`);
      return res.json() as Promise<DetailPayload>;
    },
    enabled: canSee && !!id,
  });

  if (authLoading || !canSee) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data && !isLoading) {
    return <p className="text-sm text-muted-foreground">Not found.</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const exp = data.experiment;

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start gap-3">
        <Link href="/admin/experiments" className="text-sm text-muted-foreground hover:text-foreground">
          ← All experiments
        </Link>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{exp.name}</h2>
          <Badge variant={exp.status === "running" ? "default" : "secondary"}>{exp.status}</Badge>
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-1">{exp.key}</p>
        {exp.hypothesis ? <p className="text-sm mt-3 text-muted-foreground leading-relaxed">{exp.hypothesis}</p> : null}
        <div className="mt-4">
          <ExperimentRollupActions experimentId={exp.id} />
        </div>
      </div>

      <ExperimentChannelLinksPanel experimentId={exp.id} variants={data.variants} />

      {data.ppcSnapshotJoin?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PPC performance (linked campaigns)</CardTitle>
            <CardDescription>Totals over loaded snapshot rows; same underlying data as Paid Growth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.ppcSnapshotJoin.map((p) => (
              <div key={p.linkId} className="border rounded-md p-3">
                <p className="font-medium">
                  {p.campaignName}{" "}
                  <span className="text-muted-foreground font-normal">({p.platform})</span>
                </p>
                <p className="text-muted-foreground mt-1 tabular-nums">
                  Impressions {p.totals.impressions.toLocaleString()} · Clicks {p.totals.clicks.toLocaleString()} · Spend $
                  {(p.totals.spendCents / 100).toFixed(2)} · Conv. {p.totals.conversions}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data.experimentScore ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              Experiment score (preview)
              <ConfidenceBadge value0to100={data.experimentScore.confidence0to100} />
            </CardTitle>
            <CardDescription>
              Composite {data.experimentScore.score}/100 — conversion spread, revenue index, sample strength. Not a substitute
              for statistical testing.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground font-mono">
            factors: {JSON.stringify(data.experimentScore.factors)}
          </CardContent>
        </Card>
      ) : null}

      <RecommendationPanel items={data.recommendations} />

      <ContentExperimentAiPanel experimentId={id} defaultGoal={exp.hypothesis} />

      <div className="grid gap-4 md:grid-cols-3">
        <PersonaBreakdown experimentName={exp.name} />
        <MarketBreakdown />
        <FunnelBreakdown funnelStage={exp.funnelStage} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variants</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead>Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.name}</TableCell>
                  <TableCell className="font-mono text-xs">{v.key}</TableCell>
                  <TableCell className="text-right">{v.allocationWeight ?? 1}</TableCell>
                  <TableCell>{v.isControl ? "Yes" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rollups (totals)</CardTitle>
          <CardDescription>From aee_experiment_metrics_daily where dimension_key = total.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.rollups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No metrics rows yet — tracking + rollup job pending.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conv %</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rollups.map((r) => (
                  <TableRow key={r.variantId}>
                    <TableCell>{r.variantName}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.visitors}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.leads}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.convRate != null ? `${(r.convRate * 100).toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${(r.revenueCents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">${(r.costCents / 100).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel links</CardTitle>
          <CardDescription>PPC campaigns, email campaigns, landing paths — same rows as aee_experiment_channel_links.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.channelLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">None — add via API or admin form (Phase 2).</p>
          ) : (
            <ul className="text-sm space-y-1">
              {data.channelLinks.map((l) => (
                <li key={l.id}>
                  {l.channelType} {l.landingPath ? `· ${l.landingPath}` : ""}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-base font-medium mb-3">Stored insights</h3>
        <div className="space-y-3">
          {data.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No persisted insights yet.</p>
          ) : (
            data.insights.map((i) => (
              <InsightCard
                key={i.id}
                title={i.title}
                body={i.body}
                insightType={i.insightType}
                severity={i.severity}
                confidence0to100={i.confidence0to100}
              />
            ))
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent metric rows</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          {data.metricsPreview.length === 0 ? (
            <p>No daily rows.</p>
          ) : (
            data.metricsPreview.map((m, idx) => (
              <div key={idx}>
                {m.metricDate} · {m.dimensionKey} · v:{m.visitors} · leads:{m.leads}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
