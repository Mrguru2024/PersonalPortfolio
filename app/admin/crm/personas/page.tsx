"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Users, Target, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

interface CrmContact {
  id: number;
  type: string;
  name: string;
  email: string;
  company?: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  status?: string | null;
}

export default function PersonasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: contacts = [], isLoading } = useQuery<CrmContact[]>({
    queryKey: ["/api/admin/crm/contacts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/contacts");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const personas = useMemo(() => {
    const byIndustry: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    contacts.forEach((c) => {
      const ind = c.industry || "Unknown";
      byIndustry[ind] = (byIndustry[ind] || 0) + 1;
      byType[c.type] = (byType[c.type] || 0) + 1;
      const st = c.status || "new";
      byStatus[st] = (byStatus[st] || 0) + 1;
    });
    return {
      byIndustry: Object.entries(byIndustry).sort((a, b) => b[1] - a[1]),
      byType: Object.entries(byType),
      byStatus: Object.entries(byStatus).sort((a, b) => b[1] - a[1]),
    };
  }, [contacts]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-2">Personas & Insights</h1>
        <p className="text-muted-foreground">
          Customer segments from CRM data for marketing and product planning.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="personas">
          <TabsList>
            <TabsTrigger value="personas">Personas</TabsTrigger>
            <TabsTrigger value="insights">Insights (AI)</TabsTrigger>
          </TabsList>
          <TabsContent value="personas" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> By industry</CardTitle>
                <CardDescription>Use for targeting and messaging.</CardDescription>
              </CardHeader>
              <CardContent>
                {personas.byIndustry.length === 0 ? (
                  <p className="text-muted-foreground">No industry data yet. Add contacts with industry in CRM.</p>
                ) : (
                  <ul className="space-y-2">
                    {personas.byIndustry.map(([name, count]) => (
                      <li key={name} className="flex justify-between">
                        <span>{name}</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> By type</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {personas.byType.map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span className="capitalize">{name}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By status</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {personas.byStatus.map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="insights" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> AI-powered insights</CardTitle>
                <CardDescription>
                  Opportunities and product ideas from CRM data and real-time signals. (Connect an AI insights API to enable.)
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Add an API endpoint that analyzes CRM contacts, deal pipeline, and optional web/report data to suggest sales opportunities and product ideas.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
