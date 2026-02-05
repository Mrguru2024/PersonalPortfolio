"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Calendar, Tag, Search, PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { fetchBlogSeedPosts } from "@/lib/blogSeedClient";
import type { BlogPost } from "@/lib/data";
import { format } from "date-fns";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/blog");
        const json = await res.json();
        return Array.isArray(json) ? (json as BlogPost[]) : [];
      } catch {
        return fetchBlogSeedPosts();
      }
    },
  });

  const allTags = Array.from(new Set(posts.flatMap((post) => post.tags || [])));
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || (post.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <PageSEO
        title="Blog | Ascendra Technologies"
        description="Insights, tutorials, and updates from Ascendra Technologies - Full Stack Development."
        canonicalPath="/blog"
        keywords={allTags}
        ogType="blog"
        schemaType="CollectionPage"
      />

      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Thoughts, insights, and updates from my journey as a developer and
              entrepreneur.
            </p>
          </div>
          <div className="flex justify-end mb-4">
            <Button asChild>
              <Link href="/admin/blog">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Post
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="w-full md:w-3/4">
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <Skeleton className="h-[200px] w-full" />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <Skeleton className="h-8 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-1/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 rounded-lg bg-muted">
                <p className="text-destructive mb-4">
                  Failed to load blog posts
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 rounded-lg bg-muted">
                <p className="text-muted-foreground">
                  {searchQuery || selectedTag
                    ? "No posts match your search criteria"
                    : "No blog posts available yet"}
                </p>
                {(searchQuery || selectedTag) && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTag(null);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 h-[200px] overflow-hidden">
                        <img
                          src={post.coverImage || ""}
                          alt=""
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <CardHeader className="p-0 mb-2">
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Calendar className="mr-1 h-3 w-3" />
                            {post.publishedAt
                              ? format(
                                  new Date(post.publishedAt),
                                  "MMMM d, yyyy"
                                )
                              : "—"}
                          </div>
                          <CardTitle className="text-xl mb-1">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="hover:text-primary transition-colors"
                            >
                              {post.title}
                            </Link>
                          </CardTitle>
                          <CardDescription>
                            {(post.tags || []).slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant={
                                  tag === selectedTag ? "default" : "outline"
                                }
                                className="mr-2 cursor-pointer mb-1"
                                onClick={() =>
                                  setSelectedTag(
                                    tag === selectedTag ? null : tag
                                  )
                                }
                              >
                                {tag}
                              </Badge>
                            ))}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                          <p className="text-muted-foreground line-clamp-3 mb-4">
                            {post.summary || ""}
                          </p>
                          <Button
                            variant="link"
                            className="px-0 h-auto"
                            asChild
                          >
                            <Link href={`/blog/${post.slug}`}>Read more →</Link>
                          </Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedTag === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTag(null)}
                  >
                    All
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tag === selectedTag ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedTag(tag === selectedTag ? null : tag)
                      }
                    >
                      <Tag className="h-3 w-3 mr-1 inline" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  I write about my experiences as a developer, entrepreneur, and
                  lifelong learner.
                </p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/#contact">Get in touch</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
