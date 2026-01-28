"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, Users, TrendingUp, Clock, CheckCircle, ArrowLeft, Link2, ExternalLink, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import Link from "next/link";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  viewCount?: number;
  uniqueViewCount?: number;
}

interface BlogAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageScrollDepth: number;
  averageTimeSpent: number;
  completionRate: number;
  totalClicks?: number;
  internalLinkClicks?: number;
  externalLinkClicks?: number;
  shareClicks?: number;
  views?: Array<{
    id: number;
    sessionId: string;
    viewedAt: string;
    maxScrollDepth: number;
    timeSpent: number;
    readComplete: boolean;
    scrollEvents?: Array<{ 
      timestamp: number; 
      depth: number; 
      type?: string; 
      clickType?: string; 
      href?: string | null;
    }>;
  }>;
}

export default function BlogAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch all blog posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/blog");
      return await response.json();
    },
    enabled: !!user?.isAdmin,
  });

  // Fetch analytics for selected post
  const { data: analytics, isLoading: analyticsLoading } = useQuery<BlogAnalytics>({
    queryKey: ["/api/blog", selectedPost, "analytics"],
    queryFn: async () => {
      if (!selectedPost) return null;
      const response = await apiRequest("GET", `/api/blog/${selectedPost}/analytics`);
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!selectedPost,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-4xl font-bold mb-2">Blog Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track views, engagement, and reading behavior for your blog posts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blog Posts List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Select a post to view analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blog posts found</p>
              ) : (
                <div className="space-y-2">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post.slug)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all
                        ${selectedPost === post.slug
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                        }
                      `}
                    >
                      <div className="font-medium text-sm mb-1">{post.title}</div>
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <Eye className="h-3 w-3" />
                        <span>{post.viewCount || 0} views</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Display */}
        <div className="lg:col-span-2">
          {!selectedPost ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a blog post to view analytics</p>
              </CardContent>
            </Card>
          ) : analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalViews}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.uniqueViews} unique
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Scroll Depth</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.averageScrollDepth}%</div>
                    <p className="text-xs text-muted-foreground">Average depth</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor(analytics.averageTimeSpent / 60)}m {analytics.averageTimeSpent % 60}s
                    </div>
                    <p className="text-xs text-muted-foreground">Per view</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                    <p className="text-xs text-muted-foreground">Read to end</p>
                  </CardContent>
                </Card>
              </div>

              {/* Interaction Metrics */}
              {analytics.totalClicks !== undefined && analytics.totalClicks > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalClicks || 0}</div>
                      <p className="text-xs text-muted-foreground">All interactions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Internal Links</CardTitle>
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.internalLinkClicks || 0}</div>
                      <p className="text-xs text-muted-foreground">On-site links</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">External Links</CardTitle>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.externalLinkClicks || 0}</div>
                      <p className="text-xs text-muted-foreground">Off-site links</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Views */}
              {analytics.views && analytics.views.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Views & Interactions</CardTitle>
                    <CardDescription>Last 50 views with engagement data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {analytics.views.slice(0, 50).map((view) => {
                        // Count clicks from scroll events
                        const clicks = view.scrollEvents?.filter((e: any) => e.type === "click") || [];
                        const internalClicks = clicks.filter((c: any) => c.clickType === "internal_link").length;
                        const externalClicks = clicks.filter((c: any) => c.clickType === "external_link").length;
                        const shareClicks = clicks.filter((c: any) => c.clickType?.startsWith("share_")).length;
                        
                        return (
                          <div
                            key={view.id}
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {view.sessionId.slice(0, 8)}...
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(view.viewedAt), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                                {view.readComplete && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Scroll:</span>
                                  <span className="font-medium">{view.maxScrollDepth}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Time:</span>
                                  <span className="font-medium">
                                    {Math.floor(view.timeSpent / 60)}m {view.timeSpent % 60}s
                                  </span>
                                </div>
                                {clicks.length > 0 && (
                                  <>
                                    {internalClicks > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Link2 className="h-3 w-3 text-blue-500" />
                                        <span className="text-muted-foreground">Internal:</span>
                                        <span className="font-medium">{internalClicks}</span>
                                      </div>
                                    )}
                                    {externalClicks > 0 && (
                                      <div className="flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3 text-green-500" />
                                        <span className="text-muted-foreground">External:</span>
                                        <span className="font-medium">{externalClicks}</span>
                                      </div>
                                    )}
                                    {shareClicks > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Share2 className="h-3 w-3 text-purple-500" />
                                        <span className="text-muted-foreground">Shares:</span>
                                        <span className="font-medium">{shareClicks}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No analytics data available for this post</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
