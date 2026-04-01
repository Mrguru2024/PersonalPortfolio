"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Loader2, Send } from "lucide-react";
import { CommunityAuthLoading } from "@/components/community/CommunityAuthLoading";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Thread {
  id: number;
  createdAt: string;
  otherUserId: number | null;
  otherProfile: { displayName: string | null; username: string | null; avatarUrl: string | null } | null;
}

interface Message {
  id: number;
  threadId: number;
  senderId: number;
  body: string;
  createdAt: string;
  senderProfile: { displayName: string | null; username: string | null } | null;
}

export default function CommunityInboxPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const withUserId = searchParams.get("with");
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messageBody, setMessageBody] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?redirect=/Afn/inbox");
    }
  }, [user, authLoading, router]);

  const { data: threads = [] } = useQuery<Thread[]>({
    queryKey: ["/api/community/messages/threads"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/messages/threads");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: threadForUser, isLoading: loadingThread } = useQuery({
    queryKey: ["/api/community/messages/threadWith", withUserId],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/community/messages/threads", {
        otherUserId: parseInt(withUserId!, 10),
      });
      return res.json();
    },
    enabled: !!user && !!withUserId && /^\d+$/.test(withUserId),
  });

  useEffect(() => {
    if (threadForUser?.id) {
      setSelectedThreadId(threadForUser.id);
      queryClient.invalidateQueries({ queryKey: ["/api/community/messages/threads"] });
    }
  }, [threadForUser?.id, queryClient]);

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/community/messages/threads", selectedThreadId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/community/messages/threads/${selectedThreadId}`);
      return res.json();
    },
    enabled: !!user && !!selectedThreadId,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", `/api/community/messages/threads/${selectedThreadId}/messages`, { body });
      return res.json();
    },
    onSuccess: () => {
      setMessageBody("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/community/messages/threads"] });
    },
    onError: (e: Error) => {
      toast({ title: e.message || "Failed to send", variant: "destructive" });
    },
  });

  if (!mounted || authLoading || !user) return <CommunityAuthLoading />;

  const selectedThread = threads.find((t) => t.id === selectedThreadId);
  const otherDisplayName = selectedThread?.otherProfile?.displayName || selectedThread?.otherProfile?.username || `User #${selectedThread?.otherUserId}`;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Inbox</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Private messages. You can only message members who allow it.
        </p>

        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <Card>
            <CardContent className="p-0">
              {threads.length === 0 && !withUserId ? (
                <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                <ul className="divide-y">
                  {threads.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50"
                        onClick={() => setSelectedThreadId(t.id)}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={t.otherProfile?.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(t.otherProfile?.displayName || t.otherProfile?.username || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {t.otherProfile?.displayName || t.otherProfile?.username || `User #${t.otherUserId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                  {loadingThread && withUserId && !threadForUser && (
                    <li className="p-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              {!selectedThreadId ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Select a conversation or message a member from their profile.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedThread?.otherProfile?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{otherDisplayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{otherDisplayName}</p>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            m.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={`text-xs mt-1 ${m.senderId === user?.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      size="icon"
                      className="shrink-0"
                      onClick={() => sendMutation.mutate(messageBody.trim())}
                      disabled={!messageBody.trim() || sendMutation.isPending}
                    >
                      {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CommunityShell>
  );
}
