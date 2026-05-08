"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, ExternalLink, LineChart, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function AdminGrowthPlatformLegalFunnelPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {authLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </span>
        ) : (
          "Redirecting…"
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 pb-16">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1 text-muted-foreground" asChild>
          <Link href="/admin/growth-platform">
            <ArrowLeft className="h-4 w-4" />
            Growth System Platform
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Legal &amp; funnel</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Public legal surfaces, the growth-platform recommendation path with pre-purchase acknowledgment, and admin tools
          for agreements and clauses.
        </p>
      </div>

      <Card className="border-border/80 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Public legal pages</CardTitle>
          </div>
          <CardDescription>Visitor-facing policies and engagement terms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
              Terms
            </Link>
            ,{" "}
            <Link href="/service-engagement" className="text-primary underline-offset-4 hover:underline">
              engagement terms
            </Link>
            , and the{" "}
            <Link href="/growth-platform/recommendation" className="text-primary underline-offset-4 hover:underline">
              recommendation flow
            </Link>{" "}
            (tier suggestion with pre-purchase acknowledgment).
          </p>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
            <Link href="/growth-platform" className="gap-1">
              Public growth hub
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Funnel &amp; paid growth</CardTitle>
          </div>
          <CardDescription>Campaign models and attribution tie back to the same commercial path.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/paid-growth">Open Growth Engine</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Admin: agreements &amp; clauses</CardTitle>
          <CardDescription>PDF, DocuSign, retainers, and reusable clause library.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/admin/growth-platform/agreements">Service agreements, PDF, DocuSign &amp; retainers</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/admin/growth-platform/clauses">Edit agreement clause library</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
