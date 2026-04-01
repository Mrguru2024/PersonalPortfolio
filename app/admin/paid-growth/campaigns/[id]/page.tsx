"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ClipboardCheck, Rocket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  PPC_GROWTH_ROUTE_RECOMMENDATIONS,
  PPC_READINESS_MIN_SCORE,
  growthRouteRecommendationLabel,
  type PpcGrowthRouteRecommendation,
} from "@shared/ppcBusinessRules";
import {
  PPC_CAMPAIGN_MODELS,
  type CampaignModel,
  getPpcEngineModuleConfig,
  parseCampaignModel,
} from "@shared/ppcCampaignModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type CampaignRow = {
  id: number;
  name: string;
  campaignModel: string | null;
  platform: string;
  status: string;
  objective: string;
  offerSlug: string | null;
  landingPagePath: string;
  readinessScore: number | null;
  readinessSnapshotJson: Record<string, unknown> | null;
  platformCampaignId: string | null;
  platformAdSetId: string | null;
  lastSyncError: string | null;
  trackingParamsJson: Record<string, string> | undefined;
  publishLogs?: { id: number; success: boolean; errorMessage: string | null; createdAt: string }[];
  offerIntelligence?: {
    offerSummary: {
      id: number;
      slug: string;
      name: string;
      score: number;
      readiness: string;
      tier: string | null;
      topWeaknesses: string[];
      warnings: string[];
      linkedLeadMagnetCount: number;
    } | null;
    relationshipWarnings: string[];
    bestLeadMagnets: Array<{
      id: number;
      slug: string;
      name: string;
      score: number;
      qualitySignal: number;
      handoffScore: number;
      readiness: string;
    }>;
    weakLeadMagnets: Array<{
      id: number;
      slug: string;
      name: string;
      score: number;
      qualitySignal: number;
      handoffScore: number;
      readiness: string;
    }>;
  };
};

