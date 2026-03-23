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
import { PPC_READINESS_MIN_SCORE } from "@shared/ppcBusinessRules";

type CampaignRow = {
  id: number;
  name: string;
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
      return res.json() as Promise<CampaignRow>;
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

  const publishMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/paid-growth/campaigns/${id}/publish`, {});
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Publish failed");
      return j;
    },
    onSuccess: (d: { message?: string }) => {
      toast({ title: "Publish", description: d.message ?? "OK" });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", id] });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Publish error", description: e.message, variant: "destructive" }),
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

  const snap = c.readinessSnapshotJson as {
    blockers?: string[];
    scores?: Record<string, number>;
    gates?: Record<string, boolean>;
    remediationChecklist?: string[];
    package?: string;
    adReady?: boolean;
  } | null;

  const gateLabels: Record<string, string> = {
    adAccountConnected: "Ad account connected",
    offerLinked: "Offer linked",
    landingLinked: "Landing page linked",
    conversionTrackingConfigured: "Conversion tracking (2+ of GTM / pixel / GA)",
    crmRoutingConfigured: "CRM routing (Brevo)",
    commsFollowUpConfigured: "Communications follow-up",
    readinessThresholdPassed: `Readiness ≥ ${PPC_READINESS_MIN_SCORE}`,
  };

  const canPublishMeta =
    c.platform === "meta" && snap?.adReady === true;
  const publishBlockedReason =
    c.platform === "google_ads" ? "Google Ads publish from the dashboard is not supported — use Ads Manager or extend the API integration."
    : snap?.adReady !== true ? "Run readiness and clear all gates (Foundation remediation if needed)."
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
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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
            Publish
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routing & attribution</CardTitle>
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
            Forms should pass these UTMs + hidden <code className="text-xs">ascendra_ppc={c.id}</code> for internal joins.
          </p>
        </CardContent>
      </Card>

      {snap?.adReady === false && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Not ad ready</CardTitle>
            <CardDescription>
              Required next step: <strong>Foundation</strong> package track — complete the remediation checklist below before
              publishing.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {snap?.gates && (
        <Card>
          <CardHeader>
            <CardTitle>Publish gates</CardTitle>
            <CardDescription>All must pass before dashboard publish (Meta: traffic / leads objectives only).</CardDescription>
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
            <CardTitle>Remediation checklist</CardTitle>
            <CardDescription>Generated from failed gates and scoring blockers</CardDescription>
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
            <CardTitle>Scoring blockers</CardTitle>
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
          <CardTitle>Publish log</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {(c.publishLogs ?? []).length === 0 ? (
            <p className="text-muted-foreground">No publish attempts yet.</p>
          ) : (
            (c.publishLogs ?? []).map((l) => (
              <div key={l.id} className="flex justify-between border-b border-border/50 py-2">
                <span>{l.success ? "OK" : "Failed"}</span>
                <span className="text-muted-foreground text-xs truncate max-w-[60%]">{l.errorMessage}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
