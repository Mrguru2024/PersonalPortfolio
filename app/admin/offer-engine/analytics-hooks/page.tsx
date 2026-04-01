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
import { Badge } from "@/components/ui/badge";

interface Def {
  id: number;
  metricKey: string;
  description: string;
  appliesTo: string;
  valueType: string | null;
}

export default function OfferEngineAnalyticsHooksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ definitions: Def[]; note?: string; intelligence?: {
    offers: {
      totalTrackedLeads: number;
      totalTrackedRevenue: number;
      topByConversionRate: Array<{ offerId: number; offerName: string; conversionRate: number; leadCount: number }>;
    };
    leadMagnets: {
      totalTrackedOptIns: number;
      topByOptInRate: Array<{ leadMagnetId: number; leadMagnetName: string; optInRate: number; clickThroughRate: number }>;
    };
    recommendations: string[];
  } }>({
    queryKey: ["/api/admin/offer-engine/analytics-hooks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-engine/analytics-hooks");
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
      <h1 className="text-2xl font-bold mb-2">Analytics hooks (placeholders)</h1>
      <p className="text-sm text-muted-foreground mb-6">{data?.note}</p>
      {data?.intelligence ? (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Integrated signal preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Tracked offer leads: <strong>{data.intelligence.offers.totalTrackedLeads}</strong> · Tracked offer-attributed revenue:{" "}
              <strong>${data.intelligence.offers.totalTrackedRevenue.toLocaleString()}</strong>
            </p>
            <p>
              Tracked lead magnet opt-ins: <strong>{data.intelligence.leadMagnets.totalTrackedOptIns}</strong>
            </p>
            {data.intelligence.recommendations.length > 0 ? (
              <ul className="list-disc pl-5">
                {data.intelligence.recommendations.slice(0, 3).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : null}
      <div className="space-y-2">
        {(data?.definitions ?? []).map((d) => (
          <Card key={d.id}>
            <CardHeader className="py-3">
              <div className="flex flex-wrap gap-2 items-center">
                <CardTitle className="text-base font-mono">{d.metricKey}</CardTitle>
                <Badge variant="outline">{d.appliesTo}</Badge>
                {d.valueType ? <Badge variant="secondary">{d.valueType}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground pt-0">{d.description}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
