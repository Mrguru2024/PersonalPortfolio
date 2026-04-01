"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface P {
  id: string;
  displayName: string;
  offerEngineLocked?: boolean;
}

export default function OfferEnginePersonasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ personas: P[] }>({
    queryKey: ["/api/admin/offer-engine/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offer-engine/personas");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/admin/offer-engine">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Offer Engine
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mb-2">Persona strategy layer</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Extends marketing personas with Offer Engine fields. Locked core personas stay seeded; edit copy and signals in{" "}
        <Link href="/admin/ascendra-intelligence/personas" className="underline">
          IQ personas
        </Link>{" "}
        as needed.
      </p>
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <div className="space-y-2">
          {(data?.personas ?? []).map((p) => (
            <Card key={p.id}>
              <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base font-medium">
                  <Link href={`/admin/offer-engine/personas/${encodeURIComponent(p.id)}`} className="hover:underline">
                    {p.displayName}
                  </Link>
                </CardTitle>
                <div className="flex gap-1">
                  {p.offerEngineLocked ? (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Core
                    </Badge>
                  ) : null}
                  <Badge variant="outline">{p.id}</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
