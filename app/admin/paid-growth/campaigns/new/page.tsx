"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PPC_CAMPAIGN_MODELS,
  type CampaignModel,
  getPpcEngineModuleConfig,
} from "@shared/ppcCampaignModel";
import { Badge } from "@/components/ui/badge";

export default function NewPaidGrowthCampaignPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("meta");
  const [objective, setObjective] = useState("traffic");
  const [clientLabel, setClientLabel] = useState("");
  const [offerSlug, setOfferSlug] = useState("");
  const [landingPath, setLandingPath] = useState("/");
  const [personaId, setPersonaId] = useState("");
  const [budgetDailyCents, setBudgetDailyCents] = useState("500");
  const [utmSource, setUtmSource] = useState("google");
  const [utmMedium, setUtmMedium] = useState("cpc");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [headline, setHeadline] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [ppcAccountId, setPpcAccountId] = useState<string>("");
  const [commCampaignId, setCommCampaignId] = useState<string>("");
  const [campaignModel, setCampaignModel] = useState<CampaignModel>("LEAD_GEN_FUNNEL");

  const engine = useMemo(() => getPpcEngineModuleConfig(campaignModel), [campaignModel]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: ctx } = useQuery({
    queryKey: ["/api/admin/paid-growth/context"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/context");
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{
        offers: { slug: string; name: string }[];
        offerTemplates: { id: number; slug: string; name: string; overallScore: number | null; readinessStatus: string | null }[];
        leadMagnetTemplates: {
          id: number;
          slug: string;
          name: string;
          overallScore: number | null;
          grade: string | null;
          relatedOfferTemplateId: number | null;
        }[];
        funnelSlugs: { slug: string }[];
        personas: { id: string; displayName: string }[];
        commCampaigns: { id: number; name: string }[];
      }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/admin/paid-growth/accounts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/accounts");
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ id: number; nickname: string; platform: string }[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/paid-growth/campaigns", {
        name,
        platform,
        objective,
        clientLabel: clientLabel || undefined,
        offerSlug: offerSlug || undefined,
        landingPagePath: landingPath,
        personaId: personaId || undefined,
        budgetDailyCents: Number(budgetDailyCents) || null,
        trackingParamsJson: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign || name.toLowerCase().replace(/\s+/g, "_"),
        },
        adCopyJson: { headline, primaryText },
        locationTargetingJson: { countries: ["US"] },
        ppcAdAccountId: ppcAccountId ? Number(ppcAccountId) : null,
        commCampaignId: commCampaignId ? Number(commCampaignId) : null,
        publishPausedDefault: true,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      return res.json() as Promise<{ id: number }>;
    },
    onSuccess: (d) => {
      toast({ title: "Campaign created" });
      router.push(`/admin/paid-growth/campaigns/${d.id}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/paid-growth/campaigns">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Campaigns
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Campaign builder</CardTitle>
          <CardDescription>Links to site offers, funnel paths, personas, and optional Communications campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="space-y-2">
              <Label>Campaign model (PPC engine)</Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pick the business type—Ascendra applies defaults for call tracking posture, funnel shape, and how aggressively
                we interpret lag between clicks and outcomes.
              </p>
              <Select value={campaignModel} onValueChange={(v) => setCampaignModel(v as CampaignModel)}>
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
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Funnel: {engine.funnelType.replace(/-/g, " ")}</Badge>
              <Badge variant="secondary">Attribution: {engine.attribution}</Badge>
              <Badge variant={engine.enableCallTracking ? "default" : "outline"}>
                Call tracking {engine.enableCallTracking ? "on" : "off"}
              </Badge>
              <Badge variant="outline">Rules lookback ~{engine.optimizationLookbackDays}d</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{engine.adminSummary}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Client / project label</Label>
              <Input value={clientLabel} onChange={(e) => setClientLabel(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta (dashboard publish supported)</SelectItem>
                  <SelectItem value="google_ads">Google Ads — not publishable from dashboard</SelectItem>
                </SelectContent>
              </Select>
              {platform === "google_ads" && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Google campaigns are high-touch: Ascendra validates credentials only. Publishing from this UI is blocked by
                  product rules.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Objective (Meta)</Label>
              <Select value={objective} onValueChange={setObjective} disabled={platform !== "meta"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic">Traffic — supported</SelectItem>
                  <SelectItem value="leads">Leads — supported</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Other Meta objectives are unsupported for automated publish; use Ads Manager for high-risk or experimental
                types.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>PPC ad account record</Label>
            <Select value={ppcAccountId || "__none__"} onValueChange={(v) => setPpcAccountId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional — defaults to env META_AD_ACCOUNT_ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Env default</SelectItem>
                {accounts
                  .filter((a) => a.platform === platform)
                  .map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nickname}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Offer (site_offers.slug)</Label>
            <Select value={offerSlug || "__none__"} onValueChange={(v) => setOfferSlug(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select offer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(ctx?.offers ?? []).map((o) => (
                  <SelectItem key={o.slug} value={o.slug}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ctx?.offerTemplates?.length ? (
              <p className="text-xs text-muted-foreground">
                Offer Engine templates:{" "}
                {ctx.offerTemplates
                  .slice(0, 3)
                  .map((t) => `${t.name} (${t.overallScore ?? "—"})`)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
          {ctx?.offerTemplates?.length || ctx?.leadMagnetTemplates?.length ? (
            <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-2">
              <p className="font-medium">Offer/Magnet launch guidance</p>
              {ctx?.offerTemplates?.some((o) => (o.overallScore ?? 0) < 60) ? (
                <p className="text-amber-700 dark:text-amber-300">
                  Some linked offer templates score below 60. Run Offer Engine fixes before cold-traffic launch.
                </p>
              ) : null}
              {ctx?.leadMagnetTemplates?.some((lm) => (lm.overallScore ?? 0) < 60) ? (
                <p className="text-amber-700 dark:text-amber-300">
                  Some lead magnets score weak/usable only. Use stronger hooks and bridge-to-offer before scaling.
                </p>
              ) : null}
              {ctx?.offerTemplates?.every((o) => (o.overallScore ?? 0) >= 60) &&
              ctx?.leadMagnetTemplates?.every((lm) => (lm.overallScore ?? 0) >= 60) ? (
                <p className="text-emerald-700 dark:text-emerald-300">
                  Available offer and lead magnet templates look launch-safe for paid testing.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Landing page path</Label>
            <Input value={landingPath} onChange={(e) => setLandingPath(e.target.value)} placeholder="/launch-your-brand" />
            <p className="text-xs text-muted-foreground">Funnel slugs in CMS: {(ctx?.funnelSlugs ?? []).map((f) => f.slug).join(", ") || "—"}</p>
          </div>
          <div className="space-y-2">
            <Label>Persona</Label>
            <Select value={personaId || "__none__"} onValueChange={(v) => setPersonaId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(ctx?.personas ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Daily budget (cents)</Label>
            <Input value={budgetDailyCents} onChange={(e) => setBudgetDailyCents(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>utm_source</Label>
              <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>utm_medium</Label>
              <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>utm_campaign</Label>
              <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Communications follow-up (required for publish)</Label>
            <Select value={commCampaignId} onValueChange={setCommCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a comms campaign" />
              </SelectTrigger>
              <SelectContent>
                {(ctx?.commCampaigns ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Every PPC launch must enqueue an Ascendra Communications path after capture — no isolated PPC-only lead flows.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Ad headline</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Primary text</Label>
            <Textarea value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} rows={3} />
          </div>
          <Button onClick={() => saveMut.mutate()} disabled={!name.trim() || saveMut.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Create draft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
