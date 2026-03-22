"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Loader2,
  Users,
  FileText,
  Sparkles,
  Eye,
  ExternalLink,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Summary {
  personaCount: number;
  siteOfferCount: number;
  scriptCount: number;
  leadMagnetCount: number;
}

export default function AscendraIntelligenceHubPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["/api/admin/ascendra-intelligence/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/summary");
      if (!res.ok) throw new Error("Failed to load");
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-3 mb-2">
          <Brain className="h-10 w-10 text-primary shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offer + Persona Intelligence</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Internal admin only. Customer personas (targets, not users), outreach scripts (including Generative AI),
              typed lead magnets, and previews—wired to site offers and funnel assets.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Personas
                </CardTitle>
                <CardDescription>
                  Marketing targets (ideal buyers) for copy and campaigns—distinct from CRM{" "}
                  <Link href="/admin/crm/personas" className="underline-offset-2 hover:underline text-foreground">
                    sales segments
                  </Link>
                  . Attach scripts and magnets; manage live pricing under Site offers.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-2xl font-semibold tabular-nums">{summary?.personaCount ?? "—"}</span>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/ascendra-intelligence/personas/new">New persona</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/admin/ascendra-intelligence/personas">Open list</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Scripts
                </CardTitle>
                <CardDescription>
                  Warm, cold, content, follow-up, objection, Generative AI—per persona.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold tabular-nums">{summary?.scriptCount ?? "—"}</span>
                <Button asChild size="sm">
                  <Link href="/admin/ascendra-intelligence/scripts">Open</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Lead magnets
                </CardTitle>
                <CardDescription>
                  Typed magnets (including Generative AI); optional link to funnel content assets.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-2xl font-semibold tabular-nums">{summary?.leadMagnetCount ?? "—"}</span>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/admin/ascendra-intelligence/lead-magnets">Open</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-primary" />
                  Preview
                </CardTitle>
                <CardDescription>Landing (from site offer), DM text, email plain preview.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link href="/admin/ascendra-intelligence/preview">Open preview tool</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Linked systems
            </CardTitle>
            <CardDescription>Reuse existing editors and assets—no duplicate offer CMS.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/offers">
                Site offers ({summary?.siteOfferCount ?? "—"})
                <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/funnel/content-library">Funnel content library</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/crm/personas">Sales segments (CRM firmographics)</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
