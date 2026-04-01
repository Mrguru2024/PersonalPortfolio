"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  BUYER_AWARENESS_STAGES,
  CTA_GOALS,
  OFFER_TYPES,
  PRICING_MODELS,
  RISK_REVERSAL_STYLES,
  TRUST_BUILDER_TYPES,
} from "@shared/offerEngineConstants";

export default function NewOfferTemplatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("New offer template");
  const [slug, setSlug] = useState("new-offer-template");
  const [personaId, setPersonaId] = useState("marcus");
  const [offerType, setOfferType] = useState<string>("productized_service");
  const [buyerAwareness, setBuyerAwareness] = useState<string>("problem_aware");
  const [trustBuilderType, setTrustBuilderType] = useState<string>("strategy_roadmap");
  const [pricingModel, setPricingModel] = useState<string>("custom_quote");
  const [riskReversalStyle, setRiskReversalStyle] = useState<string>("milestone_confidence_language");
  const [ctaGoal, setCtaGoal] = useState<string>("book_call");

  const { data: personasData } = useQuery<{ personas: { id: string; displayName: string }[] }>({
    queryKey: ["/api/admin/offer-engine/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-engine/personas");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  async function create() {
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/admin/offer-engine/offers", {
        name,
        slug: slug.trim().toLowerCase(),
        personaId,
        offerType,
        buyerAwareness,
        trustBuilderType,
        pricingModel,
        riskReversalStyle,
        ctaGoal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: (err as { error?: string }).error ?? "Failed", variant: "destructive" });
        return;
      }
      const json = await res.json();
      const id = json.offer?.id as number;
      if (id) router.push(`/admin/offer-engine/offers/${id}`);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/admin/offer-engine/offers">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Offers
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mb-6">New offer template</h1>
      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 font-mono text-sm" />
        </div>
        <div>
          <Label>Persona</Label>
          <Select value={personaId} onValueChange={setPersonaId}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(personasData?.personas ?? [{ id: "marcus", displayName: "Marcus" }]).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName} ({p.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Offer type</Label>
          <Select value={offerType} onValueChange={setOfferType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OFFER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Buyer awareness</Label>
          <Select value={buyerAwareness} onValueChange={setBuyerAwareness}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUYER_AWARENESS_STAGES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Trust builder</Label>
            <Select value={trustBuilderType} onValueChange={setTrustBuilderType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRUST_BUILDER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pricing</Label>
            <Select value={pricingModel} onValueChange={setPricingModel}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_MODELS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Risk reversal</Label>
            <Select value={riskReversalStyle} onValueChange={setRiskReversalStyle}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RISK_REVERSAL_STYLES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CTA goal</Label>
            <Select value={ctaGoal} onValueChange={setCtaGoal}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CTA_GOALS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => void create()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create draft"}
        </Button>
      </div>
    </div>
  );
}
