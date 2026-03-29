"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, Star } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Resource {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  coverImageUrl: string | null;
  contentUrl: string | null;
  isFeatured: boolean;
}

export default function CommunityResourcesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?redirect=/Afn/resources");
    }
  }, [user, authLoading, router]);

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/community/resources"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/resources");
      return res.json();
    },
    enabled: !!user,
  });

  const featured = resources.filter((r) => r.isFeatured);
  const rest = resources.filter((r) => !r.isFeatured);

  if (authLoading || !user) return null;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Resources</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Premium guides and founder-focused content.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resources.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No resources yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Featured
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {featured.map((r) => (
                    <li key={r.id}>
                      <ResourceCard resource={r} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">All resources</h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {rest.map((r) => (
                    <li key={r.id}>
                      <ResourceCard resource={r} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </CommunityShell>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card>
      <Link href={`/Afn/resources/${resource.slug}`}>
        <CardContent className="pt-4">
          {resource.coverImageUrl && (
            <div
              className="aspect-video rounded-md bg-muted mb-3 bg-cover bg-center"
              style={{ backgroundImage: `url(${resource.coverImageUrl})` }}
            />
          )}
          <h3 className="font-semibold">{resource.title}</h3>
          {resource.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">View →</p>
        </CardContent>
      </Link>
    </Card>
  );
}
