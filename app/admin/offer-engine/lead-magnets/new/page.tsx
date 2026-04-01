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
  DELIVERY_METHODS,
  FUNNEL_STAGES,
  LEAD_MAGNET_ENGINE_TYPES,
  LEAD_MAGNET_FORMATS,
  QUALIFICATION_INTENTS,
  TRUST_PURPOSES,
} from "@shared/offerEngineConstants";

export default function NewLeadMagnetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("New lead magnet");
  const [slug, setSlug] = useState("new-lead-magnet");
  const [personaId, setPersonaId] = useState("marcus");
  const [funnelStage, setFunnelStage] = useState("top");
  const [leadMagnetType, setLeadMagnetType] = useState("checklist");
  const [format, setFormat] = useState("pdf");
  const [deliveryMethod, setDeliveryMethod] = useState("email");
  const [trustPurpose, setTrustPurpose] = useState("diagnose");
  const [qualificationIntent, setQualificationIntent] = useState("top_of_funnel");

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
      const res = await apiRequest("POST", "/api/admin/offer-engine/lead-magnets", {
        name,
        slug: slug.trim().toLowerCase(),
        personaId,
        relatedOfferTemplateId: null,
        funnelStage,
        leadMagnetType,
        format,
        deliveryMethod,
        trustPurpose,
        qualificationIntent,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: (err as { error?: string }).error ?? "Failed", variant: "destructive" });
        return;
      }
      const json = await res.json();
      const id = json.leadMagnet?.id as number;
      if (id) router.push(`/admin/offer-engine/lead-magnets/${id}`);
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
        <Link href="/admin/offer-engine/lead-magnets">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Lead magnets
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mb-6">New lead magnet template</h1>
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
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Stage</Label>
            <Select value={funnelStage} onValueChange={setFunnelStage}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUNNEL_STAGES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={leadMagnetType} onValueChange={setLeadMagnetType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_MAGNET_ENGINE_TYPES.map((t) => (
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
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_MAGNET_FORMATS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Delivery</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_METHODS.map((t) => (
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
            <Label>Trust purpose</Label>
            <Select value={trustPurpose} onValueChange={setTrustPurpose}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRUST_PURPOSES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Qualification</Label>
            <Select value={qualificationIntent} onValueChange={setQualificationIntent}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATION_INTENTS.map((t) => (
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
