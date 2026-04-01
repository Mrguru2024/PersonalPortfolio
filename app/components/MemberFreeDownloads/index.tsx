"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface FreeOfferItem {
  id: number;
  title: string;
  description: string | null;
  assetType: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  updatedAt: string;
  downloadUrl: string;
}

export interface MemberFreeDownloadsProps {
  /** Optional extra classes for the outer section */
  className?: string;
}

function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MemberFreeDownloads({ className = "" }: MemberFreeDownloadsProps) {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/user/free-offers"],
    queryFn: async () => {
      const res = await fetch("/api/user/free-offers", { credentials: "include" });
      if (res.status === 401) {
        return { offers: [] as FreeOfferItem[] };
      }
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ offers: FreeOfferItem[] }>;
    },
    enabled: !!user && !authLoading,
  });

  const offers = data?.offers ?? [];

  return (
    <section
      id="member-downloads"
      aria-labelledby="member-downloads-heading"
      className={`scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="member-downloads-heading" className="text-xl font-semibold text-foreground">
            Member downloads
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Free files (PDFs, decks, video, images) approved by our team—available only when you&apos;re signed in.
          </p>
        </div>
      </div>

      {authLoading ? (
        <div className="flex justify-center py-10" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      ) : !user ? (
        <Card className="border-dashed bg-muted/30 dark:bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
              Sign in to download
            </CardTitle>
            <CardDescription>
              Create a free account or sign in to access member-only resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth">Sign in or register</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-10" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading downloads" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive" role="alert">
          Couldn&apos;t load downloads. Try again later.
        </p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No member downloads yet. Check back soon—we add new approved resources here.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Available downloads">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Card className="border-border/80">
                <CardContent className="px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{offer.title}</span>
                      <Badge variant="secondary" className="text-xs uppercase">
                        {offer.assetType}
                      </Badge>
                    </div>
                    {offer.description ? (
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(offer.fileSizeBytes)}
                      {offer.updatedAt ? ` · Updated ${new Date(offer.updatedAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <Button asChild className="shrink-0 gap-2 w-full sm:w-auto min-h-[44px]">
                    <a href={offer.downloadUrl} download>
                      <Download className="h-4 w-4" aria-hidden />
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
