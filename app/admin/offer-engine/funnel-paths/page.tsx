"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PathRow {
  id: number;
  slug: string;
  label: string;
  personaId: string;
  stepsJson: { key: string; label: string; detail?: string }[];
  primaryOfferTemplateId: number | null;
  primaryLeadMagnetTemplateId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface FunnelPathListItem {
  funnelPath: PathRow;
  readiness: { level: "ok" | "warning"; messages: string[] };
}

interface ReadinessPayload {
  weakOffers: Array<{ id: number; slug: string; name: string; score: number }>;
  weakLeadMagnets: Array<{ id: number; slug: string; name: string; score: number }>;
  weakCampaigns: Array<{ id: number; name: string; offerSlug: string | null; readinessScore: number | null }>;
  scarcityReadiness?: Array<{
    configId: number;
    name: string;
    status: "open" | "limited" | "full" | "waitlist";
    availableSlots: number;
    usedSlots: number;
    waitlistCount: number;
    nextCycleDate: string | null;
    message: string;
  }>;
  scarcityBlockedCampaigns?: Array<{
    id: number;
    name: string;
    offerSlug: string | null;
    readinessScore: number;
    reason: string;
  }>;
}

export default function OfferEngineFunnelPathsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ funnelPaths: FunnelPathListItem[]; readiness?: ReadinessPayload }>({
    queryKey: ["/api/admin/offer-engine/funnel-paths", "withInsights=1"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-engine/funnel-paths?withInsights=1");
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
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/admin/offer-engine">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Offer Engine
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mb-2">Funnel paths</h1>
      <p className="text-sm text-muted-foreground mb-6">Visual sequence from traffic to conversion goal. Create/upsert via API POST with a unique slug.</p>
      {data?.readiness ? (
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Weak offers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              {data.readiness.weakOffers.slice(0, 3).map((o) => (
                <div key={o.id} className="flex justify-between gap-2">
                  <span className="truncate">{o.name}</span>
                  <Badge variant="outline">{o.score}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Weak lead magnets</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              {data.readiness.weakLeadMagnets.slice(0, 3).map((m) => (
                <div key={m.id} className="flex justify-between gap-2">
                  <span className="truncate">{m.name}</span>
                  <Badge variant="outline">{m.score}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Weak paid campaigns</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              {data.readiness.weakCampaigns.slice(0, 3).map((c) => (
                <div key={c.id} className="flex justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  <Badge variant="outline">{c.readinessScore}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
      {data?.readiness?.scarcityReadiness?.length ? (
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Scarcity readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.readiness.scarcityReadiness.slice(0, 4).map((row) => (
              <div key={row.configId} className="rounded-md border p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{row.name}</span>
                  <Badge variant="outline">{row.status}</Badge>
                </div>
                <div className="text-muted-foreground">
                  {row.availableSlots} slots left · {row.waitlistCount} waitlist
                </div>
                <div>{row.message}</div>
              </div>
            ))}
            {data.readiness.scarcityBlockedCampaigns?.length ? (
              <p className="text-muted-foreground">
                Blocked campaigns by scarcity: {data.readiness.scarcityBlockedCampaigns.length}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <div className="space-y-4">
          {(data?.funnelPaths ?? []).map(({ funnelPath: fp, readiness }) => (
            <Card key={fp.id}>
              <CardHeader className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{fp.label}</CardTitle>
                  <Badge variant="outline">{fp.personaId}</Badge>
                  {readiness.level === "warning" ? (
                    <Badge variant="destructive" className="text-xs">
                      Needs attention
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      OK
                    </Badge>
                  )}
                  {fp.primaryOfferTemplateId ? (
                    <Link
                      href={`/admin/offer-engine/offers/${fp.primaryOfferTemplateId}`}
                      className={cn(badgeVariants(), "no-underline hover:opacity-90")}
                    >
                      Offer #{fp.primaryOfferTemplateId}
                    </Link>
                  ) : null}
                  {fp.primaryLeadMagnetTemplateId ? (
                    <Link
                      href={`/admin/offer-engine/lead-magnets/${fp.primaryLeadMagnetTemplateId}`}
                      className={cn(badgeVariants({ variant: "secondary" }), "no-underline hover:opacity-90")}
                    >
                      LM #{fp.primaryLeadMagnetTemplateId}
                    </Link>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{fp.slug}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {readiness.messages.length > 0 ? (
                  <ul className="list-disc pl-5 text-amber-800 dark:text-amber-200/90 text-xs space-y-1 mb-3">
                    {readiness.messages.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : null}
                {fp.stepsJson.map((s, i) => (
                  <div key={s.key} className="flex gap-2">
                    <span className="text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                    <div>
                      <strong>{s.label}</strong>
                      {s.detail ? <p className="text-muted-foreground">{s.detail}</p> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
