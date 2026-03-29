"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ExternalLink } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function CommunityResourceDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params?.slug ? String(params.slug) : null;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth?redirect=/Afn/resources/${slug}`);
    }
  }, [user, authLoading, router, slug]);

  const { data: resource, isLoading } = useQuery<Resource>({
    queryKey: ["/api/community/resources", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/community/resources/${encodeURIComponent(slug!)}`);
      return res.json();
    },
    enabled: !!user && !!slug,
  });

  const viewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/community/resources/${slug}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/resources", slug] });
    },
  });

  useEffect(() => {
    if (resource && user && !viewMutation.isSuccess && !viewMutation.isPending) {
      viewMutation.mutate();
    }
  }, [resource?.id, user?.id]);

  if (authLoading || !user || !slug) return null;
  if (isLoading || !resource) {
    return (
      <CommunityShell>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CommunityShell>
    );
  }

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Link href="/Afn/resources" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to resources
          </Link>
        </div>

        <Card>
          {resource.coverImageUrl && (
            <div
              className="aspect-video w-full rounded-t-lg bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${resource.coverImageUrl})` }}
            />
          )}
          <CardHeader>
            <h1 className="text-2xl font-bold">{resource.title}</h1>
            {resource.description && (
              <p className="text-muted-foreground">{resource.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {resource.contentUrl ? (
              <Button asChild className="gap-2">
                <a href={resource.contentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open resource
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">No external link for this resource.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </CommunityShell>
  );
}
