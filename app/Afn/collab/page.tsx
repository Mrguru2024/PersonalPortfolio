"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Handshake, Plus, Loader2, Mail } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { COLLAB_TYPES, COLLAB_TYPE_LABELS } from "@/lib/community/constants";

interface CollabPost {
  id: number;
  authorId: number;
  type: string;
  title: string;
  description: string;
  status: string;
  contactPreference: string;
  createdAt: string;
  authorProfile: { displayName: string | null; username: string | null } | null;
}

export default function CommunityCollabPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?redirect=/Afn/collab");
    }
  }, [user, authLoading, router]);

  const { data: posts = [], isLoading } = useQuery<CollabPost[]>({
    queryKey: ["/api/community/collab", statusFilter],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/community/collab?status=${statusFilter}`);
      return res.json();
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { type: string; title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/community/collab", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/collab"] });
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setType("");
      toast({ title: "Post created" });
    },
    onError: (e: Error) => {
      toast({ title: e.message || "Failed to create", variant: "destructive" });
    },
  });

  if (authLoading || !user) return null;

  const handleCreate = () => {
    if (!type.trim() || !title.trim() || !description.trim()) {
      toast({ title: "Fill type, title, and description", variant: "destructive" });
      return;
    }
    createMutation.mutate({ type, title, description });
  };

  return (
    <CommunityShell>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Collaboration board</h1>
            <p className="text-muted-foreground text-sm">
              Find or offer help—developers, designers, marketers, partners.
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
                <DialogTitle>New collaboration post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLAB_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {COLLAB_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you looking for or offering?"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !type || !title.trim() || !description.trim()}
                  className="w-full"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={statusFilter === "open" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("open")}>
            Open
          </Button>
          <Button variant={statusFilter === "closed" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("closed")}>
            Closed
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Handshake className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No collaboration posts yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                          href={`/Afn/members/${post.authorProfile?.username ?? post.authorId}`}
                          className="font-medium hover:text-foreground"
                        >
                          {post.authorProfile?.displayName || post.authorProfile?.username || `User #${post.authorId}`}
                        </Link>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      </div>
                      <Badge variant={post.status === "open" ? "default" : "secondary"}>{post.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{COLLAB_TYPE_LABELS[post.type as keyof typeof COLLAB_TYPE_LABELS] ?? post.type}</p>
                    <h2 className="text-lg font-semibold">{post.title}</h2>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.description}</p>
                    {post.authorId !== user?.id && (
                      <Button variant="outline" size="sm" className="mt-3 gap-2" asChild>
                        <Link href={`/Afn/inbox?with=${post.authorId}`}>
                          <Mail className="h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                    )}
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
