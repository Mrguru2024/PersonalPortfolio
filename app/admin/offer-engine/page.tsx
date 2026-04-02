"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Crosshair, FileText, GitBranch, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Summary {
  offerTemplateCount: number;
  leadMagnetTemplateCount: number;
  funnelPathCount: number;
  personaCount: number;
  weakOfferCount?: number;
  weakLeadMagnetCount?: number;
  unmatchedOfferCount?: number;
  orphanLeadMagnetCount?: number;
  weakJourneyChainCount?: number;
  topRecommendation?: string;
}

export default function OfferEngineHubPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["/api/admin/offer-engine/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-engine/summary");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-3 mb-2">
          <Crosshair className="h-10 w-10 text-primary shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ascendra Offer Engine</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Offers, lead magnets, and conversion strategy — persona-first, outcome-first. Each offer template has a{" "}
              <strong className="font-medium text-foreground">Pricing &amp; value</strong> tab for DFY/DWY/DIY bands,
              value stack, legal gates, Stripe IDs, and exports. Internal admin only.
              Distinct from public{" "}
              <Link href="/admin/offers" className="underline-offset-2 hover:underline">
                site offers
              </Link>{" "}
              and IQ{" "}
              <Link href="/admin/ascendra-intelligence" className="underline-offset-2 hover:underline">
                lead magnet library
              </Link>
              .
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Offer templates
                </CardTitle>
                <CardDescription>Guided offer framework, perceived outcome, funnel, scoring, copy.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-2xl font-semibold tabular-nums">{summary?.offerTemplateCount ?? "—"}</span>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href="/admin/offer-engine/offers/new">New offer</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/offer-engine/offers">Open list</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Lead magnet templates
                </CardTitle>
                <CardDescription>Bridge-to-paid, qualification intent, magnet scoring.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-2xl font-semibold tabular-nums">{summary?.leadMagnetTemplateCount ?? "—"}</span>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href="/admin/offer-engine/lead-magnets/new">New lead magnet</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/offer-engine/lead-magnets">Open list</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Persona strategy layer
                </CardTitle>
                <CardDescription>Extended intelligence for locked + custom marketing personas.</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-semibold tabular-nums block mb-3">{summary?.personaCount ?? "—"}</span>
                <Button asChild size="sm">
                  <Link href="/admin/offer-engine/personas">Edit strategy fields</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GitBranch className="h-5 w-5 text-primary" />
                  Funnel paths
                </CardTitle>
                <CardDescription>Visual path: traffic → entry → CRM → qualification → goal.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-2xl font-semibold tabular-nums">{summary?.funnelPathCount ?? "—"}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/offer-engine/funnel-paths">View paths</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversion readiness alerts</CardTitle>
                <CardDescription>Weak assets and broken handoffs detected from live intelligence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Weak offers: <strong>{summary?.weakOfferCount ?? 0}</strong>
                </p>
                <p>
                  Weak lead magnets: <strong>{summary?.weakLeadMagnetCount ?? 0}</strong>
                </p>
                <p>
                  Offers missing magnet support: <strong>{summary?.unmatchedOfferCount ?? 0}</strong>
                </p>
                <p>
                  Magnets without logical next offer: <strong>{summary?.orphanLeadMagnetCount ?? 0}</strong>
                </p>
                <p>
                  Weak journey chains: <strong>{summary?.weakJourneyChainCount ?? 0}</strong>
                </p>
                {summary?.topRecommendation ? (
                  <p className="text-muted-foreground">Top recommendation: {summary.topRecommendation}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-10 max-w-2xl">
          Analytics hooks:{" "}
          <Link href="/admin/offer-engine/analytics-hooks" className="underline-offset-2 hover:underline">
            metric definitions
          </Link>{" "}
          (placeholders for future instrumentation — no fabricated dashboards).
        </p>
      </div>
    </div>
  );
}
