"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function CommunicationsDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ["/api/admin/communications/analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        totals: {
          campaigns: number;
          sent: number;
          opened: number;
          clicked: number;
          openRate: number;
          clickRate: number;
          clickToOpenRate: number;
        };
      }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user || !user.isAdmin || !user.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total sent (tracked campaigns)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {aLoading ? "—" : analytics?.totals.sent ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open rate</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {aLoading ? "—" : `${analytics?.totals.openRate ?? 0}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Click rate</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {aLoading ? "—" : `${analytics?.totals.clickRate ?? 0}%`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Click-to-open</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {aLoading ? "—" : `${analytics?.totals.clickToOpenRate ?? 0}%`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Integrated with CRM
            </CardTitle>
            <CardDescription>
              Sends log to each lead&apos;s timeline, <code className="text-xs">communication_events</code>, and
              activity log. Opens/clicks reuse <code className="text-xs">/api/track/email/*</code> with per-send IDs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/admin/communications/designs">
                New email design <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/crm">Open CRM</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Newsletters vs Communications</CardTitle>
            <CardDescription>
              Subscriber newsletters stay under <Link className="underline" href="/admin/newsletters">Newsletters</Link>.
              Communications targets <strong>CRM contacts</strong> with offer / magnet / UTM / persona filters and
              structured campaign records.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
