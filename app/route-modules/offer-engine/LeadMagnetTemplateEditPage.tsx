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
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  DELIVERY_METHODS,
  DELIVERY_METHOD_LABELS,
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  LEAD_MAGNET_ENGINE_TYPES,
  LEAD_MAGNET_FORMATS,
  LEAD_MAGNET_FORMAT_LABELS,
  LEAD_MAGNET_TYPE_LABELS,
  QUALIFICATION_INTENTS,
  QUALIFICATION_INTENT_LABELS,
  SCORE_TIER_LABELS,
  TRUST_PURPOSES,
  TRUST_PURPOSE_LABELS,
  VISIBILITY_LEVELS,
  VISIBILITY_LABELS,
} from "@shared/offerEngineConstants";

interface Payload {
  leadMagnet: Record<string, unknown>;
}

export function LeadMagnetTemplateEditPage({ id }: { id: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Payload>({
    queryKey: ["/api/admin/offer-engine/lead-magnets", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/offer-engine/lead-magnets/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const lm = data?.leadMagnet;
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (lm) setDraft(JSON.parse(JSON.stringify(lm)));
  }, [lm]);

  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/admin/offer-engine/lead-magnets/${id}`, body);
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: (json: Payload) => {
      qc.setQueryData(["/api/admin/offer-engine/lead-magnets", id], json);
      setDraft(JSON.parse(JSON.stringify(json.leadMagnet)));
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const dup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/offer-engine/lead-magnets/${id}/duplicate`);
      if (!res.ok) throw new Error("Duplicate failed");
      return res.json();
    },
    onSuccess: (json: { leadMagnet: { id: number } }) => {
      router.push(`/admin/offer-engine/lead-magnets/${json.leadMagnet.id}`);
    },
  });

  const regen = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/offer-engine/lead-magnets/${id}/regenerate-copy`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (json: Payload) => {
      qc.setQueryData(["/api/admin/offer-engine/lead-magnets", id], json);
      setDraft(JSON.parse(JSON.stringify(json.leadMagnet)));
      toast({ title: "Copy regenerated" });
    },
  });

  if (isLoading || !draft) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const b = draft.bridgeToPaidJson as Record<string, string>;
  const p = draft.perceivedOutcomeReviewJson as Record<string, string>;
  const f = draft.funnelAlignmentJson as Record<string, string>;
  const copy = (draft.copyBlocksJson as Record<string, string>) ?? {};
  const score = draft.scoreCacheJson as
    | {
        overall: number;
        tier: string;
        weaknesses: string[];
        recommendedFixes: string[];
        leadMagnetBuilder?: {
          leadMagnetSummary: string;
          hookStrengthScore: number;
          specificityScore: number;
          valueDensityScore: number;
          nextStepAlignmentScore: number;
          offerAlignmentScore: number;
          trafficFitScore: number;
          weaknesses: string[];
          recommendations: string[];
        };
        leadMagnetGrade?: {
          overallScore: number;
          grade: string;
          frictionPoints: string[];
          improvementActions: string[];
          recommendedUseCase: string;
        };
      }
    | null
    | undefined;
  const warns = draft.warningsJson as { messages?: string[]; copySafetyFlags?: string[] } | null | undefined;

  const push = (u: Record<string, unknown>) => setDraft((prev) => ({ ...prev!, ...u }));

  const saveAll = () =>
    save.mutate({
      name: draft.name,
      slug: draft.slug,
      personaId: draft.personaId,
      relatedOfferTemplateId: draft.relatedOfferTemplateId ? Number(draft.relatedOfferTemplateId) : null,
      funnelStage: draft.funnelStage,
      leadMagnetType: draft.leadMagnetType,
      bigProblem: draft.bigProblem,
      smallQuickWin: draft.smallQuickWin,
      format: draft.format,
      promiseHook: draft.promiseHook,
      ctaAfterConsumption: draft.ctaAfterConsumption,
      deliveryMethod: draft.deliveryMethod,
      trustPurpose: draft.trustPurpose,
      qualificationIntent: draft.qualificationIntent,
      status: draft.status,
      visibility: draft.visibility,
      bridgeToPaid: draft.bridgeToPaidJson,
      perceivedOutcomeReview: draft.perceivedOutcomeReviewJson,
      funnelAlignment: draft.funnelAlignmentJson,
      copyBlocks: draft.copyBlocksJson,
    });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/offer-engine/lead-magnets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Lead magnets
          </Link>
        </Button>
        <Button size="sm" onClick={() => saveAll()} disabled={save.isPending}>
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

      <Tabs defaultValue="bridge" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="bridge">Bridge to offer</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="perceived">Perceived outcome</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="copy">Copy</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="bridge" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bridge to paid offer</CardTitle>
              <CardDescription>Required before treating the magnet as conversion-ready.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ["helpsPersonaUnderstand", "What this helps the persona understand"],
                  ["smallWinItCreates", "Small win it creates"],
                  ["doesNotFullySolve", "What it does not fully solve"],
                  ["objectionsReduced", "Objections it reduces"],
                  ["paidStepItPointsTo", "Paid step it points to"],
                  ["ctaShouldComeNext", "CTA that should come next"],
                  ["whyNextStepFeelsNatural", "Why next step feels natural"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Textarea value={b[key] ?? ""} onChange={(e) => push({ bridgeToPaidJson: { ...b, [key]: e.target.value } })} rows={2} className="mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={String(draft.name ?? "")} onChange={(e) => push({ name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={String(draft.slug ?? "")} onChange={(e) => push({ slug: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Persona id</Label>
                  <Input value={String(draft.personaId ?? "")} onChange={(e) => push({ personaId: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Related offer template id</Label>
                  <Input
                    type="number"
                    value={draft.relatedOfferTemplateId != null ? String(draft.relatedOfferTemplateId) : ""}
                    onChange={(e) => push({ relatedOfferTemplateId: e.target.value ? Number(e.target.value) : null })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Funnel stage</Label>
                  <Select value={String(draft.funnelStage)} onValueChange={(v) => push({ funnelStage: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNNEL_STAGES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {FUNNEL_STAGE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lead magnet type</Label>
                  <Select value={String(draft.leadMagnetType)} onValueChange={(v) => push({ leadMagnetType: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_MAGNET_ENGINE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {LEAD_MAGNET_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Format</Label>
                  <Select value={String(draft.format)} onValueChange={(v) => push({ format: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_MAGNET_FORMATS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {LEAD_MAGNET_FORMAT_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery</Label>
                  <Select value={String(draft.deliveryMethod)} onValueChange={(v) => push({ deliveryMethod: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_METHODS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DELIVERY_METHOD_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trust purpose</Label>
                  <Select value={String(draft.trustPurpose)} onValueChange={(v) => push({ trustPurpose: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRUST_PURPOSES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRUST_PURPOSE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Qualification intent</Label>
                  <Select value={String(draft.qualificationIntent)} onValueChange={(v) => push({ qualificationIntent: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATION_INTENTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {QUALIFICATION_INTENT_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Big problem</Label>
                <Textarea value={String(draft.bigProblem ?? "")} onChange={(e) => push({ bigProblem: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Small quick win</Label>
                <Textarea value={String(draft.smallQuickWin ?? "")} onChange={(e) => push({ smallQuickWin: e.target.value })} rows={2} className="mt-1" />
              </div>
              <div>
                <Label>Promise / hook</Label>
                <Textarea value={String(draft.promiseHook ?? "")} onChange={(e) => push({ promiseHook: e.target.value })} rows={2} className="mt-1" />
              </div>
              <div>
                <Label>CTA after consumption</Label>
                <Textarea
                  value={String(draft.ctaAfterConsumption ?? "")}
                  onChange={(e) => push({ ctaAfterConsumption: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perceived" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
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
                    onChange={(e) => push({ perceivedOutcomeReviewJson: { ...p, [key]: e.target.value } })}
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
            <CardContent className="pt-6 space-y-3">
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
                    onChange={(e) => push({ funnelAlignmentJson: { ...f, [key]: e.target.value } })}
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
            <CardContent className="pt-6 space-y-3">
              {(
                [
                  "hook",
                  "whyThisMatters",
                  "whoThisIsFor",
                  "whatTheyllGet",
                  "fastWinStatement",
                  "ctaBlock",
                  "whatHappensNext",
                  "bridgeToOfferBlock",
                  "followUpEmailIntro",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                  <Textarea
                    value={copy[key] ?? ""}
                    onChange={(e) => push({ copyBlocksJson: { ...copy, [key]: e.target.value } })}
                    rows={key === "bridgeToOfferBlock" ? 6 : 3}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="score" className="mt-4">
          <Card>
            <CardContent className="pt-6 text-sm space-y-2">
              {score ? (
                <>
                  <p>
                    <strong>Overall:</strong> {score.overall} — {SCORE_TIER_LABELS[score.tier as keyof typeof SCORE_TIER_LABELS] ?? score.tier}
                  </p>
                  <ul className="list-disc pl-5">
                    {(score.weaknesses ?? []).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground">Save to refresh score.</p>
              )}
              {warns?.messages?.length ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">
                  {warns.messages.join(" ")}
                </div>
              ) : null}
              {score?.leadMagnetBuilder ? (
                <div className="rounded-md border p-3 space-y-2">
                  <strong>Lead magnet builder diagnostics</strong>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <p>Hook: {score.leadMagnetBuilder.hookStrengthScore}</p>
                    <p>Specificity: {score.leadMagnetBuilder.specificityScore}</p>
                    <p>Value density: {score.leadMagnetBuilder.valueDensityScore}</p>
                    <p>Next-step alignment: {score.leadMagnetBuilder.nextStepAlignmentScore}</p>
                    <p>Offer alignment: {score.leadMagnetBuilder.offerAlignmentScore}</p>
                    <p>Traffic fit: {score.leadMagnetBuilder.trafficFitScore}</p>
                  </div>
                </div>
              ) : null}
              {score?.leadMagnetGrade ? (
                <div className="rounded-md border p-3 space-y-1">
                  <strong>Lead magnet grader</strong>
                  <p>
                    Overall: {score.leadMagnetGrade.overallScore} / 100 ·{" "}
                    {score.leadMagnetGrade.grade}
                  </p>
                  <p className="text-muted-foreground">{score.leadMagnetGrade.recommendedUseCase}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3 text-sm">
              <div>
                <strong>Hook</strong>
                <p className="text-muted-foreground whitespace-pre-wrap">{copy.hook}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/offer-engine/export?type=lead_magnet&id=${id}&format=json`} target="_blank" rel="noreferrer">
                    Export JSON
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/offer-engine/export?type=lead_magnet&id=${id}&format=text`} target="_blank" rel="noreferrer">
                    Export text
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publish" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={String(draft.status)} onValueChange={(v) => push({ status: v })}>
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
                <Select value={String(draft.visibility)} onValueChange={(v) => push({ visibility: v })}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
