"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STARTUP_WEBSITE_SCORE_PATH } from "@/lib/funnelCtas";

export default function AdminFunnelWebsiteScorePage() {
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
          <h1 className="text-2xl font-bold text-foreground">Startup website score — content</h1>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={STARTUP_WEBSITE_SCORE_PATH} target="_blank" rel="noopener noreferrer">
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
              <li><strong className="text-foreground">Hero:</strong> Title “Startup website score”, short intro.</li>
              <li><strong className="text-foreground">Tool:</strong> 5 questions (offer clarity, lead capture, CTA, trust, mobile), score 0–100, suggestions, CTA to Action plan.</li>
              <li><strong className="text-foreground">Secondary CTAs:</strong> Links to Growth kit, Revenue calculator, Action plan.</li>
            </ul>
            <p>
              <strong className="text-foreground">To edit:</strong> Page copy in <code className="bg-muted px-1 rounded">app/tools/startup-website-score/page.tsx</code>; tool logic and questions in <code className="bg-muted px-1 rounded">app/components/funnel/StartupWebsiteScoreCard.tsx</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
