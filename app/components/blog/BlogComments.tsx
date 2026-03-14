"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { BlogComment as BlogCommentType } from "@/lib/data";
import { useState } from "react";

const CAPTCHA_VERIFY = "not-a-robot";

interface BlogCommentsProps {
  postId: number;
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);
  const [commentForm, setCommentForm] = useState({
    name: "",
    email: "",
    content: "",
    captcha: "",
  });
  const [subscribeForm, setSubscribeForm] = useState({ name: "", email: "" });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/blog/post", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/blog/post/${postId}/comments`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return (await res.json()) as BlogCommentType[];
    },
    enabled: !!postId,
  });

  const commentMutation = useMutation({
    mutationFn: async (body: { name: string; email: string; content: string; captchaToken: string }) => {
      const res = await fetch(`/api/blog/post/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...body,
          captchaToken: body.captchaToken === CAPTCHA_VERIFY ? CAPTCHA_VERIFY : body.captchaToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data?.error || "Failed to submit comment") as Error & {
          status?: number;
          code?: string;
        };
        err.status = res.status;
        err.code = data?.code;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      setCommentForm({ name: "", email: "", content: "", captcha: "" });
      setShowSubscribeForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/blog/post", postId, "comments"] });
      toast({
        title: "Comment submitted",
        description: "Your comment is awaiting moderation.",
      });
    },
    onError: (err: Error & { status?: number; code?: string }) => {
      if (err.status === 403 && err.code === "SUBSCRIBE_REQUIRED") {
        setShowSubscribeForm(true);
        setSubscribeForm((prev) => ({ ...prev, email: commentForm.email || prev.email, name: commentForm.name || prev.name }));
        toast({
          title: "Subscriber required",
          description: "Subscribe with the same email you use to comment, then try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: err.message || "Failed to submit comment.",
          variant: "destructive",
        });
      }
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (body: { email: string; name?: string }) => {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to subscribe");
      return data;
    },
    onSuccess: () => {
      toast({
        title: "You're subscribed",
        description: "You can now leave a comment below.",
      });
      setShowSubscribeForm(false);
    },
    onError: (e: Error) => {
      toast({ title: "Subscribe failed", description: e.message, variant: "destructive" });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentForm.captcha.trim().toLowerCase() !== CAPTCHA_VERIFY) {
      toast({ title: "Verification required", description: "Type 'not-a-robot' in the verification field.", variant: "destructive" });
      return;
    }
    if (!commentForm.name.trim() || !commentForm.email.trim() || commentForm.content.trim().length < 3) {
      toast({ title: "Missing fields", description: "Name, email, and at least 3 characters for your comment are required.", variant: "destructive" });
      return;
    }
    commentMutation.mutate({
      name: commentForm.name.trim(),
      email: commentForm.email.trim(),
      content: commentForm.content.trim(),
      captchaToken: CAPTCHA_VERIFY,
    });
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeForm.email.trim()) {
      toast({ title: "Email required", description: "Enter your email to subscribe.", variant: "destructive" });
      return;
    }
    subscribeMutation.mutate({
      email: subscribeForm.email.trim(),
      name: subscribeForm.name.trim() || undefined,
    });
  };

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        Comments {comments.length > 0 ? `(${comments.length})` : ""}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        You must be a newsletter subscriber to comment. Use the same email when subscribing and commenting.
      </p>

      {showSubscribeForm && (
        <Card className="mb-6 border-primary/50">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">Subscribe to comment</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribeSubmit} className="space-y-3 max-w-md">
              <div>
                <Label htmlFor="sub-name">Name (optional)</Label>
                <Input
                  id="sub-name"
                  placeholder="Your name"
                  value={subscribeForm.name}
                  onChange={(e) => setSubscribeForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sub-email">Email *</Label>
                <Input
                  id="sub-email"
                  type="email"
                  placeholder="your@email.com"
                  value={subscribeForm.email}
                  onChange={(e) => setSubscribeForm((s) => ({ ...s, email: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <Button type="submit" disabled={subscribeMutation.isPending}>
                {subscribeMutation.isPending ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {commentsLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-6">No comments yet. Be the first to comment (subscribe first if you haven’t).</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {comments.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {c.createdAt ? format(new Date(c.createdAt), "MMMM d, yyyy") : ""}
                </p>
                <p className="text-sm">{c.content}</p>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Leave a comment</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="comment-name">Name *</Label>
                <Input
                  id="comment-name"
                  placeholder="Your name"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="comment-email">Email *</Label>
                <Input
                  id="comment-email"
                  type="email"
                  placeholder="your@email.com"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm((s) => ({ ...s, email: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="comment-content">Comment *</Label>
              <Textarea
                id="comment-content"
                placeholder="Share your thoughts…"
                value={commentForm.content}
                onChange={(e) => setCommentForm((s) => ({ ...s, content: e.target.value }))}
                className="mt-1 min-h-[120px]"
                required
              />
            </div>
            <div>
              <Label htmlFor="comment-captcha">Verification: type &quot;not-a-robot&quot; *</Label>
              <Input
                id="comment-captcha"
                placeholder="not-a-robot"
                value={commentForm.captcha}
                onChange={(e) => setCommentForm((s) => ({ ...s, captcha: e.target.value }))}
                className="mt-1 max-w-xs"
              />
            </div>
            <Button type="submit" disabled={commentMutation.isPending}>
              {commentMutation.isPending ? "Submitting…" : "Submit comment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
