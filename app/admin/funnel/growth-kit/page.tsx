"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STARTUP_GROWTH_KIT_PATH } from "@/lib/funnelCtas";

export default function AdminFunnelGrowthKitPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full min-w-0 max-w-full py-6 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground mb-4">
          <Link href="/admin/funnel">
            <ArrowLeft className="h-4 w-4" />
            Funnel
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Startup growth kit — content</h1>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={STARTUP_GROWTH_KIT_PATH} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View live
            </a>
          </Button>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">On-page content (read-only reference)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-foreground">Hero:</strong> Title “Where to begin when building a business online”, subtitle, icon.</li>
              <li><strong className="text-foreground">Why most startup websites fail:</strong> Section with copy on common mistakes.</li>
              <li><strong className="text-foreground">Assets vs systems:</strong> Explanation of what to build first.</li>
              <li><strong className="text-foreground">4 layers:</strong> Clarity, Presentation, Systems, Traffic & iteration (with short descriptions).</li>
              <li><strong className="text-foreground">Roadmap / next steps:</strong> CTAs to Website score, Revenue calculator, Action plan.</li>
            </ul>
            <p>
              <strong className="text-foreground">To edit:</strong> Update <code className="bg-muted px-1 rounded">app/resources/startup-growth-kit/page.tsx</code> (and <code className="bg-muted px-1 rounded">FOUR_LAYERS</code> if needed).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
