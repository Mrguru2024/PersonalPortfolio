"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailHubTrackingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: overview, isLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/overview"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/overview");
      return (await res.json()) as {
        openRatePct: number | null;
        clickRatePct: number | null;
        bounceCount30d: number;
      };
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle>Tracking & analytics</CardTitle>
          <CardDescription>
            Events arrive from Brevo webhooks into <code className="text-xs bg-muted px-1 rounded">email_hub_events</code>.
            Use the same secret query param as transactional webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {isLoading || !overview ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Open rate (30d): {overview.openRatePct != null ? `${overview.openRatePct}%` : "—"}</li>
              <li>Click rate (30d): {overview.clickRatePct != null ? `${overview.clickRatePct}%` : "—"}</li>
              <li>Bounces (30d): {overview.bounceCount30d}</li>
            </ul>
          }
          <p>
            Message-level timeline: open any row on{" "}
            <Link href="/admin/email-hub/sent" className="text-primary underline">
              Sent
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
