"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ThumbsUp, Bookmark, Loader2, Send } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: number;
  postId: number;
  authorId: number;
  body: string;
  createdAt: string;
  authorProfile: { displayName: string | null; username: string | null; avatarUrl: string | null } | null;
}

export default function CommunityPostDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const postId = params?.id ? String(params.id) : null;
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/community/post/${postId}`);
    }
  }, [user, authLoading, router, postId]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/community/posts", postId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/community/posts/${postId}`);
      return res.json();
    },
    enabled: !!user && !!postId,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: ["/api/community/posts", postId, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/community/posts/${postId}/comments`);
      return res.json();
    },
    enabled: !!user && !!postId && !!data?.post,
  });

  const reactionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/community/posts/${postId}/reaction`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId] });
    },
  });

  const savedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/community/posts/${postId}/saved`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/comments`, { body });
      return res.json();
    },
    onSuccess: () => {
      setCommentBody("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId] });
      toast({ title: "Comment added" });
    },
    onError: (e: Error) => {
      toast({ title: e.message || "Failed to add comment", variant: "destructive" });
    },
  });

  if (authLoading || !user || !postId) return null;
  if (isLoading || !data?.post) {
    return (
      <CommunityShell>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CommunityShell>
    );
  }

  const { post, authorProfile, category } = data;
  const displayName = authorProfile?.displayName || authorProfile?.username || `User #${post.authorId}`;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <Link href="/community/feed" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to feed
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link
                href={`/community/members/${authorProfile?.username ?? post.authorId}`}
                className="flex items-center gap-2 hover:text-foreground font-medium"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={authorProfile?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {displayName}
              </Link>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              {category && (
                <>
                  <span>·</span>
                  <span>{category.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold">{post.title}</h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {post.body}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => reactionMutation.mutate()}
                disabled={reactionMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful ({post.helpfulCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => savedMutation.mutate()}
                disabled={savedMutation.isPending}
              >
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
              <span className="text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.commentCount} comments
              </span>
              <span className="text-muted-foreground">{post.viewCount} views</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Comments</h2>
          <div className="space-y-4">
            {comments.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.authorProfile?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {(c.authorProfile?.displayName || c.authorProfile?.username || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                          href={`/community/members/${c.authorProfile?.username ?? c.authorId}`}
                          className="font-medium hover:text-foreground"
                        >
                          {c.authorProfile?.displayName || c.authorProfile?.username || `User #${c.authorId}`}
                        </Link>
                        <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <CardContent className="pt-4">
              <Label className="sr-only">Add a comment</Label>
              <Textarea
                placeholder="Add a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <Button
                size="sm"
                className="gap-2"
                onClick={() => commentMutation.mutate(commentBody.trim())}
                disabled={!commentBody.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Comment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </CommunityShell>
  );
}
