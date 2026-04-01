"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ASCENDRA_DELIVERY_TIER,
  SYSTEM_COMPONENT_KEYS,
  SUPPORT_COMPONENT_KEYS,
  SYSTEM_COMPONENT_LABELS,
  SUPPORT_COMPONENT_LABELS,
  PAYMENT_STRUCTURE,
  type AscendraPricingPackage,
  type AscendraDeliveryTier,
} from "@shared/ascendraPricingPackageTypes";
import {
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_NOT_INCLUDED,
  ensurePricingPackage,
  previewPricingForDraft,
} from "@shared/ascendraPricingEngine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Scale, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function money(n: number | undefined | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

function triSelect(
  value: boolean | undefined,
  onChange: (v: boolean | undefined) => void,
): React.ReactNode {
  const s = value === undefined ? "unset" : value ? "yes" : "no";
  return (
    <Select value={s} onValueChange={(v) => onChange(v === "unset" ? undefined : v === "yes")}>
      <SelectTrigger className="max-w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unset">Not set</SelectItem>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  );
}

type DraftRow = {
  id?: number;
  name?: string;
  slug?: string;
  coreProblem?: string | null;
  primaryPromise?: string | null;
  desiredOutcome?: string | null;
};

interface OfferPricingPackageTabProps {
  draft: DraftRow;
  pricingPackage: AscendraPricingPackage | null | undefined;
  onChange: (pkg: AscendraPricingPackage | null) => void;
  offerId: number;
}

