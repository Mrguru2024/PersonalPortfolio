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
}

export default function OfferEngineFunnelPathsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ funnelPaths: PathRow[] }>({
    queryKey: ["/api/admin/offer-engine/funnel-paths"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-engine/funnel-paths");
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
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <div className="space-y-4">
          {(data?.funnelPaths ?? []).map((fp) => (
            <Card key={fp.id}>
              <CardHeader className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{fp.label}</CardTitle>
                  <Badge variant="outline">{fp.personaId}</Badge>
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
