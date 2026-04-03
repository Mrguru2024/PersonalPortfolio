"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isAuthApprovedAdmin } from "@/lib/super-admin";
import { cn } from "@/lib/utils";
import type { SystemEmailMessage, SystemEmailStatus } from "@shared/systemEmailTypes";

function groupByThread(messages: SystemEmailMessage[]): Map<string | null, SystemEmailMessage[]> {
  const m = new Map<string | null, SystemEmailMessage[]>();
  for (const msg of messages) {
    const key = msg.threadKey ?? msg.messageId ?? `uid-${msg.uid}`;
    const list = m.get(key) ?? [];
    list.push(msg);
    m.set(key, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return m;
}

export default function AdminSystemEmailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth?redirect=/admin/system-email");
    else if (!authLoading && user && !isAuthApprovedAdmin(user)) router.replace("/");
  }, [user, authLoading, router]);

  const statusQuery = useQuery({
    queryKey: ["/api/admin/system-email/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-email/status", { credentials: "include" });
      if (!res.ok) throw new Error("Status failed");
      return res.json() as Promise<SystemEmailStatus>;
    },
    enabled: !!user && isAuthApprovedAdmin(user ?? null),
  });

  const messagesQuery = useQuery({
    queryKey: ["/api/admin/system-email/messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-email/messages?limit=40", { credentials: "include" });
      const data = (await res.json()) as { ok: boolean; messages?: SystemEmailMessage[]; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load mailbox");
      }
      return data.messages ?? [];
    },
    enabled: !!user && isAuthApprovedAdmin(user ?? null),
  });

  const testSendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/system-email/test-send", {});
      return res.json() as Promise<{ ok: boolean; messageId?: string; error?: string; to?: string }>;
    },
    onSuccess: (data) => {
      if (data.ok) {
        toast({ title: "Test email sent", description: `Delivered to ${data.to ?? "mailbox"}.` });
      } else {
        toast({ title: "Send failed", description: data.error ?? "Unknown error", variant: "destructive" });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/system-email/messages"] });
    },
  });

  const filtered = useMemo(() => {
    const raw = messagesQuery.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.fromAddress.includes(q) ||
        m.preview.toLowerCase().includes(q),
    );
  }, [messagesQuery.data, filter]);

  const selected = useMemo(
    () => filtered.find((m) => m.uid === selectedUid) ?? filtered[0] ?? null,
    [filtered, selectedUid],
  );

  useEffect(() => {
    if (filtered.length && selectedUid == null) {
      setSelectedUid(filtered[0].uid);
    }
  }, [filtered, selectedUid]);

  const threadGroups = useMemo(() => groupByThread(filtered), [filtered]);

  const refreshAll = useCallback(() => {
    void statusQuery.refetch();
    void messagesQuery.refetch();
  }, [statusQuery, messagesQuery]);

  const ready = !!user && isAuthApprovedAdmin(user ?? null);

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="container max-w-7xl mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-1" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <span className="text-muted-foreground/50 hidden sm:inline">|</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/inbox">Inbound inbox (forms)</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/email-hub">Email Hub (Brevo)</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/settings">Settings</Link>
          </Button>
        </div>

        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ascendra OS</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <Mail className="h-7 w-7 shrink-0" />
            System email (IONOS)
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
            Hosted mailbox over IMAP — for operational visibility alongside{" "}
            <Link href="/admin/email-hub" className="text-primary underline-offset-2 hover:underline">
              Email Hub
            </Link>{" "}
            (Brevo outbound). Does not replace transactional delivery configured elsewhere.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {statusQuery.data ? (
            <>
              <Badge variant={statusQuery.data.smtpConfigured ? "default" : "destructive"}>
                SMTP {statusQuery.data.smtpConfigured ? "configured" : "missing env"}
              </Badge>
              <Badge variant={statusQuery.data.imapConfigured ? "secondary" : "outline"}>
                {statusQuery.data.smtpHost}:{statusQuery.data.smtpPort} · IMAP {statusQuery.data.imapHost}:
                {statusQuery.data.imapPort}
              </Badge>
              {statusQuery.data.senderEmail ? (
                <Badge variant="outline" className="font-normal">
                  From: {statusQuery.data.senderName} &lt;{statusQuery.data.senderEmail}&gt;
                </Badge>
              ) : null}
            </>
          ) : statusQuery.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={refreshAll} disabled={messagesQuery.isFetching}>
            <RefreshCw className={cn("h-4 w-4 mr-1", messagesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!statusQuery.data?.smtpConfigured || testSendMutation.isPending}
            onClick={() => testSendMutation.mutate()}
          >
            {testSendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Send test
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[520px]">
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            <CardHeader className="py-4 space-y-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Inbox
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Filter subject, sender…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {threadGroups.size} thread{threadGroups.size === 1 ? "" : "s"} · {filtered.length} message
                {filtered.length === 1 ? "" : "s"}
              </p>
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 px-0">
              {messagesQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : messagesQuery.isError ? (
                <div className="px-6 py-8 text-sm text-destructive">
                  {(messagesQuery.error as Error)?.message || "Could not load messages."}
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {messagesQuery.data?.length === 0
                    ? "No messages in INBOX yet, or IMAP could not connect."
                    : "No messages match your filter."}
                </div>
              ) : (
                <ScrollArea className="h-[440px] lg:h-[calc(100vh-22rem)] px-4">
                  <ul className="space-y-1 pb-4">
                    {filtered.map((m) => (
                      <li key={`${m.uid}-${m.messageId ?? ""}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedUid(m.uid)}
                          className={cn(
                            "w-full text-left rounded-lg border px-3 py-2 transition-colors",
                            selected?.uid === m.uid
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted/60",
                            m.isUnread && selected?.uid !== m.uid && "border-l-2 border-l-primary",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium line-clamp-1">{m.subject}</span>
                            {m.isUnread ? (
                              <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0">
                                Unread
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{m.from}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground/90 line-clamp-2 mt-1">{m.preview}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(m.date), "MMM d, yyyy HH:mm")}
                          </p>
                          {m.crmMatches.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {m.crmMatches.map((c) => (
                                <Badge key={c.id} variant="secondary" className="text-[10px] font-normal">
                                  CRM: {c.name}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 flex flex-col min-h-[320px]">
            <CardHeader className="py-4">
              <CardTitle className="text-base">Message</CardTitle>
              <CardDescription>HTML is shown in a sandboxed preview only.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
              {!selected ? (
                <p className="text-sm text-muted-foreground">Select a message to read.</p>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-semibold leading-snug">{selected.subject}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      From {selected.from} &lt;{selected.fromAddress}&gt;
                    </p>
                    {selected.to.length ? (
                      <p className="text-xs text-muted-foreground mt-0.5">To: {selected.to.join(", ")}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(selected.date), "PPpp")}
                    </p>
                    {selected.crmMatches.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selected.crmMatches.map((c) => (
                          <Button key={c.id} variant="outline" size="sm" asChild>
                            <Link href={`/admin/crm/${c.id}`}>
                              Open CRM · {c.name} ({c.type})
                            </Link>
                          </Button>
                        ))}
                      </div>
                    ) : null}
                    {selected.attachments.length > 0 ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        Attachments:{" "}
                        {selected.attachments.map((a) => `${a.filename} (${a.contentType})`).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex-1 min-h-[280px] flex flex-col rounded-md border bg-muted/20 overflow-hidden">
                    {selected.html ? (
                      <iframe
                        title="Email HTML preview"
                        className="w-full flex-1 min-h-[280px] bg-background"
                        sandbox=""
                        srcDoc={selected.html}
                      />
                    ) : selected.text ? (
                      <ScrollArea className="h-[280px] p-4">
                        <pre className="text-sm whitespace-pre-wrap font-sans">{selected.text}</pre>
                      </ScrollArea>
                    ) : (
                      <p className="p-4 text-sm text-muted-foreground">No body content.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
