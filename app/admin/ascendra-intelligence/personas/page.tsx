"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronRight, Package, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Persona {
  id: string;
  displayName: string;
  summary: string | null;
  revenueBand: string | null;
}

export default function AscendraPersonasListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ personas: Persona[] }>({
    queryKey: ["/api/admin/ascendra-intelligence/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/personas");
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

  const personas = data?.personas ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-2 justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/ascendra-intelligence">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Intelligence hub
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/offers">
                <Package className="h-4 w-4 mr-2" />
                Site offers
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/ascendra-intelligence/personas/new">
                <Plus className="h-4 w-4 mr-2" />
                New persona
              </Link>
            </Button>
          </div>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Users className="h-7 w-7 text-primary" />
          Marketing personas
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Customer targets for messaging and offers—not application users. Includes Denishia (Macon Designs).
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : personas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No personas found. Run <code className="text-xs bg-muted px-1 rounded">npm run db:push</code> then{" "}
              <code className="text-xs bg-muted px-1 rounded">npm run db:seed</code>.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {personas.map((p) => (
              <Link key={p.id} href={`/admin/ascendra-intelligence/personas/${p.id}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{p.displayName}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {p.summary || "No summary"}
                          {p.revenueBand ? ` · ${p.revenueBand}` : ""}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
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
