"use client";

import { useEffect, useState } from "react";
import type { ProposalPrepProfitabilityInputs } from "@shared/crmSchema";
import { computeProposalProfitability } from "@/lib/proposal-prep-profitability";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

export interface ProposalPrepProfitabilityCardProps {
  initial: ProposalPrepProfitabilityInputs | null | undefined;
  onSave: (inputs: ProposalPrepProfitabilityInputs) => void;
  isSaving: boolean;
}

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function ProposalPrepProfitabilityCard({ initial, onSave, isSaving }: ProposalPrepProfitabilityCardProps) {
  const [quoted, setQuoted] = useState("");
  const [hours, setHours] = useState("");
  const [hourly, setHourly] = useState("");
  const [passThrough, setPassThrough] = useState("");
  const [commission, setCommission] = useState("");
  const [targetMargin, setTargetMargin] = useState("");

  useEffect(() => {
    const p = initial ?? {};
    setQuoted(p.quotedPrice != null ? String(p.quotedPrice) : "");
    setHours(p.internalHours != null ? String(p.internalHours) : "");
    setHourly(p.hourlyCost != null ? String(p.hourlyCost) : "");
    setPassThrough(p.passThroughCosts != null ? String(p.passThroughCosts) : "");
    setCommission(p.salesCommissionPct != null ? String(p.salesCommissionPct) : "");
    setTargetMargin(p.targetGrossMarginPct != null ? String(p.targetGrossMarginPct) : "");
  }, [initial]);

  const inputs: ProposalPrepProfitabilityInputs = {
    quotedPrice: parseNum(quoted),
    internalHours: parseNum(hours),
    hourlyCost: parseNum(hourly),
    passThroughCosts: parseNum(passThrough),
    salesCommissionPct: parseNum(commission),
    targetGrossMarginPct: parseNum(targetMargin),
  };

  const m = computeProposalProfitability(inputs);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Profitability calculator
        </CardTitle>
        <CardDescription>
          Internal loaded cost, pass-through spend, and commission as a percent of quoted price. Figures are for your
          desk only — not shown to the client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pp-quoted">Quoted / target price (USD)</Label>
            <Input id="pp-quoted" inputMode="decimal" value={quoted} onChange={(e) => setQuoted(e.target.value)} placeholder="e.g. 25000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-hours">Internal hours</Label>
            <Input id="pp-hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 80" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-hourly">Blended hourly cost (USD)</Label>
            <Input id="pp-hourly" inputMode="decimal" value={hourly} onChange={(e) => setHourly(e.target.value)} placeholder="Loaded cost / hr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-pass">Pass-through costs (USD)</Label>
            <Input id="pp-pass" inputMode="decimal" value={passThrough} onChange={(e) => setPassThrough(e.target.value)} placeholder="Tools, subs, licenses" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-comm">Sales commission (% of price)</Label>
            <Input id="pp-comm" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="0–100" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-margin">Target gross margin (%)</Label>
            <Input id="pp-margin" inputMode="decimal" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} placeholder="For suggested price" />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm dark:bg-muted/15">
          <p className="font-medium text-foreground">Snapshot</p>
          <ul className="grid gap-1 sm:grid-cols-2 text-muted-foreground">
            <li>Internal labor: <span className="text-foreground tabular-nums">{formatMoney(m.internalLaborCost)}</span></li>
            <li>Pass-through: <span className="text-foreground tabular-nums">{formatMoney(m.passThroughCosts)}</span></li>
            <li>Commission: <span className="text-foreground tabular-nums">{formatMoney(m.commissionAmount)}</span></li>
            <li>Total cost: <span className="text-foreground font-medium tabular-nums">{formatMoney(m.totalCost)}</span></li>
            <li>Gross profit: <span className="text-foreground font-medium tabular-nums">{formatMoney(m.grossProfit)}</span></li>
            <li>Gross margin: <span className="text-foreground font-medium tabular-nums">{m.grossMarginPct}%</span></li>
          </ul>
          {m.suggestedPriceForTargetMargin != null && (
            <p className="pt-2 text-muted-foreground border-t border-border/60">
              Suggested price for ~{inputs.targetGrossMarginPct ?? "—"}% margin (before tax nuances):{" "}
              <span className="font-semibold text-foreground tabular-nums">{formatMoney(m.suggestedPriceForTargetMargin)}</span>
            </p>
          )}
        </div>

        <Button type="button" onClick={() => onSave(inputs)} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save calculator inputs to workspace"}
        </Button>
      </CardContent>
    </Card>
  );
}
