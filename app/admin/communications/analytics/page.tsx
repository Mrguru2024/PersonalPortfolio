"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type AbArm = { sent: number; openRate: number; clickRate: number };

type Analytics = {
  totals: {
    campaigns: number;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
  };
  blockClicks: Record<string, number>;
  campaigns: Array<{
    id: number;
    name: string;
    status: string;
    campaignType: string;
    abTestEnabled: boolean | null;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    ctor: number;
    abSummary: { a: AbArm; b: AbArm } | null;
  }>;
};

export default function CommunicationsAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/communications/analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Analytics>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const blockEntries = data ? Object.entries(data.blockClicks).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Communications analytics</h2>
        <p className="text-sm text-muted-foreground">
          Aggregates from campaign send rows + first-open / first-click counters; A/B and block breakdowns from send-level fields.
        </p>
      </div>

      {isLoading || !data ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Messages sent</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{data.totals.sent}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Open rate</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{data.totals.openRate}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Click rate</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{data.totals.clickRate}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Click-to-open</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{data.totals.clickToOpenRate}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {blockEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>First clicks by block ID</CardTitle>
                <CardDescription>Counts first tracked clicks per block (from design blocks JSON + link order).</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Block ID</th>
                      <th className="py-2">First clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockEntries.map(([bid, n]) => (
                      <tr key={bid} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs">{bid}</td>
                        <td className="py-2 tabular-nums">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>By campaign</CardTitle>
              <CardDescription>
                Aligns with Website Analytics and CRM engagement; A/B columns appear when the campaign had an active split and sends.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Campaign</th>
                    <th className="py-2 pr-4">Sent</th>
                    <th className="py-2 pr-4">Open %</th>
                    <th className="py-2 pr-4">Click %</th>
                    <th className="py-2 pr-4">CTOR %</th>
                    <th className="py-2">A/B</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 align-top">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.campaignType.replace(/_/g, " ")}</div>
                        {row.abTestEnabled && <Badge variant="outline" className="mt-1 text-[10px]">A/B enabled</Badge>}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{row.sent}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.openRate}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.clickRate}</td>
                      <td className="py-2 pr-4 tabular-nums">{row.ctor}</td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {row.abSummary ?
                          <div className="space-y-1 tabular-nums">
                            <div>
                              <span className="text-foreground font-medium">A:</span> n={row.abSummary.a.sent} · open{" "}
                              {row.abSummary.a.openRate}% · click {row.abSummary.a.clickRate}%
                            </div>
                            <div>
                              <span className="text-foreground font-medium">B:</span> n={row.abSummary.b.sent} · open{" "}
                              {row.abSummary.b.openRate}% · click {row.abSummary.b.clickRate}%
                            </div>
                          </div>
                        : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
