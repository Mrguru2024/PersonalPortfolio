"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Tag, Loader2, Pencil, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface SiteOffer {
  slug: string;
  name: string;
  metaTitle: string | null;
  metaDescription: string | null;
  sections: Record<string, unknown>;
  updatedAt: string;
}

export default function AdminOffersListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ offers: SiteOffer[] }>({
    queryKey: ["/api/admin/offers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offers");
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

  const offers = data?.offers ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Site offers</h1>
        <p className="text-muted-foreground mb-6">Edit section text and graphics for your offer pages. Changes appear on the live site.</p>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : offers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No offers yet</p>
              <p className="text-sm text-muted-foreground mt-1">Run the seed to add the default Startup growth system offer, or create one from the funnel.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/offers/startup-growth-system/edit">
                  <Plus className="h-4 w-4 mr-2" />Add Startup growth system offer
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.slug} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        {offer.name}
                      </CardTitle>
                      <CardDescription>
                        /offers/{offer.slug} · Updated {offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString() : "—"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/offers/${offer.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />View live
                        </a>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/admin/offers/${offer.slug}/edit`}>
                          <Pencil className="h-4 w-4 mr-2" />Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/funnel">Funnel & tools</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
