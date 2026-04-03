"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send, ArrowLeft, Mail, Smartphone, Bell } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ChatMessage {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  senderUsername: string;
  senderEmail?: string;
}

export default function AdminChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [alsoSendEmail, setAlsoSendEmail] = useState(false);
  const [alsoSendSms, setAlsoSendSms] = useState(false);
  const [alsoSendPush, setAlsoSendPush] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [recipientPhones, setRecipientPhones] = useState("");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/admin/chat/messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/chat/messages");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    refetchInterval: 10_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: {
      content: string;
      alsoSendEmail: boolean;
      alsoSendSms: boolean;
      alsoSendPush: boolean;
      recipientEmails?: string;
      recipientPhones?: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/chat/messages", payload);
      return res.json() as Promise<{
        id: number;
        senderId: number;
        content: string;
        createdAt: string;
        senderUsername: string;
        senderEmail?: string;
        delivery?: {
          email?: number | boolean;
          emailHint?: string;
          sms?: number | boolean;
          smsHint?: string;
          push?: number;
        };
      }>;
    },
    onSuccess: (data, variables) => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/notifications"] });
      const d = data.delivery;
      const wantedEmail = variables.alsoSendEmail === true;
      const wantedSms = variables.alsoSendSms === true;
      const wantedPush = variables.alsoSendPush === true;

      const hintLabel = (hint?: string) => {
        const map: Record<string, string> = {
          brevo_not_configured: "Email: complete your email-delivery setup in Connections & email.",
          no_recipients: "Email/SMS: add recipient(s) in the fields or set ADMIN_EMAIL / ADMIN_PHONE.",
          send_failed: "Provider rejected the send — check server logs or Brevo/Twilio dashboard.",
          twilio_not_configured: "SMS: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.",
        };
        return hint ? map[hint] ?? hint : "";
      };

      if (
        d &&
        (wantedEmail ||
          wantedSms ||
          wantedPush ||
          d.email !== undefined ||
          d.sms !== undefined ||
          d.push !== undefined)
      ) {
        const parts: string[] = [];
        if (wantedEmail || d.email !== undefined) {
          if (d.email === true) parts.push("Email sent");
          else if (d.email === false) parts.push("Email not sent");
          else if (typeof d.email === "number")
            parts.push(d.email > 0 ? `Email sent to ${d.email} recipient(s)` : "Email not sent to any recipient");
          if (d.emailHint) {
            const h = hintLabel(d.emailHint);
            if (h) parts.push(h);
          }
        }
        if (wantedSms || d.sms !== undefined) {
          if (d.sms === true) parts.push("SMS sent");
          else if (d.sms === false) parts.push("SMS not sent");
          else if (typeof d.sms === "number")
            parts.push(d.sms > 0 ? `SMS sent to ${d.sms} number(s)` : "SMS not sent");
          if (d.smsHint) {
            const h = hintLabel(d.smsHint);
            if (h) parts.push(h);
          }
        }
        if (wantedPush) {
          if (typeof d.push === "number") {
            parts.push(d.push > 0 ? `Push: ${d.push} device(s)` : "Push: no deliveries (subscribe this device or check VAPID)");
          }
        }
        if (parts.length) toast({ title: "Delivery status", description: parts.join(" ") });
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to send",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (lastReadMessageId: number) => {
      await apiRequest("POST", "/api/admin/chat/read", {
        lastReadMessageId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/notifications"] });
    },
  });

  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      const maxId = Math.max(...messages.map((m) => m.id));
      markReadMutation.mutate(maxId);
    }
  }, [messages.length, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate({
      content: text,
      alsoSendEmail,
      alsoSendSms,
      alsoSendPush,
      recipientEmails: recipientEmails.trim() || undefined,
      recipientPhones: recipientPhones.trim() || undefined,
    });
  };

  const subscribePushMutation = useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push not supported in this browser");
      }
      const keyRes = await fetch("/api/admin/push/vapid-public-key", { credentials: "include" });
      if (!keyRes.ok) throw new Error("Cannot get push key");
      const { vapidPublicKey } = await keyRes.json();
      if (!vapidPublicKey) throw new Error("Push not configured (VAPID keys missing)");
      if (!navigator.serviceWorker.controller) {
        await navigator.serviceWorker.register("/sw.js");
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
      const subscription = sub.toJSON();
      const res = await apiRequest("POST", "/api/admin/push/subscribe", {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });
      if (!res.ok) throw new Error("Subscribe failed");
    },
    onSuccess: () => {
      setPushSubscribed(true);
      toast({ title: "Push enabled", description: "This device will receive push notifications." });
    },
    onError: (err: Error) => {
      toast({ title: "Push subscribe failed", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-6 max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Internal Chat
        </h1>
      </div>

      <Card className="flex flex-col h-[calc(100vh-12rem)] min-h-[400px]">
        <CardHeader className="shrink-0 py-4">
          <CardTitle>Team chat</CardTitle>
          <CardDescription>
            Every message is sent as a direct message in the team chat. You can also deliver a copy via email, SMS, or push to device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 border-t min-h-0"
                style={{ maxHeight: "calc(100vh - 20rem)" }}
              >
                <div className="py-4 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    [...messages].reverse().map((msg) => {
                      const isOwn = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`rounded-lg px-3 py-2 max-w-[85%] ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-medium opacity-90 mb-0.5">
                                {msg.senderUsername}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "opacity-80" : "text-muted-foreground"
                              }`}
                            >
                              {format(
                                new Date(msg.createdAt),
                                "MMM d, h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="shrink-0 border-t bg-muted/30 p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Delivery options
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Direct message (team chat) is always sent. Optionally also deliver via:
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alsoSendEmail}
                        onCheckedChange={(c) => setAlsoSendEmail(c === true)}
                      />
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>Email (Brevo)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alsoSendSms}
                        onCheckedChange={(c) => setAlsoSendSms(!!c)}
                      />
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span>SMS (optional)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={alsoSendPush}
                        onCheckedChange={(c) => setAlsoSendPush(c === true)}
                      />
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span>Push to device</span>
                    </label>
                    {!pushSubscribed && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => subscribePushMutation.mutate()}
                        disabled={subscribePushMutation.isPending}
                      >
                        {subscribePushMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Enable push on this device"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {(alsoSendEmail || alsoSendSms) && (
                  <div className="flex flex-col gap-3 pt-1 border-t border-border/50">
                    {alsoSendEmail && (
                      <div className="space-y-1">
                        <Label htmlFor="recipient-emails" className="text-xs whitespace-nowrap">Recipient email(s)</Label>
                        <Textarea
                          id="recipient-emails"
                          placeholder="One per line or comma-separated. Blank = ADMIN_EMAIL"
                          value={recipientEmails}
                          onChange={(e) => setRecipientEmails(e.target.value)}
                          className="min-h-[60px] text-sm resize-y"
                          rows={2}
                        />
                      </div>
                    )}
                    {alsoSendSms && (
                      <div className="space-y-1">
                        <Label htmlFor="recipient-phones" className="text-xs whitespace-nowrap">Recipient phone(s)</Label>
                        <Textarea
                          id="recipient-phones"
                          placeholder="One per line or comma-separated. Blank = ADMIN_PHONE"
                          value={recipientPhones}
                          onChange={(e) => setRecipientPhones(e.target.value)}
                          className="min-h-[60px] text-sm resize-y"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                )}
                <form
                  onSubmit={handleSubmit}
                  className="flex gap-2"
                >
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[44px] max-h-32 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    disabled={sendMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0 h-11 w-11"
                    disabled={!content.trim() || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
