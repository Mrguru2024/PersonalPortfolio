"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Magnet {
  id: number;
  title: string;
  magnetType: string;
  status: string;
  personaIds: string[];
  primaryAssetId: number | null;
}

export default function AscendraLeadMagnetsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ magnets: Magnet[] }>({
    queryKey: ["/api/admin/ascendra-intelligence/lead-magnets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/lead-magnets");
      if (!res.ok) throw new Error("Failed");
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

  const magnets = data?.magnets ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 flex flex-wrap justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/ascendra-intelligence">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Hub
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/ascendra-intelligence/lead-magnets/new">
              <Plus className="h-4 w-4 mr-2" />
              New magnet
            </Link>
          </Button>
        </div>

        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Sparkles className="h-7 w-7 text-primary" />
          Lead magnets
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Reveal problems, samples/trials, one-step systems. Link a funnel asset ID when ready.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : magnets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No lead magnets yet. Create one to track copy and persona targeting beside funnel files.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {magnets.map((m) => (
              <Link key={m.id} href={`/admin/ascendra-intelligence/lead-magnets/${m.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <CardDescription>
                      {m.magnetType.replace(/_/g, " ")} · {m.status}
                      {m.primaryAssetId != null ? ` · asset #${m.primaryAssetId}` : ""}
                      {m.personaIds?.length ? ` · ${m.personaIds.join(", ")}` : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
