"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VariantBuilder, type VariantDraft } from "./VariantBuilder";
import { apiRequest } from "@/lib/queryClient";

const TEMPLATES = [
  { value: "headline_test", label: "Headline test" },
  { value: "cta_test", label: "CTA test" },
  { value: "landing_page", label: "Landing page" },
  { value: "google_ads_creative", label: "Google Ads creative" },
  { value: "email_subject", label: "Email / subject" },
  { value: "social_hook", label: "Social hook" },
  { value: "multivariate", label: "Multivariate" },
] as const;

const FUNNEL_STAGES = ["awareness", "consideration", "conversion", "nurture"] as const;

export function CreateExperimentWizard() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [funnelStage, setFunnelStage] = useState<string>("consideration");
  const [personaKey, setPersonaKey] = useState("");
  const [offerType, setOfferType] = useState("lead_magnet");
  const [template, setTemplate] = useState<string>("headline_test");
  const [variants, setVariants] = useState<VariantDraft[]>([
    { key: "control", name: "Control", allocationWeight: 1, isControl: true },
    { key: "variant_a", name: "Variant A", allocationWeight: 1, isControl: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/admin/experiments", {
        key: key.trim().toLowerCase().replace(/\s+/g, "_"),
        name: name.trim(),
        description: description || null,
        hypothesis: hypothesis || null,
        funnelStage,
        primaryPersonaKey: personaKey.trim() || null,
        offerType,
        experimentTemplateKey: template,
        channels: ["web"],
        variants: variants.map((v) => ({
          key: v.key.trim(),
          name: v.name.trim(),
          allocationWeight: v.allocationWeight,
          isControl: v.isControl,
          config: {},
        })),
      });
      const data = (await res.json()) as { id: number };
      router.push(`/admin/experiments/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Definition</CardTitle>
          <CardDescription>Stable key is used in code and tracking metadata (`experiment_key`).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Experiment key</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="homepage_hero_v2" required className="font-mono" />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Homepage hero Q1" required />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Hypothesis (decision memory)</Label>
            <Textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="If we emphasize ROI in the hero, qualified leads increase without hurting volume."
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Funnel stage</Label>
              <Select value={funnelStage} onValueChange={setFunnelStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNNEL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Primary persona key</Label>
              <Input value={personaKey} onChange={(e) => setPersonaKey(e.target.value)} placeholder="journey:founder" />
            </div>
            <div>
              <Label>Offer type</Label>
              <Select value={offerType} onValueChange={setOfferType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_magnet">Lead magnet</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="strategy_call">Strategy call</SelectItem>
                  <SelectItem value="paid_offer">Paid offer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Traffic split uses relative weights when the experiment status is running.</CardDescription>
        </CardHeader>
        <CardContent>
          <VariantBuilder variants={variants} onChange={setVariants} />
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={saving || !key.trim() || !name.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Create experiment
      </Button>
    </form>
  );
}