export default function PaidGrowthCampaignDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: c, isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/campaigns", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/paid-growth/campaigns/${id}`);
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as CampaignRow;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  const readinessMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/paid-growth/campaigns/${id}/readiness`, {});
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: (d: { overallScore: number; blockers: string[] }) => {
      toast({
        title: "Readiness",
        descriptionKey: "growth.readinessScore",
        values: { score: String(d.overallScore) },
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", id] });
    },
    onError: () => toast({ title: "Readiness failed", variant: "destructive" }),
  });

  const modelMut = useMutation({
    mutationFn: async (next: CampaignModel) => {
      const res = await apiRequest("PATCH", `/api/admin/paid-growth/campaigns/${id}`, { campaignModel: next });
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as CampaignRow;
    },
    onSuccess: () => {
      toast({ title: "Campaign model updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", id] });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/paid-growth/campaigns/${id}/publish`, {});
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Publish failed");
      return j;
    },
    onSuccess: (d: { message?: string }) => {
      toast({ title: "Sent to Meta", description: d.message ?? "Done." });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", id] });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Could not publish", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !c) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const resolvedModel = parseCampaignModel(c.campaignModel);
  const engine = getPpcEngineModuleConfig(resolvedModel);

  const snap = c.readinessSnapshotJson as {
    blockers?: string[];
    scores?: Record<string, number>;
    gates?: Record<string, boolean>;
    remediationChecklist?: string[];
    package?: string;
    growthRoute?: string;
    adReady?: boolean;
  } | null;

  const growthRouteKey =
    snap?.growthRoute &&
    typeof snap.growthRoute === "string" &&
    (PPC_GROWTH_ROUTE_RECOMMENDATIONS as readonly string[]).includes(snap.growthRoute) ?
      (snap.growthRoute as PpcGrowthRouteRecommendation)
    : null;

  const gateLabels: Record<string, string> = {
    adAccountConnected: "Ad account linked",
    offerLinked: "Offer chosen",
    landingLinked: "Landing page set",
    conversionTrackingConfigured: "Tracking in place (tag manager, pixel, or analytics)",
    crmRoutingConfigured: "Leads route to email (Brevo)",
    commsFollowUpConfigured: "Follow-up messages ready",
    readinessThresholdPassed: `Readiness score at least ${PPC_READINESS_MIN_SCORE}`,
  };

  const canPublishMeta =
    c.platform === "meta" && snap?.adReady === true;
  const publishBlockedReason =
    c.platform === "google_ads"
      ? "Google Ads is not sent from here—use Google’s Ads Manager."
      : snap?.adReady !== true
        ? "Run readiness and fix every item in the checklist below first."
        : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/paid-growth/campaigns">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Campaigns
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{c.name}</h2>
          <div className="flex gap-2 mt-2">
            <Badge>{c.status}</Badge>
            <Badge variant="outline">{c.platform}</Badge>
            <Badge variant="secondary">Readiness {c.readinessScore ?? "—"}</Badge>
            {growthRouteKey ?
              <Badge variant="outline" className="border-primary/40">
                {growthRouteRecommendationLabel(growthRouteKey)}
              </Badge>
            : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/paid-growth/campaigns/${id}/structure`}>Structure</Link>
          </Button>
          <Button variant="secondary" onClick={() => readinessMut.mutate()} disabled={readinessMut.isPending}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Run readiness
          </Button>
          <Button
            onClick={() => publishMut.mutate()}
            disabled={publishMut.isPending || !canPublishMeta}
            title={publishBlockedReason ?? undefined}
          >
            <Rocket className="h-4 w-4 mr-2" />
            {c.platform === "meta" ? "Push live to Meta" : "Push live"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modular PPC engine</CardTitle>
          <CardDescription>{engine.adminSummary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2 max-w-md">
            <Label>Campaign model</Label>
            <Select
              value={resolvedModel}
              onValueChange={(v) => modelMut.mutate(v as CampaignModel)}
              disabled={modelMut.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PPC_CAMPAIGN_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {getPpcEngineModuleConfig(m).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Funnel: {engine.funnelType.replace(/-/g, " ")}</Badge>
            <Badge variant="secondary">Attribution: {engine.attribution}</Badge>
            <Badge variant={engine.enableCallTracking ? "default" : "outline"}>
              Call tracking {engine.enableCallTracking ? "recommended" : "optional"}
            </Badge>
            <Badge variant="outline">Optimization lookback ~{engine.optimizationLookbackDays}d</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            <code className="text-[11px]">{resolvedModel}</code> — Call tracking is a product flag for adapters (e.g. future
            call provider); funnel and attribution guide readiness copy and rules engine windows.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where traffic lands</CardTitle>
          <CardDescription>
            Offer <code className="text-xs">{c.offerSlug ?? "—"}</code> · Landing{" "}
            <code className="text-xs">{c.landingPagePath}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(c.trackingParamsJson ?? {}, null, 2)}
          </pre>
          <p className="mt-2">
            Forms should include these tracking fields plus the hidden id{" "}
            <code className="text-xs">ascendra_ppc={c.id}</code> so leads tie back to this campaign.
          </p>
        </CardContent>
      </Card>

      {c.offerIntelligence ? (
        <Card>
          <CardHeader>
            <CardTitle>Offer + lead magnet intelligence</CardTitle>
            <CardDescription>Launch guardrails from Offer Engine and live lead quality data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {c.offerIntelligence.offerSummary ? (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{c.offerIntelligence.offerSummary.slug}</Badge>
                  <Badge>
                    Offer score {c.offerIntelligence.offerSummary.score}
                  </Badge>
                  <Badge variant={c.offerIntelligence.offerSummary.readiness === "Launch Ready" ? "default" : "secondary"}>
                    {c.offerIntelligence.offerSummary.readiness}
                  </Badge>
                </div>
                {c.offerIntelligence.offerSummary.topWeaknesses.length ? (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {c.offerIntelligence.offerSummary.topWeaknesses.slice(0, 3).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No linked Offer Engine template found for this campaign offer slug.
              </p>
            )}

            {c.offerIntelligence.relationshipWarnings.length ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Relationship warnings</p>
                <ul className="list-disc pl-5">
                  {c.offerIntelligence.relationshipWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {snap?.adReady === false && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Not ready for ads</CardTitle>
            <CardDescription>
              Finish the steps in the checklist below—usually starting with the Foundation items—before you push live.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {snap?.gates && (
        <Card>
          <CardHeader>
            <CardTitle>Before you push live</CardTitle>
            <CardDescription>Every line below should show OK (Meta campaigns only for now).</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {Object.entries(snap.gates).map(([k, ok]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
                <span>{gateLabels[k] ?? k}</span>
                <Badge variant={ok ? "default" : "destructive"}>{ok ? "OK" : "Blocked"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {snap?.remediationChecklist && snap.remediationChecklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fix-it list</CardTitle>
            <CardDescription>Built from what failed above</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-decimal pl-5 text-sm space-y-1">
              {snap.remediationChecklist.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {snap?.blockers && snap.blockers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Still blocking progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {snap.blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(c.platformCampaignId || c.lastSyncError) && (
        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
            <CardDescription>
              Campaign ID: {c.platformCampaignId ?? "—"} · Ad set: {c.platformAdSetId ?? "—"}
            </CardDescription>
          </CardHeader>
          {c.lastSyncError && <CardContent className="text-sm text-destructive">{c.lastSyncError}</CardContent>}
        </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Push history</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {(c.publishLogs ?? []).length === 0 ? (
            <p className="text-muted-foreground">Nothing pushed from this screen yet.</p>
          ) : (
            (c.publishLogs ?? []).map((l) => (
              <div key={l.id} className="flex justify-between border-b border-border/50 py-2">
                <span>{l.success ? "Worked" : "Failed"}</span>
                <span className="text-muted-foreground text-xs truncate max-w-[60%]">{l.errorMessage}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
