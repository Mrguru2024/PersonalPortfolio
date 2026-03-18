"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, ThumbsUp, Bookmark, Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface AuthorProfile {
  id: number;
  userId: number;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface Post {
  id: number;
  authorId: number;
  categoryId: number;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  helpfulCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  authorProfile: AuthorProfile | null;
}

export default function CommunityFeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const categorySlug = searchParams.get("category") ?? undefined;
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/community/feed");
    }
  }, [user, authLoading, router]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/community/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/categories");
      return res.json();
    },
    enabled: !!user,
  });

  const { data, isLoading } = useQuery<{ posts: Post[]; savedPostIds: number[] }>({
    queryKey: ["/api/community/posts", categorySlug],
    queryFn: async () => {
      const url = categorySlug
        ? `/api/community/posts?categorySlug=${encodeURIComponent(categorySlug)}`
        : "/api/community/posts";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user,
  });

  const createPostMutation = useMutation({
    mutationFn: async (payload: { categoryId: number; title: string; body: string }) => {
      const res = await apiRequest("POST", "/api/community/posts", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setCreateOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewCategoryId("");
      toast({ title: "Post created" });
    },
    onError: (e: Error) => {
      toast({ title: e.message || "Failed to create post", variant: "destructive" });
    },
  });

  const posts = data?.posts ?? [];
  const savedPostIds = new Set(data?.savedPostIds ?? []);

  if (authLoading || !user) return null;

  const handleCreatePost = () => {
    const catId = newCategoryId ? parseInt(newCategoryId, 10) : categories[0]?.id;
    if (!catId || !newTitle.trim() || !newBody.trim()) {
      toast({ title: "Title and body are required", variant: "destructive" });
      return;
    }
    createPostMutation.mutate({ categoryId: catId, title: newTitle.trim(), body: newBody.trim() });
  };

  return (
    <CommunityShell>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Feed</h1>
            <p className="text-muted-foreground text-sm">
              Discussions from the founder network.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Category</Label>
                  <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c: { id: number; slug: string; name: string }) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Post title"
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={5}
                  />
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || !newTitle.trim() || !newBody.trim()}
                  className="w-full"
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={!categorySlug ? "default" : "outline"} size="sm" asChild>
            <Link href="/community/feed">All</Link>
          </Button>
          {categories.map((c: { slug: string; name: string }) => (
            <Button
              key={c.slug}
              variant={categorySlug === c.slug ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/community/feed?category=${encodeURIComponent(c.slug)}`}>
                {c.name}
              </Link>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
              <h2 className="text-lg font-semibold">No posts yet</h2>
              <p className="text-muted-foreground text-sm">
                Be the first to start a discussion. Click &quot;New post&quot; above.
              </p>
            </CardHeader>
          </Card>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link
                        href={`/community/members/${post.authorProfile?.username ?? post.authorId}`}
                        className="hover:text-foreground font-medium"
                      >
                        {post.authorProfile?.displayName || post.authorProfile?.username || `User #${post.authorId}`}
                      </Link>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    </div>
                    <Link href={`/community/post/${post.id}`} className="hover:underline">
                      <h2 className="text-lg font-semibold">{post.title}</h2>
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.excerpt || post.body.slice(0, 200)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        href={`/community/post/${post.id}`}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {post.commentCount}
                      </Link>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {post.helpfulCount}
                      </span>
                      <span>{post.viewCount} views</span>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CommunityShell>
  );
}
