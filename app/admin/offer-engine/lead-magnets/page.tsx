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
import { ASSET_STATUS_LABELS } from "@shared/offerEngineConstants";

interface Row {
  id: number;
  slug: string;
  name: string;
  personaId: string;
  status: string;
  leadMagnetType: string;
  relatedOfferTemplateId: number | null;
  scoreCacheJson: { overall: number; tier: string } | null;
}

export default function OfferEngineLeadMagnetsListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [personaId, setPersonaId] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (personaId.trim()) p.set("personaId", personaId.trim());
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [personaId, q]);

  const { data, isLoading } = useQuery<{ leadMagnets: Row[] }>({
    queryKey: ["/api/admin/offer-engine/lead-magnets", qs],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/offer-engine/lead-magnets?${qs}`);
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
      <div className="flex flex-wrap gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/offer-engine">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Offer Engine
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/admin/offer-engine/lead-magnets/new">New lead magnet</Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Lead magnet templates</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Persona id" value={personaId} onChange={(e) => setPersonaId(e.target.value)} className="max-w-xs" />
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <div className="space-y-3">
          {(data?.leadMagnets ?? []).map((o) => (
            <Card key={o.id}>
              <CardHeader className="py-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link href={`/admin/offer-engine/lead-magnets/${o.id}`} className="hover:underline">
                      {o.name}
                    </Link>
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{o.personaId}</Badge>
                    <Badge variant="secondary">{ASSET_STATUS_LABELS[o.status as keyof typeof ASSET_STATUS_LABELS] ?? o.status}</Badge>
                    {o.relatedOfferTemplateId ? <Badge>Offer #{o.relatedOfferTemplateId}</Badge> : null}
                    {o.scoreCacheJson ? <Badge>{o.scoreCacheJson.overall} pts</Badge> : null}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{o.slug}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
