"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type Row = {
  id: number;
  name: string;
  status: string;
  campaignType: string;
  sentCount: number | null;
  openedCount: number | null;
  clickedCount: number | null;
  design: { id: number; name: string; subject: string } | null;
};

export default function CommunicationsCampaignsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["/api/admin/communications/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/campaigns");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Row[]>;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Link a design, define CRM segment filters, then send.</p>
        </div>
        <Button asChild>
          <Link href="/admin/communications/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            New campaign
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No campaigns</CardTitle>
            <CardDescription>Create a campaign with explicit segment filters (never sends to the full CRM by accident).</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/communications/campaigns/${c.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.design?.subject ?? "No design"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{c.status}</Badge>
                        <Badge variant="outline">{c.campaignType.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Sent {c.sentCount ?? 0} · Opened {c.openedCount ?? 0} · Clicks {c.clickedCount ?? 0}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
