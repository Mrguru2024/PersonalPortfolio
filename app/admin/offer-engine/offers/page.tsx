"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { ASSET_STATUS_LABELS, SCORE_TIER_LABELS } from "@shared/offerEngineConstants";

interface OfferRow {
  id: number;
  slug: string;
  name: string;
  personaId: string;
  status: string;
  visibility: string;
  offerType: string;
  scoreCacheJson: { overall: number; tier: string } | null;
  updatedAt: string;
}

export default function OfferEngineOffersListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [personaId, setPersonaId] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (personaId.trim()) p.set("personaId", personaId.trim());
    if (status.trim()) p.set("status", status.trim());
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [personaId, status, q]);

  const { data, isLoading } = useQuery<{ offers: OfferRow[] }>({
    queryKey: ["/api/admin/offer-engine/offers", qs],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/offer-engine/offers?${qs}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/offer-engine">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Offer Engine
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/admin/offer-engine/offers/new">New offer</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Offer templates</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Persona id (e.g. marcus)" value={personaId} onChange={(e) => setPersonaId(e.target.value)} className="max-w-xs" />
        <Input placeholder="Status (draft, active, …)" value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs" />
        <Input placeholder="Search name/slug" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-3">
          {(data?.offers ?? []).map((o) => (
            <Card key={o.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link href={`/admin/offer-engine/offers/${o.id}`} className="hover:underline">
                      {o.name}
                    </Link>
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{o.personaId}</Badge>
                    <Badge variant="secondary">{ASSET_STATUS_LABELS[o.status as keyof typeof ASSET_STATUS_LABELS] ?? o.status}</Badge>
                    {o.scoreCacheJson ? (
                      <Badge>
                        {o.scoreCacheJson.overall} — {SCORE_TIER_LABELS[o.scoreCacheJson.tier as keyof typeof SCORE_TIER_LABELS] ?? o.scoreCacheJson.tier}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{o.slug}</p>
              </CardHeader>
            </Card>
          ))}
          {data?.offers?.length === 0 ? <p className="text-muted-foreground">No offers match filters.</p> : null}
        </div>
      )}
    </div>
  );
}
