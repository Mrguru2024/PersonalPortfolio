"use client";

import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PersonaStrategyLayer } from "@shared/offerEngineTypes";
import { Input } from "@/components/ui/input";

function lines(arr?: string[]) {
  return (arr ?? []).join("\n");
}
function splitLines(s: string) {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function OfferEnginePersonaStrategyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ?? "";
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/ascendra-intelligence/personas", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ascendra-intelligence/personas/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as {
        persona: { displayName: string; offerEngineStrategy: PersonaStrategyLayer | null };
      };
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  const [layer, setLayer] = useState<PersonaStrategyLayer>({});

  useEffect(() => {
    if (data?.persona) setLayer(data.persona.offerEngineStrategy ?? {});
  }, [data]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const save = useMutation({
    mutationFn: async (body: PersonaStrategyLayer) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/offer-engine/personas/${encodeURIComponent(id)}/strategy`,
        body,
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Strategy layer saved" });
      void qc.invalidateQueries({ queryKey: ["/api/admin/offer-engine/personas"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/personas", id] });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const set = (patch: Partial<PersonaStrategyLayer>) => setLayer((prev) => ({ ...prev, ...patch }));

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/offer-engine/personas">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Personas
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mb-2">{data.persona.displayName}</h1>
      <p className="text-sm text-muted-foreground mb-6">Offer Engine strategy layer (arrays = one item per line).</p>

      <div className="space-y-4">
        <div>
          <Label>Business type label</Label>
          <Input value={layer.businessTypeLabel ?? ""} onChange={(e) => set({ businessTypeLabel: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Revenue range</Label>
          <Input value={layer.revenueRange ?? ""} onChange={(e) => set({ revenueRange: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Main frustration</Label>
          <Textarea value={layer.mainFrustration ?? ""} onChange={(e) => set({ mainFrustration: e.target.value })} className="mt-1" rows={2} />
        </div>
        <div>
          <Label>Desired outcome</Label>
          <Textarea value={layer.desiredOutcome ?? ""} onChange={(e) => set({ desiredOutcome: e.target.value })} className="mt-1" rows={2} />
        </div>
        {(
          [
            ["commonObjections", "Common objections"],
            ["trustTriggers", "Trust triggers"],
            ["buyingTriggers", "Buying triggers"],
            ["lowBudgetConcerns", "Low-budget concerns"],
            ["diyTendencies", "DIY tendencies"],
            ["emotionalWordingPatterns", "Emotional wording patterns"],
            ["preferredLeadMagnetTypes", "Preferred lead magnet types"],
            ["preferredOfferStyles", "Preferred offer styles"],
            ["commonFears", "Common fears"],
            ["badAlternativesTried", "Bad alternatives tried"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>
            <Textarea
              value={lines(layer[key] as string[] | undefined)}
              onChange={(e) => set({ [key]: splitLines(e.target.value) } as Partial<PersonaStrategyLayer>)}
              className="mt-1"
              rows={3}
            />
          </div>
        ))}
        <div>
          <Label>Preferred CTA style</Label>
          <Input value={layer.preferredCtaStyle ?? ""} onChange={(e) => set({ preferredCtaStyle: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Urgency style</Label>
          <Input value={layer.urgencyStyle ?? ""} onChange={(e) => set({ urgencyStyle: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Proof sensitivity</Label>
          <Input value={layer.proofSensitivity ?? ""} onChange={(e) => set({ proofSensitivity: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Time-to-result expectations</Label>
          <Textarea
            value={layer.timeToResultExpectations ?? ""}
            onChange={(e) => set({ timeToResultExpectations: e.target.value })}
            className="mt-1"
            rows={2}
          />
        </div>
        <Button onClick={() => save.mutate(layer)} disabled={save.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save strategy layer
        </Button>
      </div>
    </div>
  );
}
