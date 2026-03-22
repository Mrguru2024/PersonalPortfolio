"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Tag, Loader2, Pencil, ExternalLink, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { matchesLiveSearch } from "@/lib/matchesLiveSearch";
import { useToast } from "@/hooks/use-toast";

function sanitizeOfferSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const { toast } = useToast();
  const [listSearch, setListSearch] = useState("");
  const [newOfferOpen, setNewOfferOpen] = useState(false);
  const [newSlugDraft, setNewSlugDraft] = useState("");

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

  const offers = data?.offers ?? [];
  const filteredOffers = useMemo(
    () =>
      offers.filter((o) =>
        matchesLiveSearch(listSearch, [o.name, o.slug, o.metaTitle, o.metaDescription]),
      ),
    [offers, listSearch],
  );

  const openNewOfferDialog = () => {
    setNewSlugDraft("");
    setNewOfferOpen(true);
  };

  const confirmNewOffer = () => {
    const slug = sanitizeOfferSlug(newSlugDraft);
    if (!slug) {
      toast({
        title: "Slug required",
        description: "Enter a URL slug using letters, numbers, and hyphens (e.g. my-launch-offer).",
        variant: "destructive",
      });
      return;
    }
    if (offers.some((o) => o.slug === slug)) {
      toast({
        title: "Offer already exists",
        description: `There is already an offer with slug “${slug}”. Edit it from the list or pick another slug.`,
        variant: "destructive",
      });
      return;
    }
    setNewOfferOpen(false);
    setNewSlugDraft("");
    router.push(`/admin/offers/${slug}/edit`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Site offers</h1>
            <p className="text-muted-foreground">
              Edit section text and graphics for your offer pages. Changes appear on the live site.
            </p>
          </div>
          <Button type="button" className="shrink-0" onClick={openNewOfferDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New offer
          </Button>
        </div>

        <Dialog open={newOfferOpen} onOpenChange={setNewOfferOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New site offer</DialogTitle>
              <DialogDescription>
                Choose a URL slug. You will set the page title, sections, and SEO on the next screen. The public URL will be{" "}
                <span className="font-mono text-foreground">/offers/your-slug</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="new-offer-slug">URL slug</Label>
              <Input
                id="new-offer-slug"
                placeholder="e.g. startup-growth-system"
                value={newSlugDraft}
                onChange={(e) => setNewSlugDraft(e.target.value)}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmNewOffer();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. We normalize spaces and invalid characters automatically.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setNewOfferOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmNewOffer}>
                Continue to editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!isLoading && offers.length > 0 && (
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Filter offers by name or URL as you type…"
              className="pl-9"
              aria-label="Filter offers"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : offers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No offers yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Create a new offer with a custom slug, or add the seeded Startup growth system template if you use that funnel page.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
                <Button type="button" onClick={openNewOfferDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  New offer
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/offers/startup-growth-system/edit">Add Startup growth system (template)</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredOffers.length === 0 && offers.length > 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No offers match your search.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
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
