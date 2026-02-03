"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BlogPostSEO, StructuredData } from "@/components/SEO";
import { BlogPostFormatter } from "@/components/blog/BlogPostFormatter";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost as BlogPostType } from "@/lib/data";

interface BlogPostProps {
  slug: string;
}

export default function BlogPost({ slug }: Readonly<BlogPostProps>) {
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/blog", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/blog/${slug}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Post not found");
      }
      return res.json() as Promise<BlogPostType>;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full mb-8 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Post not found</AlertTitle>
          <AlertDescription>
            The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to blog
          </Link>
        </Button>
      </div>
    );
  }

  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <BlogPostSEO post={post} />
      <StructuredData
        schema={{
          type: "BlogPosting",
          data: {
            headline: post.title,
            description: post.summary || post.content?.slice(0, 160) || "",
            image: post.coverImage || "",
            datePublished: post.publishedAt || "",
            dateModified: post.updatedAt || post.publishedAt || "",
            author: { name: "Anthony Feaster", url: "https://mrguru.dev" },
            publisher: { name: "MrGuru.dev", url: "https://mrguru.dev" },
            url: `https://mrguru.dev/blog/${post.slug}`,
            mainEntityOfPage: `https://mrguru.dev/blog/${post.slug}`,
            keywords: tags,
          },
        }}
      />

      <Button variant="ghost" asChild className="mb-6">
        <Link href="/blog">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to blog
        </Link>
      </Button>

      <article>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{post.title}</h1>
        <div className="flex flex-wrap gap-3 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "—"}
          </span>
          {tags.length > 0 && (
            <span className="flex items-center gap-1 flex-wrap">
              <Tag className="h-4 w-4" />
              {tags.map((t) => (
                <span key={t} className="mr-1">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt=""
            className="w-full rounded-lg mb-8 object-cover max-h-80"
          />
        )}
        <BlogPostFormatter
          content={post.content || post.summary || ""}
          internalLinks={post.internalLinks ?? []}
          externalLinks={post.externalLinks ?? []}
        />
        <RelatedPosts
          relatedPostIds={post.relatedPosts ?? []}
          currentPostId={post.id}
          currentPostTags={tags}
        />
      </article>
    </div>
  );
}
