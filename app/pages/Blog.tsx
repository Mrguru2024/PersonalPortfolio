"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Calendar, Tag, Search, PlusCircle, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { PRIMARY_CTA, SECONDARY_CTA, AUDIT_PATH, BOOK_CALL_HREF } from "@/lib/funnelCtas";
import { fetchBlogSeedPosts } from "@/lib/blogSeedClient";
import type { BlogPost } from "@/lib/data";
import { format } from "date-fns";
import { matchesLiveSearch } from "@/lib/matchesLiveSearch";

const POSTS_PER_PAGE = 12;

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

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
        const list = Array.isArray(json) ? (json as BlogPost[]) : [];
        if (list.length === 0) return fetchBlogSeedPosts();
        return list;
      } catch {
        return fetchBlogSeedPosts();
      }
    },
  });

  const allTags = Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort();
  const filteredPosts = useMemo(() => {
    const tagged = posts.filter((post) => !selectedTag || (post.tags || []).includes(selectedTag));
    const searched = tagged.filter((post) =>
      matchesLiveSearch(searchQuery, [post.title, post.summary, ...(post.tags || [])]),
    );
    return [...searched].sort((a, b) => {
      if (sortOrder === "newest" || sortOrder === "oldest") {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      }
      const titleA = (a.title || "").toLowerCase();
      const titleB = (b.title || "").toLowerCase();
      if (sortOrder === "title-asc") return titleA.localeCompare(titleB);
      return titleB.localeCompare(titleA);
    });
  }, [posts, searchQuery, selectedTag, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const start = (page - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTag, sortOrder]);

  const hasActiveFilters = !!searchQuery.trim() || selectedTag !== null;
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
    setPage(1);
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12 min-w-0 max-w-full">
      <PageSEO
        title="Blog | Ascendra Technologies"
        description="Insights and updates from Ascendra Technologies – brand growth, web systems, and development."
        canonicalPath="/blog"
        keywords={allTags}
        ogType="blog"
        schemaType="CollectionPage"
      />

      <div className="max-w-5xl mx-auto min-w-0">
        <div className="mb-8 sm:mb-12">
          <div className="text-center">
            <h1 className="text-2xl fold:text-3xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-1">Blog</h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 px-1">
              Thoughts, insights, and updates from my journey as a developer and
              entrepreneur.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0 min-h-[44px]">
                <Link href={AUDIT_PATH}>{PRIMARY_CTA}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-[44px] border-border">
                <Link href={BOOK_CALL_HREF}>{SECONDARY_CTA}</Link>
              </Button>
            </div>
            <Button asChild className="w-full sm:w-auto min-h-[44px]">
              <Link href="/admin/blog">
                <PlusCircle className="h-4 w-4 mr-2 shrink-0" />
                Create New Post
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8 sm:mb-10">
          <div className="w-full min-w-0 lg:flex-1 lg:min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search by keyword or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search blog posts"
                />
              </div>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px] shrink-0" aria-label="Sort order">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title-asc">Title A–Z</SelectItem>
                  <SelectItem value="title-desc">Title Z–A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
                {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-muted-foreground">
                  Clear filters
                </Button>
              )}
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
                  {hasActiveFilters
                    ? "No posts match your search or filter. Try different keywords or topics."
                    : "No blog posts available yet"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {paginatedPosts.map((post) => (
                    <Card
                      key={post.slug}
                      className="overflow-hidden transition-theme hover-lift flex flex-col"
                    >
                      <div className="aspect-video sm:aspect-[16/10] overflow-hidden bg-muted">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt=""
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <CardHeader className="p-0 mb-2">
                          <div className="flex items-center text-sm text-muted-foreground mb-1">
                            <Calendar className="mr-1 h-3 w-3 shrink-0" />
                            {post.publishedAt
                              ? format(
                                  new Date(post.publishedAt),
                                  "MMM d, yyyy"
                                )
                              : "—"}
                          </div>
                          <CardTitle className="text-lg sm:text-xl mb-1 line-clamp-2">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="hover:text-primary transition-colors"
                            >
                              {post.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-1 mt-1">
                            {(post.tags || []).slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant={
                                  tag === selectedTag ? "default" : "outline"
                                }
                                className="cursor-pointer text-xs"
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
                        <CardContent className="p-0 mt-3 flex-1 flex flex-col">
                          <p className="text-muted-foreground text-sm line-clamp-3 mb-3 flex-1">
                            {post.summary || ""}
                          </p>
                          <Button
                            variant="link"
                            className="px-0 h-auto text-primary w-fit"
                            asChild
                          >
                            <Link href={`/blog/${post.slug}`}>Read more →</Link>
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav
                    className="mt-8 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Blog pagination"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </nav>
                )}
              </>
            )}
          </div>

          <aside className="w-full lg:w-72 lg:shrink-0">
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by topic
                </CardTitle>
                <CardDescription className="text-xs">
                  Click a tag to show only posts in that topic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 lg:overflow-visible">
                  <Badge
                    variant={selectedTag === null ? "default" : "outline"}
                    className="cursor-pointer shrink-0"
                    onClick={() => setSelectedTag(null)}
                  >
                    All topics
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tag === selectedTag ? "default" : "outline"}
                      className="cursor-pointer shrink-0"
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
                  Practical insights on strategy, design, and technology—for
                  business owners improving their digital presence and for
                  developers and founders building products.
                </p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/contact">Get in touch</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      </div>
    </div>
  );
}
