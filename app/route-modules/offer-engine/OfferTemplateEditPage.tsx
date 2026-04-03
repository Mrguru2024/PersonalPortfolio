"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Loader2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfferPricingPackageTab } from "@/components/ascendra-offer-pricing/OfferPricingPackageTab";
import type { AscendraPricingPackage } from "@shared/ascendraPricingPackageTypes";
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  BUYER_AWARENESS_LABELS,
  BUYER_AWARENESS_STAGES,
  CTA_GOALS,
  CTA_GOAL_LABELS,
  EMOTIONAL_DRIVERS,
  EMOTIONAL_DRIVER_LABELS,
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
  PRICING_MODELS,
  PRICING_MODEL_LABELS,
  RISK_REVERSAL_LABELS,
  RISK_REVERSAL_STYLES,
  SCORE_TIER_LABELS,
  TRUST_BUILDER_LABELS,
  TRUST_BUILDER_TYPES,
  VISIBILITY_LABELS,
  VISIBILITY_LEVELS,
} from "@shared/offerEngineConstants";

interface OfferPayload {
  offer: Record<string, unknown>;
}

export function OfferTemplateEditPage({ id }: { id: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<OfferPayload>({
    queryKey: ["/api/admin/offer-engine/offers", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/offer-engine/offers/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const o = data?.offer;
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (o) setDraft(JSON.parse(JSON.stringify(o)) as Record<string, unknown>);
  }, [o]);

  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/admin/offer-engine/offers/${id}`, body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }
      return res.json();
    },
    onSuccess: (json: OfferPayload) => {
      qc.setQueryData(["/api/admin/offer-engine/offers", id], json);
      setDraft(JSON.parse(JSON.stringify(json.offer)) as Record<string, unknown>);
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const dup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/offer-engine/offers/${id}/duplicate`);
      if (!res.ok) throw new Error("Duplicate failed");
      return res.json();
    },
    onSuccess: (json: { offer: { id: number } }) => {
      toast({ title: "Duplicated" });
      router.push(`/admin/offer-engine/offers/${json.offer.id}`);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const regen = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/offer-engine/offers/${id}/regenerate-copy`);
      if (!res.ok) throw new Error("Regenerate failed");
      return res.json();
    },
    onSuccess: (json: OfferPayload) => {
      qc.setQueryData(["/api/admin/offer-engine/offers", id], json);
      setDraft(JSON.parse(JSON.stringify(json.offer)) as Record<string, unknown>);
      toast({ title: "Copy blocks regenerated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (isLoading || !draft) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = draft.strategyWhyConvertJson as Record<string, string>;
  const p = draft.perceivedOutcomeReviewJson as Record<string, string>;
  const f = draft.funnelAlignmentJson as Record<string, string>;
  const copy = (draft.copyBlocksJson as Record<string, string>) ?? {};
  const score = draft.scoreCacheJson as
    | { overall: number; tier: string; weaknesses: string[]; recommendedFixes: string[]; categoryScores: Record<string, number> }
    | null
    | undefined;
  const warns = draft.warningsJson as { messages?: string[]; copySafetyFlags?: string[] } | null | undefined;

  const pushDraft = (upd: Record<string, unknown>) => setDraft((prev) => ({ ...prev!, ...upd }));

  const saveFromDraft = () => {
    save.mutate({
      name: draft.name,
      slug: draft.slug,
      personaId: draft.personaId,
      industryNiche: draft.industryNiche,
      offerType: draft.offerType,
      buyerAwareness: draft.buyerAwareness,
      coreProblem: draft.coreProblem,
      desiredOutcome: draft.desiredOutcome,
      emotionalDrivers: draft.emotionalDriversJson,
      primaryPromise: draft.primaryPromise,
      tangibleDeliverables: draft.tangibleDeliverables,
      timeToFirstWin: draft.timeToFirstWin,
      trustBuilderType: draft.trustBuilderType,
      pricingModel: draft.pricingModel,
      riskReversalStyle: draft.riskReversalStyle,
      ctaGoal: draft.ctaGoal,
      funnelEntryPoint: draft.funnelEntryPoint,
      funnelNextStep: draft.funnelNextStep,
      status: draft.status,
      visibility: draft.visibility,
      strategyWhyConvert: draft.strategyWhyConvertJson,
      perceivedOutcomeReview: draft.perceivedOutcomeReviewJson,
      funnelAlignment: draft.funnelAlignmentJson,
      copyBlocks: draft.copyBlocksJson,
      pricingPackage: (draft.pricingPackageJson ?? null) as AscendraPricingPackage | null,
    });
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/offer-engine/offers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Offers
          </Link>
        </Button>
        <Button size="sm" onClick={() => saveFromDraft()} disabled={save.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={() => dup.mutate()} disabled={dup.isPending}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button size="sm" variant="outline" onClick={() => regen.mutate()} disabled={regen.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate copy
        </Button>
        <Badge variant="outline">{String(draft.personaId)}</Badge>
        {score ? (
          <Badge>
            {score.overall} — {SCORE_TIER_LABELS[score.tier as keyof typeof SCORE_TIER_LABELS] ?? score.tier}
          </Badge>
        ) : null}
      </div>

      <h1 className="text-2xl font-bold mb-4">{String(draft.name)}</h1>

      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="perceived">Perceived outcome</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="copy">Copy</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Why this offer should convert</CardTitle>
              <CardDescription>Required strategy narrative before heavy copy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ["whyPersonaCares", "Why this persona would care"],
                  ["whyTheyCareNow", "Why they would care now"],
                  ["whatTheyAlreadyTried", "What they already tried"],
                  ["whyMoreBelievableThanAlternatives", "More believable than alternatives because"],
                  ["frictionThatStillExists", "Friction that still exists"],
                  ["whatThisDoesNotSolve", "What this does not solve"],
                  ["bestNextStepIfNotReady", "Best next step if not ready to buy"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Textarea
                    value={s[key] ?? ""}
                    onChange={(e) =>
                      pushDraft({ strategyWhyConvertJson: { ...s, [key]: e.target.value } })
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Offer name</Label>
                  <Input value={String(draft.name ?? "")} onChange={(e) => pushDraft({ name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={String(draft.slug ?? "")} onChange={(e) => pushDraft({ slug: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Persona id</Label>
                  <Input value={String(draft.personaId ?? "")} onChange={(e) => pushDraft({ personaId: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Industry / niche</Label>
                  <Input
                    value={String(draft.industryNiche ?? "")}
                    onChange={(e) => pushDraft({ industryNiche: e.target.value || null })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Offer type</Label>
                  <Select value={String(draft.offerType)} onValueChange={(v) => pushDraft({ offerType: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {OFFER_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Buyer awareness</Label>
                  <Select value={String(draft.buyerAwareness)} onValueChange={(v) => pushDraft({ buyerAwareness: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUYER_AWARENESS_STAGES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {BUYER_AWARENESS_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trust builder</Label>
                  <Select value={String(draft.trustBuilderType)} onValueChange={(v) => pushDraft({ trustBuilderType: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRUST_BUILDER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRUST_BUILDER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pricing model</Label>
                  <Select value={String(draft.pricingModel)} onValueChange={(v) => pushDraft({ pricingModel: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_MODELS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PRICING_MODEL_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Risk reversal</Label>
                  <Select value={String(draft.riskReversalStyle)} onValueChange={(v) => pushDraft({ riskReversalStyle: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_REVERSAL_STYLES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {RISK_REVERSAL_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CTA goal</Label>
                  <Select value={String(draft.ctaGoal)} onValueChange={(v) => pushDraft({ ctaGoal: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CTA_GOALS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {CTA_GOAL_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Core problem</Label>
                <Textarea value={String(draft.coreProblem ?? "")} onChange={(e) => pushDraft({ coreProblem: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Desired outcome</Label>
                <Textarea value={String(draft.desiredOutcome ?? "")} onChange={(e) => pushDraft({ desiredOutcome: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Primary promise</Label>
                <Textarea value={String(draft.primaryPromise ?? "")} onChange={(e) => pushDraft({ primaryPromise: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Tangible deliverables</Label>
                <Textarea
                  value={String(draft.tangibleDeliverables ?? "")}
                  onChange={(e) => pushDraft({ tangibleDeliverables: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Time to first win</Label>
                  <Input value={String(draft.timeToFirstWin ?? "")} onChange={(e) => pushDraft({ timeToFirstWin: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Funnel entry point</Label>
                <Input
                  value={String(draft.funnelEntryPoint ?? "")}
                  onChange={(e) => pushDraft({ funnelEntryPoint: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Funnel next step</Label>
                <Textarea value={String(draft.funnelNextStep ?? "")} onChange={(e) => pushDraft({ funnelNextStep: e.target.value })} rows={2} className="mt-1" />
              </div>
              <div>
                <Label>Emotional drivers</Label>
                <p className="text-xs text-muted-foreground mb-2">Toggle by re-saving; simplified UI lists common set.</p>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONAL_DRIVERS.map((d) => {
                    const cur = (draft.emotionalDriversJson as string[]) ?? [];
                    const on = cur.includes(d);
                    return (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={on ? "default" : "outline"}
                        onClick={() => {
                          const next = on ? cur.filter((x) => x !== d) : [...cur, d];
                          pushDraft({ emotionalDriversJson: next });
                        }}
                      >
                        {EMOTIONAL_DRIVER_LABELS[d]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perceived" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Perceived likely outcome review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  "dreamOutcomeStatement",
                  "currentPainStatement",
                  "whyNowStatement",
                  "trustReason",
                  "believabilityNotes",
                  "timeToValuePerception",
                  "effortPerception",
                  "keyFrictionPoints",
                  "outcomeConfidenceNotes",
                  "actionConfidenceNotes",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                  <Textarea
                    value={p[key] ?? ""}
                    onChange={(e) => pushDraft({ perceivedOutcomeReviewJson: { ...p, [key]: e.target.value } })}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Funnel alignment</CardTitle>
              <CardDescription>Traffic → entry → conversion → CRM → qualification → goal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  "trafficSource",
                  "audienceTemperature",
                  "landingPageType",
                  "conversionAction",
                  "followUpAction",
                  "crmTaggingLogic",
                  "qualificationRoute",
                  "nurtureSequenceRecommendation",
                  "salesHandoffLogic",
                  "finalConversionGoal",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                  <Textarea
                    value={f[key] ?? ""}
                    onChange={(e) => pushDraft({ funnelAlignmentJson: { ...f, [key]: e.target.value } })}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Copy blocks library</CardTitle>
              <CardDescription>Regenerate for a first pass, then edit. Guarantee-safe FAQ included in generator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  "headline",
                  "subheadline",
                  "problemStatement",
                  "desiredResultStatement",
                  "whyNow",
                  "whyThisWorks",
                  "whyAscendra",
                  "deliverablesBlock",
                  "objectionReducer",
                  "ctaBlock",
                  "faqBlock",
                  "guaranteeSafeConfidenceBlock",
                  "valueStackBlock",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                  <Textarea
                    value={copy[key] ?? ""}
                    onChange={(e) => pushDraft({ copyBlocksJson: { ...copy, [key]: e.target.value } })}
                    rows={key === "faqBlock" || key === "valueStackBlock" ? 6 : 3}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="score" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outcome scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {score ? (
                <>
                  <p>
                    <strong>Overall:</strong> {score.overall} / 100 —{" "}
                    {SCORE_TIER_LABELS[score.tier as keyof typeof SCORE_TIER_LABELS] ?? score.tier}
                  </p>
                  <div>
                    <strong>Weaknesses</strong>
                    <ul className="list-disc pl-5">
                      {(score.weaknesses ?? []).map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Recommended fixes</strong>
                    <ul className="list-disc pl-5">
                      {(score.recommendedFixes ?? []).map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Save to compute score.</p>
              )}
              {warns?.messages?.length ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                  <strong className="text-amber-700 dark:text-amber-400">Warnings</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {warns.messages.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {warns?.copySafetyFlags?.length ? (
                <div className="rounded-md border p-3">
                  <strong>Copy safety</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {warns.copySafetyFlags.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Template preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm whitespace-pre-wrap">
              <div>
                <strong>Headline</strong>
                <p className="text-muted-foreground">{copy.headline}</p>
              </div>
              <div>
                <strong>CTA</strong>
                <p className="text-muted-foreground">{copy.ctaBlock}</p>
              </div>
              <div>
                <strong>Strategy (why now)</strong>
                <p className="text-muted-foreground">{s.whyTheyCareNow}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/offer-engine/export?type=offer&id=${id}&format=json`} target="_blank" rel="noreferrer">
                    Export JSON
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/offer-engine/export?type=offer&id=${id}&format=text`} target="_blank" rel="noreferrer">
                    Export text
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <OfferPricingPackageTab
            offerId={id}
            draft={{
              id,
              name: String(draft.name ?? ""),
              slug: String(draft.slug ?? ""),
              coreProblem: draft.coreProblem as string | null,
              primaryPromise: draft.primaryPromise as string | null,
              desiredOutcome: draft.desiredOutcome as string | null,
            }}
            pricingPackage={draft.pricingPackageJson as AscendraPricingPackage | null | undefined}
            onChange={(pkg) => pushDraft({ pricingPackageJson: pkg })}
          />
        </TabsContent>

        <TabsContent value="publish" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={String(draft.status)} onValueChange={(v) => pushDraft({ status: v })}>
                  <SelectTrigger className="mt-1 max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ASSET_STATUS_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibility</Label>
                <Select value={String(draft.visibility)} onValueChange={(v) => pushDraft({ visibility: v })}>
                  <SelectTrigger className="mt-1 max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_LEVELS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {VISIBILITY_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Client-facing exposure is controlled here for future use; public site wiring stays separate from this template store.
              </p>
              {draft.pricingPackageJson &&
              typeof draft.pricingPackageJson === "object" &&
              (draft.pricingPackageJson as { validationStatus?: string }).validationStatus === "publish_blocked" &&
              (String(draft.visibility) === "live_public" ||
                String(draft.visibility) === "admin_approved_client_facing") ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  Pricing package has <strong>publish blocked</strong> status. Lower visibility to private review or resolve
                  validation on the Pricing &amp; value tab (or use documented admin override there).
                </div>
              ) : null}
              {draft.pricingPackageJson &&
              typeof draft.pricingPackageJson === "object" &&
              (draft.pricingPackageJson as { computed?: { internalReadiness?: string } }).computed?.internalReadiness ===
                "unvalidated" &&
              (String(draft.visibility) === "live_public" ||
                String(draft.visibility) === "admin_approved_client_facing") ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  Readiness status is <strong>unvalidated</strong>. Client-facing exposure is risky until review gates
                  are checked on the Pricing &amp; value tab.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
