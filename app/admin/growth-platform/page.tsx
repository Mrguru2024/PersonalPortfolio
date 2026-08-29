"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, ExternalLink, Layers, LineChart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AscendraOfferTier, AscendraOfferTierDefinition } from "@shared/ascendraOfferStack";
import { ASCENDRA_OFFER_TIERS, formatUsdRange } from "@shared/ascendraOfferStack";
import type { PpcEngineModuleConfig } from "@shared/ppcCampaignModel";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useShowAdminTechnicalCopy } from "@/components/admin/AdminDevOnly";

type PersonaPricingRow = {
  id: number;
  personaKey: string;
  label: string | null;
  dfySetupMultiplier: number;
  dfyMonthlyMultiplier: number;
  dwyProgramMultiplier: number;
};

type CatalogResponse = {
  offerStack: Record<AscendraOfferTier, AscendraOfferTierDefinition>;
  offerStackPersonaKey?: string | null;
  personaPricing?: PersonaPricingRow[];
  ppcCampaignModels: PpcEngineModuleConfig[];
};

/** Stable id for new operator-created segments when they only enter a display name. */
function slugPersonaKeyFromLabel(label: string): string {
  const s = label
    .toLowerCase()
    .trim()
    .replace(/[''"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 48);
}

export default function AdminGrowthPlatformPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const showTechnical = useShowAdminTechnicalCopy();
  const router = useRouter();
  const [previewPersona, setPreviewPersona] = useState<string | null>(null);
  const [pKey, setPKey] = useState("");
  const [pLabel, setPLabel] = useState("");
  const [pDfyS, setPDfyS] = useState("1");
  const [pDfyM, setPDfyM] = useState("1");
  const [pDwy, setPDwy] = useState("1");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/growth-platform/catalog", previewPersona ?? ""],
    queryFn: async () => {
      const q = previewPersona ? `?persona=${encodeURIComponent(previewPersona)}` : "";
      const res = await fetch(`/api/admin/growth-platform/catalog${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json() as Promise<CatalogResponse>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  /** If segment was chosen before persona rows loaded, hydrate the form once data is available. */
  useEffect(() => {
    if (showTechnical || !previewPersona || !data?.personaPricing?.length || pKey) return;
    const row = data.personaPricing.find((p) => p.personaKey === previewPersona);
    if (!row) return;
    setPKey(row.personaKey);
    setPLabel(row.label ?? "");
    setPDfyS(String(row.dfySetupMultiplier));
    setPDfyM(String(row.dfyMonthlyMultiplier));
    setPDwy(String(row.dwyProgramMultiplier));
  }, [showTechnical, previewPersona, data?.personaPricing, pKey]);

  const handleTechnicalPreviewChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreviewPersona(e.target.value ? e.target.value : null);
  }, []);

  const handleOperatorSegmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      const next = v || null;
      setPreviewPersona(next);
      if (!next) {
        setPKey("");
        setPLabel("");
        setPDfyS("1");
        setPDfyM("1");
        setPDwy("1");
        return;
      }
      const row = data?.personaPricing?.find((p) => p.personaKey === v);
      if (row) {
        setPKey(row.personaKey);
        setPLabel(row.label ?? "");
        setPDfyS(String(row.dfySetupMultiplier));
        setPDfyM(String(row.dfyMonthlyMultiplier));
        setPDwy(String(row.dwyProgramMultiplier));
      }
    },
    [data?.personaPricing],
  );

  const mergedStackPersonaLabel = useMemo(() => {
    const key = data?.offerStackPersonaKey;
    if (!key) return null;
    const row = data?.personaPricing?.find((p) => p.personaKey === key);
    return row?.label?.trim() || row?.personaKey || key;
  }, [data?.offerStackPersonaKey, data?.personaPricing]);

  const savePersonaMut = useMutation({
    mutationFn: async (): Promise<{ personaKey: string }> => {
      const personaKey = showTechnical
        ? pKey.trim().toLowerCase()
        : (pKey.trim().toLowerCase() || slugPersonaKeyFromLabel(pLabel));
      if (!personaKey) {
        throw new Error(
          showTechnical ? "Persona key is required." : "Add a display name for the new segment, or pick one to edit.",
        );
      }
      const res = await fetch("/api/admin/growth-platform/persona-pricing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaKey,
          label: pLabel.trim() || null,
          dfySetupMultiplier: Number(pDfyS) || 1,
          dfyMonthlyMultiplier: Number(pDfyM) || 1,
          dwyProgramMultiplier: Number(pDwy) || 1,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? `Save failed (${res.status})`);
      return { personaKey };
    },
    onSuccess: async ({ personaKey }) => {
      await qc.invalidateQueries({ queryKey: ["/api/admin/growth-platform/catalog"] });
      if (!showTechnical) {
        setPKey(personaKey);
        setPreviewPersona(personaKey);
      }
      toast({
        title: "Saved",
        description: showTechnical
          ? "Persona multipliers updated."
          : "Segment pricing saved. The offer stack below matches this segment.",
      });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {authLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </span>
        ) : (
          "Redirecting…"
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1 text-muted-foreground" asChild>
            <Link href="/admin/system">
              <ArrowLeft className="h-4 w-4" />
              Admin system
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Growth System Platform</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {showTechnical ? (
              <>
                Source-of-truth catalog for the public DFY / DWY / DIY stack and PPC campaign models. Pricing bands live
                in{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">shared/ascendraOfferStack.ts</code>
                ; experiments and copy variants use{" "}
                <Link href="/admin/experiments" className="font-medium text-primary underline-offset-4 hover:underline">
                  Experiments
                </Link>
                .
              </>
            ) : (
              <>
                Catalog for the public done-for-you, done-with-you, and self-serve offers plus paid campaign templates.
                Default price ranges are maintained in product configuration; headline tests and variants live under{" "}
                <Link href="/admin/experiments" className="font-medium text-primary underline-offset-4 hover:underline">
                  Experiments
                </Link>
                .
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/growth-platform" className="gap-1">
              Public hub
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/offers">Site offers (JSON)</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/leads">Leads &amp; CRM</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/growth-platform/agreements">Service agreements</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/growth-platform/clauses">Clause library</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/growth-platform/legal-funnel">Legal &amp; funnel</Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/80 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {showTechnical ? "Persona offer multipliers (DB)" : "Audience segment pricing"}
          </CardTitle>
          <CardDescription>
            {showTechnical ? (
              <>
                Applied to DFY setup/monthly and DWY program cent ranges for quoting. Preview stack with the selector;
                save adds or updates a row by{" "}
                <code className="text-xs bg-muted px-1">personaKey</code> (e.g. journey persona id).
              </>
            ) : (
              <>
                Choose a saved segment to edit, or stay on <span className="font-medium text-foreground">Standard</span>{" "}
                to add one. Adjust the three multipliers vs baseline (1.0 = normal). The offer stack below updates to
                match your choice.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTechnical ? (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1 min-w-[200px] flex-1">
                  <Label className="text-xs">Preview merged stack</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={previewPersona ?? ""}
                    onChange={handleTechnicalPreviewChange}
                  >
                    <option value="">Base code catalog</option>
                    {(data?.personaPricing ?? []).map((r) => (
                      <option key={r.id} value={r.personaKey}>
                        {r.label || r.personaKey}
                      </option>
                    ))}
                  </select>
                </div>
                {data?.offerStackPersonaKey ?
                  <span className="text-xs text-muted-foreground pb-2">Showing: {data.offerStackPersonaKey}</span>
                : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t pt-4">
                <div className="space-y-1">
                  <Label className="text-xs">personaKey</Label>
                  <Input value={pKey} onChange={(e) => setPKey(e.target.value)} placeholder="marcus" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input value={pLabel} onChange={(e) => setPLabel(e.target.value)} placeholder="Display name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DFY setup ×</Label>
                  <Input value={pDfyS} onChange={(e) => setPDfyS(e.target.value)} type="number" step="0.05" min={0.25} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DFY monthly ×</Label>
                  <Input value={pDfyM} onChange={(e) => setPDfyM(e.target.value)} type="number" step="0.05" min={0.25} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DWY program ×</Label>
                  <Input value={pDwy} onChange={(e) => setPDwy(e.target.value)} type="number" step="0.05" min={0.25} />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!pKey.trim() || savePersonaMut.isPending}
                onClick={() => savePersonaMut.mutate()}
              >
                Save persona multipliers
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="growth-segment-select" className="text-sm font-medium">
                  Segment
                </Label>
                <select
                  id="growth-segment-select"
                  className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={previewPersona ?? ""}
                  onChange={handleOperatorSegmentChange}
                >
                  <option value="">Standard pricing — add a new segment below</option>
                  {(data?.personaPricing ?? []).map((r) => (
                    <option key={r.id} value={r.personaKey}>
                      {r.label?.trim() || r.personaKey}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground max-w-lg">
                  {previewPersona ?
                    <>You&apos;re editing{" "}
                    <span className="font-medium text-foreground">
                      {mergedStackPersonaLabel ?? previewPersona}
                    </span>
                    . The stack below shows these multipliers.</>
                  : <>
                    You&apos;re adding a segment. Name it, set multipliers, then save — a short id is created from the
                    name.
                  </>}
                </p>
              </div>

              <div className="space-y-4 border-t border-border/60 pt-4 max-w-xl">
                {previewPersona && pKey ?
                  <p className="text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
                    Internal id <code className="text-[11px] bg-background px-1 py-0.5 rounded">{pKey}</code>
                    {" — "}
                    use the same id in journey targeting if you segment quotes by persona.
                  </p>
                : null}

                <div className="space-y-1.5">
                  <Label htmlFor="segment-display-name" className="text-sm">
                    Display name
                  </Label>
                  <Input
                    id="segment-display-name"
                    value={pLabel}
                    onChange={(e) => setPLabel(e.target.value)}
                    placeholder="e.g. Studio owners, Local services"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Setup fee vs baseline</Label>
                    <Input value={pDfyS} onChange={(e) => setPDfyS(e.target.value)} type="number" step="0.05" min={0.25} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Monthly vs baseline</Label>
                    <Input value={pDfyM} onChange={(e) => setPDfyM(e.target.value)} type="number" step="0.05" min={0.25} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Program vs baseline</Label>
                    <Input value={pDwy} onChange={(e) => setPDwy(e.target.value)} type="number" step="0.05" min={0.25} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  1.0 matches standard catalog pricing. Example: 1.1 ≈ 10% higher, 0.9 ≈ 10% lower.
                </p>

                <Button
                  type="button"
                  size="sm"
                  disabled={
                    savePersonaMut.isPending ||
                    (previewPersona ? !pKey.trim() : !slugPersonaKeyFromLabel(pLabel))
                  }
                  onClick={() => savePersonaMut.mutate()}
                >
                  Save segment pricing
                </Button>
              </div>
            </>
          )}

          {(data?.personaPricing?.length ?? 0) > 0 ?
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {showTechnical ? "Saved rows" : "Saved segments"}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {data!.personaPricing!.map((r) => (
                  <li key={r.id}>
                    {showTechnical ? (
                      <>
                        <strong className="text-foreground">{r.personaKey}</strong>
                        {r.label ? ` (${r.label})` : ""} — DFY setup {r.dfySetupMultiplier}×, monthly{" "}
                        {r.dfyMonthlyMultiplier}×, DWY {r.dwyProgramMultiplier}×
                      </>
                    ) : (
                      <>
                        <strong className="text-foreground">{r.label?.trim() || r.personaKey}</strong>
                        {r.label?.trim() ? ` · id ${r.personaKey}` : ""} — setup {r.dfySetupMultiplier}×, monthly{" "}
                        {r.dfyMonthlyMultiplier}×, program {r.dwyProgramMultiplier}×
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          : null}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading catalog…
        </div>
      )}
      {isError && (
        <p className="text-sm text-destructive">Could not load catalog. Try again or check server logs.</p>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/80 bg-card/50 lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Offer stack</CardTitle>
              </div>
              <CardDescription>
                {showTechnical ? "Three tiers — aligned to commercial bands in code." : "Three tiers aligned to standard commercial bands."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ASCENDRA_OFFER_TIERS.map((tier) => {
                const o = data.offerStack[tier];
                return (
                  <div
                    key={tier}
                    className="rounded-lg border border-border/60 bg-background/60 p-4 dark:bg-background/40"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={tier === "DFY" ? "default" : "secondary"}
                        className={cn(tier === "DFY" && "bg-emerald-600 hover:bg-emerald-600")}
                      >
                        {tier}
                      </Badge>
                      <span className="font-medium">{o.title}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{o.headlineOutcome}</p>
                    <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
                      {o.pricing.setup && (
                        <>
                          <dt className="text-muted-foreground">Setup</dt>
                          <dd>{formatUsdRange(o.pricing.setup)}</dd>
                        </>
                      )}
                      {o.pricing.monthly && (
                        <>
                          <dt className="text-muted-foreground">Monthly</dt>
                          <dd>{formatUsdRange(o.pricing.monthly)}</dd>
                        </>
                      )}
                      {o.pricing.program && (
                        <>
                          <dt className="text-muted-foreground">Program</dt>
                          <dd>{formatUsdRange(o.pricing.program)}</dd>
                        </>
                      )}
                      <dt className="text-muted-foreground">ROI example</dt>
                      <dd className="text-foreground/90">{o.roiFramingExample}</dd>
                    </dl>
                    <p className="mt-2 text-[11px] text-muted-foreground">{o.pricing.note}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/80 bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">PPC campaign models</CardTitle>
                </div>
                <CardDescription>Funnel + attribution defaults for paid growth.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.ppcCampaignModels.map((m) => (
                  <div key={m.campaignModel} className="rounded-md border border-border/50 p-3 text-sm">
                    <div className="font-medium">{m.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{m.adminSummary}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {m.funnelType}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {m.attribution}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/admin/paid-growth">Open Growth Engine</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