export function OfferPricingPackageTab({ draft, pricingPackage, onChange, offerId }: OfferPricingPackageTabProps) {
  const { toast } = useToast();
  const [stripeSyncing, setStripeSyncing] = useState(false);
  const base = ensurePricingPackage(pricingPackage);
  const preview = useMemo(
    () =>
      previewPricingForDraft(
        {
          id: draft.id ?? 0,
          name: draft.name ?? "",
          slug: draft.slug ?? "",
          coreProblem: draft.coreProblem ?? null,
          primaryPromise: draft.primaryPromise ?? null,
          desiredOutcome: draft.desiredOutcome ?? null,
        },
        base,
      ),
    [base, draft],
  );

  const c = preview?.computed;
  const inp = base.inputs;

  const patchInputs = (partial: Partial<typeof inp>) => {
    onChange({
      ...base,
      inputs: { ...inp, ...partial },
    });
  };

  const patchRoot = (partial: Partial<AscendraPricingPackage>) => {
    onChange({ ...base, ...partial, inputs: partial.inputs ? { ...inp, ...partial.inputs } : inp });
  };

  const toggleSystem = (key: (typeof SYSTEM_COMPONENT_KEYS)[number]) => {
    const set = new Set(inp.systemComponents ?? []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    patchInputs({ systemComponents: [...set] });
  };

  const toggleSupport = (key: (typeof SUPPORT_COMPONENT_KEYS)[number]) => {
    const set = new Set(inp.supportComponents ?? []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    patchInputs({ supportComponents: [...set] });
  };

  const syncStripeCatalog = async () => {
    setStripeSyncing(true);
    try {
      const res = await apiRequest("POST", `/api/admin/offer-engine/offers/${offerId}/stripe-catalog`, {});
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        stripeProductId?: string;
        stripePriceIdSetup?: string;
        stripePriceIdMonthly?: string;
      };
      if (!res.ok) {
        toast({
          title: "Stripe sync failed",
          description: j.error ?? `HTTP ${res.status}`,
          variant: "destructive",
        });
        return;
      }
      patchInputs({
        stripeProductId: j.stripeProductId,
        stripePriceIdSetup: j.stripePriceIdSetup,
        stripePriceIdMonthly: j.stripePriceIdMonthly,
      });
      toast({
        title: "Stripe catalog linked",
        description: "Product and price IDs were saved on this template. Reload if another tab changed the offer.",
      });
    } finally {
      setStripeSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/api/admin/offer-engine/export?type=offer&id=${offerId}&format=html`}
          className="text-sm text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Printable offer snapshot (HTML)
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href={`/api/admin/offer-engine/export?type=offer&id=${offerId}&format=crm`}
          className="text-sm text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          CRM JSON
        </Link>
      </div>

      {!pricingPackage ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Initialize Ascendra Pricing &amp; Offer System</CardTitle>
            <CardDescription>
              Adds DFY/DWY/DIY pricing logic, value stack, legal blocks, and validation gates to this template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => onChange(ensurePricingPackage(null))}>
              Enable pricing package
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {pricingPackage ? (
        <>
          <Card className="border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden />
                Value first — revenue model
              </CardTitle>
              <CardDescription>
                Uses your numbers only (average job value × jobs per month). No implied market guarantees.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Average job value (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1"
                  value={inp.avgJobValue ?? ""}
                  onChange={(e) =>
                    patchInputs({ avgJobValue: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Target jobs per month</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1"
                  value={inp.targetJobsPerMonth ?? ""}
                  onChange={(e) =>
                    patchInputs({ targetJobsPerMonth: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                />
              </div>
              <div className="sm:col-span-2 rounded-lg border bg-card p-4 grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Monthly volume</p>
                  <p className="text-lg font-semibold tabular-nums">{money(c?.projectedMonthlyRevenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Annual (modeled)</p>
                  <p className="text-lg font-semibold tabular-nums">{money(c?.projectedAnnualRevenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Break-even vs 1st invoice</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {c?.breakEvenMonthsVsPrice != null ? `${c.breakEvenMonthsVsPrice.toFixed(1)} mo` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Primary delivery tier</CardTitle>
              <CardDescription>Controls legal gates and emphasis. Bands still compute for all three for comparison.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={base.tierFocus ?? "DFY"}
                onValueChange={(v) => patchRoot({ tierFocus: v as AscendraDeliveryTier })}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASCENDRA_DELIVERY_TIER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">DFY inputs</CardTitle>
                <CardDescription className="text-xs">Complexity · time · upside (drives setup ${"2k–7.5k"} / mo ${"300–1k"} band)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["dfyComplexity", "dfyTimeRequired", "dfyRevenuePotential"] as const).map((field) => (
                  <div key={field}>
                    <Label className="text-xs capitalize">{field.replace("dfy", "").replace(/([A-Z])/g, " $1")}</Label>
                    <Select
                      value={(inp[field] as string | undefined) ?? ""}
                      onValueChange={(v) => patchInputs({ [field]: v || undefined })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">DWY inputs</CardTitle>
                <CardDescription className="text-xs">Guidance · duration · clarity → ${"500–2k"} band</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["dwyGuidanceLevel", "dwyDuration", "dwyOutcomeClarity"] as const).map((field) => (
                  <div key={field}>
                    <Label className="text-xs capitalize">{field.replace("dwy", "").replace(/([A-Z])/g, " $1")}</Label>
                    <Select
                      value={(inp[field] as string | undefined) ?? ""}
                      onValueChange={(v) => patchInputs({ [field]: v || undefined })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">DIY / lead-gen</CardTitle>
                <CardDescription className="text-xs">Free or low-ticket (${"0–99"})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="diy-free"
                    checked={inp.diyIsFree === true}
                    onCheckedChange={(ch) => patchInputs({ diyIsFree: ch === true })}
                  />
                  <Label htmlFor="diy-free" className="font-normal">
                    Free entry
                  </Label>
                </div>
                {!inp.diyIsFree ? (
                  <div>
                    <Label>Low-ticket price (cents, max 9900)</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      max={9900}
                      value={inp.diyLowTicketCents ?? ""}
                      onChange={(e) =>
                        patchInputs({ diyLowTicketCents: e.target.value === "" ? undefined : Number(e.target.value) })
                      }
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" aria-hidden />
                Value stack
              </CardTitle>
              <CardDescription>Selections nudge DFY setup / monthly bands with transparent bumps.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-2">System components</p>
                <div className="flex flex-col gap-2">
                  {SYSTEM_COMPONENT_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={(inp.systemComponents ?? []).includes(key)}
                        onCheckedChange={() => toggleSystem(key)}
                      />
                      {SYSTEM_COMPONENT_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Support</p>
                <div className="flex flex-col gap-2">
                  {SUPPORT_COMPONENT_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={(inp.supportComponents ?? []).includes(key)}
                        onCheckedChange={() => toggleSupport(key)}
                      />
                      {SUPPORT_COMPONENT_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Setup (days)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={inp.setupDays ?? ""}
                  onChange={(e) => patchInputs({ setupDays: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Results window (days)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={inp.resultsWindowDays ?? ""}
                  onChange={(e) =>
                    patchInputs({ resultsWindowDays: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                />
              </div>
              <div className="sm:col-span-3">
                <Label>Optimization phase (note)</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={inp.optimizationPhaseNote ?? ""}
                  onChange={(e) => patchInputs({ optimizationPhaseNote: e.target.value || undefined })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Positioning — Problem → System → Outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Problem (client)</Label>
                <Textarea
                  className="mt-1"
                  value={inp.positioningProblem ?? ""}
                  onChange={(e) => patchInputs({ positioningProblem: e.target.value || undefined })}
                  rows={2}
                />
              </div>
              <div>
                <Label>System (what Ascendra installs)</Label>
                <Textarea
                  className="mt-1"
                  value={inp.positioningSystem ?? ""}
                  onChange={(e) => patchInputs({ positioningSystem: e.target.value || undefined })}
                  rows={2}
                  placeholder="We install a system that helps you generate consistent leads and booked jobs without relying on guesswork or random marketing tactics."
                />
              </div>
              <div>
                <Label>Outcome</Label>
                <Textarea
                  className="mt-1"
                  value={inp.positioningOutcome ?? ""}
                  onChange={(e) => patchInputs({ positioningOutcome: e.target.value || undefined })}
                  rows={2}
                />
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Auto statement (saved server-side on save)</p>
                <p>{c?.autoPositioningStatement ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5" aria-hidden />
                Suggested pricing (preview)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Setup override (USD, optional)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={inp.setupPriceOverride ?? ""}
                    onChange={(e) =>
                      patchInputs({ setupPriceOverride: e.target.value === "" ? undefined : Number(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Band: {money(c?.setupPriceRangeUsd?.[0])} – {money(c?.setupPriceRangeUsd?.[1])} + bump{" "}
                    {money(c?.componentBumpSetupUsd)}
                  </p>
                </div>
                <div>
                  <Label>Monthly override (USD, optional)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={inp.monthlyPriceOverride ?? ""}
                    onChange={(e) =>
                      patchInputs({
                        monthlyPriceOverride: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Band: {money(c?.monthlyPriceRangeUsd?.[0])} – {money(c?.monthlyPriceRangeUsd?.[1])}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {(
              [
                {
                  key: "DFY",
                  title: "Done For You",
                  tagline: "We build and run it for you",
                  setup: money(c?.suggestedSetupUsd),
                  monthly: money(c?.suggestedMonthlyUsd),
                  cta: "Highest touch · fastest relief",
                },
                {
                  key: "DWY",
                  title: "Done With You",
                  tagline: "We build it with you",
                  setup: money(c?.suggestedDwyOneTimeUsd),
                  monthly: "—",
                  cta: "Mid-tier guidance",
                },
                {
                  key: "DIY",
                  title: "Done By You",
                  tagline: "You implement with resources",
                  setup: money(c?.suggestedDiyUsd),
                  monthly: "—",
                  cta: "Free / low-ticket entry",
                },
              ] as const
            ).map((col) => (
              <Card
                key={col.key}
                className={cn(
                  "flex flex-col",
                  base.tierFocus === col.key ? "ring-2 ring-primary/40 shadow-sm" : "",
                )}
              >
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit text-xs">
                    {col.key}
                  </Badge>
                  <CardTitle className="text-base">{col.title}</CardTitle>
                  <CardDescription>{col.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2 text-sm mt-auto">
                  <p>
                    <span className="text-muted-foreground">Primary price</span>
                    <br />
                    <span className="font-semibold">{col.key === "DFY" ? col.setup : col.setup}</span>
                  </p>
                  {col.key === "DFY" ? (
                    <p>
                      <span className="text-muted-foreground">+ Monthly</span>
                      <br />
                      <span className="font-semibold">{col.monthly}</span>
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground pt-2 border-t">{col.cta}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legal &amp; scope</CardTitle>
              <CardDescription>Always-on market disclaimer is merged with any custom addendum below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 text-sm bg-muted/30">
                <p className="font-medium mb-1">Payment terms (reference)</p>
                <p className="text-muted-foreground text-xs">{DEFAULT_PAYMENT_TERMS}</p>
              </div>
              <div>
                <Label>Custom disclaimer addendum</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={inp.disclaimerCustom ?? ""}
                  onChange={(e) => patchInputs({ disclaimerCustom: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label>Included (one per line)</Label>
                <Textarea
                  className="mt-1 font-mono text-xs"
                  rows={4}
                  value={(inp.includedCustom ?? []).join("\n")}
                  onChange={(e) =>
                    patchInputs({
                      includedCustom: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <Label>Not included (one per line; defaults suggested)</Label>
                <Textarea
                  className="mt-1 font-mono text-xs"
                  rows={5}
                  value={(inp.notIncludedCustom?.length ? inp.notIncludedCustom : DEFAULT_NOT_INCLUDED).join("\n")}
                  onChange={(e) =>
                    patchInputs({
                      notIncludedCustom: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="agree"
                  checked={inp.agreementAccepted === true}
                  onCheckedChange={(ch) => patchInputs({ agreementAccepted: ch === true })}
                />
                <Label htmlFor="agree" className="font-normal leading-snug">
                  I confirm DFY/DWY scope, payment posture, and disclaimer were reviewed for this template.
                </Label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Signee legal name (internal record)</Label>
                  <Input
                    className="mt-1"
                    value={inp.signeeLegalName ?? ""}
                    onChange={(e) => patchInputs({ signeeLegalName: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label>Captured at (ISO datetime)</Label>
                  <Input
                    className="mt-1"
                    placeholder="2026-03-31T12:00:00.000Z"
                    value={inp.signatureCapturedAt ?? ""}
                    onChange={(e) => patchInputs({ signatureCapturedAt: e.target.value || undefined })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Value vs price validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <Label className="text-xs">Client sees money path?</Label>
                  {triSelect(inp.seesClientMoneyPath, (v) => patchInputs({ seesClientMoneyPath: v }))}
                </div>
                <div>
                  <Label className="text-xs">Price &lt; 1–2 mo modeled gross?</Label>
                  {triSelect(inp.priceUnderOneToTwoMonthRoi, (v) => patchInputs({ priceUnderOneToTwoMonthRoi: v }))}
                </div>
                <div>
                  <Label className="text-xs">Operator personal approval?</Label>
                  {triSelect(inp.adminPersonallyApproves, (v) => patchInputs({ adminPersonallyApproves: v }))}
                </div>
              </div>
              <Separator />
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Internal readiness</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={inp.testedOnInternalBrand === true}
                    onCheckedChange={(ch) => patchInputs({ testedOnInternalBrand: ch === true })}
                  />
                  Tested on internal brand
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={inp.dataAvailableForOffer === true}
                    onCheckedChange={(ch) => patchInputs({ dataAvailableForOffer: ch === true })}
                  />
                  Data available
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={inp.repeatableSystem === true}
                    onCheckedChange={(ch) => patchInputs({ repeatableSystem: ch === true })}
                  />
                  Repeatable system
                </label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="override-pub"
                  checked={base.allowPublishOverride === true}
                  onCheckedChange={(ch) => patchRoot({ allowPublishOverride: ch === true })}
                />
                <Label htmlFor="override-pub" className="font-normal">
                  Admin override: allow publish despite automated publish-block signals (use sparingly)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments (Stripe mapping)</CardTitle>
              <CardDescription>
                Optional IDs for Checkout / Billing — paste manually or use sync from suggested DFY prices (below).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Structure</Label>
                <Select
                  value={inp.paymentStructure ?? "__none__"}
                  onValueChange={(v) =>
                    patchInputs({
                      paymentStructure: v === "__none__" ? undefined : (v as (typeof PAYMENT_STRUCTURE)[number]),
                    })
                  }
                >
                  <SelectTrigger className="mt-1 max-w-md">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not set</SelectItem>
                    {PAYMENT_STRUCTURE.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Stripe product ID</Label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    value={inp.stripeProductId ?? ""}
                    onChange={(e) => patchInputs({ stripeProductId: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label>Price ID — setup</Label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    value={inp.stripePriceIdSetup ?? ""}
                    onChange={(e) => patchInputs({ stripePriceIdSetup: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label>Price ID — monthly</Label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    value={inp.stripePriceIdMonthly ?? ""}
                    onChange={(e) => patchInputs({ stripePriceIdMonthly: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div className="rounded-md border border-border/80 bg-muted/20 p-3 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a Stripe Product plus setup (one-time) and monthly recurring prices from computed suggested DFY
                  amounts. Requires <code className="text-[10px] bg-muted px-1 rounded">STRIPE_SECRET_KEY</code> and{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">ASCENDRA_STRIPE_OFFER_SYNC=1</code>. Empty product
                  or price ID slots are filled; non-empty IDs are kept.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={stripeSyncing}
                  onClick={() => void syncStripeCatalog()}
                  className="gap-2"
                >
                  {stripeSyncing ?
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                  : null}
                  Sync suggested prices to Stripe
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snapshot &amp; gates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                {preview?.validationStatus === "validated" ? (
                  <Badge className="bg-emerald-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Validated
                  </Badge>
                ) : null}
                {preview?.validationStatus === "unvalidated" ? <Badge variant="secondary">Unvalidated (internal)</Badge> : null}
                {preview?.validationStatus === "publish_blocked" ? (
                  <Badge variant="destructive">Publish blocked</Badge>
                ) : null}
                {c?.internalReadiness === "unvalidated" ? <Badge variant="outline">Internal readiness: pending</Badge> : null}
              </div>
              {(c?.checklistWarnings?.length ?? 0) > 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 text-sm">
                      {c!.checklistWarnings!.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
              {(c?.publishBlockedReasons?.length ?? 0) > 0 ? (
                <Alert variant="destructive">
                  <AlertTitle>Publish blockers</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 text-sm">
                      {c!.publishBlockedReasons!.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="rounded-lg border p-4 text-sm space-y-2 bg-card">
                <p>
                  <strong>Core result:</strong> {c?.outcomeStatementSnippet}
                </p>
                <p>
                  <strong>Effective disclaimer:</strong>{" "}
                  <span className="text-muted-foreground text-xs">{c?.legalDisclaimerEffective}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Button type="button" variant="outline" className="text-destructive border-destructive/40" onClick={() => onChange(null)}>
            Remove pricing package from template
          </Button>
        </>
      ) : null}
    </div>
  );
}
