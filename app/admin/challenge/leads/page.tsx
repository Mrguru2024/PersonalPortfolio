"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ChallengeLead {
  id: number;
  contactId: number | null;
  email: string;
  fullName: string;
  businessName: string | null;
  status: string;
  orderBumpPurchased: boolean | null;
  createdAt: string;
  diagnosisScore: number | null;
  recommendedBrandPath: string | null;
  qualificationSubmitted: boolean | null;
  readyForCall: boolean | null;
}

export default function AdminChallengeLeadsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ leads: ChallengeLead[] }>({
    queryKey: ["/api/admin/challenge/leads"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/challenge/leads");
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

  const leads = data?.leads ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Challenge leads</h1>
        <p className="text-muted-foreground mb-6">Paid challenge registrations. View in CRM for full lead context.</p>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : leads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No challenge registrations yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <Card key={lead.id} className="overflow-hidden">
                <CardContent className="py-4 px-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{lead.fullName}</p>
                      <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                      {lead.businessName && (
                        <p className="text-xs text-muted-foreground truncate">{lead.businessName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{lead.status}</Badge>
                    {lead.orderBumpPurchased && <Badge variant="outline">Order bump</Badge>}
                    {lead.qualificationSubmitted && <Badge variant="default">Applied</Badge>}
                    {lead.readyForCall && <Badge className="bg-green-600">Ready for call</Badge>}
                    {lead.diagnosisScore != null && (
                      <span className="text-xs text-muted-foreground">Score: {lead.diagnosisScore}</span>
                    )}
                    {lead.recommendedBrandPath && (
                      <span className="text-xs text-muted-foreground">→ {lead.recommendedBrandPath}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </span>
                    {lead.contactId && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/crm/${lead.contactId}`} className="gap-1">
                          CRM <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
