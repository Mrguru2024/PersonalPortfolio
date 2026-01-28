"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;
  publishedAt: string;
  tags?: string[];
  readingTime?: number;
}

interface RelatedPostsProps {
  relatedPostIds: number[];
  currentPostId?: number;
  currentPostTags?: string[];
}

/**
 * RelatedPosts component - Displays related blog posts for better SEO and user engagement
 */
export function RelatedPosts({ relatedPostIds, currentPostId, currentPostTags = [] }: RelatedPostsProps) {
  const { data: allPosts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const response = await apiRequest<BlogPost[]>("GET", "/api/blog");
      return await response.json();
    },
  });

  // Filter and get related posts
  const relatedPosts = allPosts
    .filter((post) => {
      // Exclude current post
      if (currentPostId && post.id === currentPostId) return false;
      
      // If specific IDs provided, use those
      if (relatedPostIds.length > 0) {
        return relatedPostIds.includes(post.id);
      }
      
      // Otherwise, find posts with matching tags
      if (currentPostTags.length > 0 && post.tags) {
        return post.tags.some((tag) => currentPostTags.includes(tag));
      }
      
      return false;
    })
    .slice(0, 3); // Limit to 3 related posts

  if (isLoading) {
    return (
      <div className="mt-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12" itemScope itemType="https://schema.org/ItemList">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post, index) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <Card className="h-full transition-all hover:shadow-lg hover:scale-105 group">
              {post.coverImage && (
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors" itemProp="name">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-2" itemProp="description">
                  {post.summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {post.readingTime || Math.ceil((post.summary?.split(' ').length || 0) / 200)} min read
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <meta itemProp="position" content={String(index + 1)} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
