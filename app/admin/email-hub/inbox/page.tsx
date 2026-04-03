"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Mail, Trash2, Send, Building2, Archive, ArchiveRestore, Search } from "lucide-react";
import { formatLocaleDateTime } from "@/lib/localeDateTime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EmailHubInboxMessage, EmailHubInboxThread, EmailHubMailboxAccount } from "@shared/emailHubSchema";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type AccountRow = Omit<EmailHubMailboxAccount, "encryptedRefreshToken">;

type InboxStatsResponse = {
  messageCount: number;
  approxBodyBytes: number;
  approxUsagePercent: number;
  limits: {
    syncMaxThreads: number;
    maxHtmlCharsPerMessage: number;
    retentionDaysNonArchived: number;
    estimatedCapBytesPerMailbox: number;
    archivedExemptFromRetention: boolean;
  };
};

export default function EmailHubInboxPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [selectedMailboxId, setSelectedMailboxId] = useState<number | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [replyHtml, setReplyHtml] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [folder, setFolder] = useState<"inbox" | "archived" | "all">("inbox");
  const [fromFilter, setFromFilter] = useState("");
  const debouncedFrom = useDebouncedValue(fromFilter, 350);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    const err = searchParams.get("mailbox_error");
    const ok = searchParams.get("mailbox_connected");
    if (err) {
      console.warn("Mailbox connect error:", err);
      router.replace("/admin/email-hub/inbox");
    }
    if (ok) {
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/mailbox/accounts"] });
      router.replace("/admin/email-hub/inbox");
    }
  }, [searchParams, router, qc]);

  const { data: accountsData } = useQuery({
    queryKey: ["/api/admin/email-hub/mailbox/accounts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-hub/mailbox/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load accounts");
      return (await res.json()) as { accounts: AccountRow[] };
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const accounts = accountsData?.accounts ?? [];

  useEffect(() => {
    if (selectedMailboxId != null) return;
    if (accounts.length === 1) setSelectedMailboxId(accounts[0]!.id);
  }, [accounts, selectedMailboxId]);

  const { data: statsData } = useQuery({
    queryKey: ["/api/admin/email-hub/inbox/stats", selectedMailboxId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/email-hub/inbox/stats?mailboxId=${selectedMailboxId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load stats");
      return (await res.json()) as InboxStatsResponse;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && selectedMailboxId != null,
  });

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: [
      "/api/admin/email-hub/inbox/threads",
      selectedMailboxId,
      debouncedSearch,
      unreadOnly,
      folder,
      debouncedFrom,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ mailboxId: String(selectedMailboxId) });
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      if (unreadOnly) params.set("unreadOnly", "1");
      if (folder === "archived") params.set("archived", "only");
      else if (folder === "all") params.set("archived", "all");
      if (debouncedFrom.trim()) params.set("from", debouncedFrom.trim());
      const res = await fetch(`/api/admin/email-hub/inbox/threads?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load threads");
      return (await res.json()) as { threads: EmailHubInboxThread[] };
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && selectedMailboxId != null,
  });

  const { data: threadDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/inbox/thread-detail", selectedMailboxId, selectedThreadId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/email-hub/inbox/threads/${selectedThreadId}?mailboxId=${selectedMailboxId}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load thread");
      return (await res.json()) as { thread: EmailHubInboxThread; messages: EmailHubInboxMessage[] };
    },
    enabled:
      !!user?.isAdmin && !!user?.adminApproved && selectedMailboxId != null && selectedThreadId != null,
  });

  const syncMutation = useMutation({
    mutationFn: async (mailboxAccountId: number) => {
      const res = await fetch("/api/admin/email-hub/inbox/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxAccountId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || "Sync failed");
      }
    },
    onSuccess: (_void, mailboxAccountId) => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/inbox/threads", mailboxAccountId] });
      void qc.invalidateQueries({
        queryKey: ["/api/admin/email-hub/inbox/thread-detail", mailboxAccountId, selectedThreadId],
      });
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/inbox/stats", mailboxAccountId] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/email-hub/mailbox/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Disconnect failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/mailbox/accounts"] });
      setSelectedMailboxId(null);
      setSelectedThreadId(null);
    },
  });

  const threadReadMutation = useMutation({
    mutationFn: async (payload: { threadId: number; read: boolean }) => {
      const res = await fetch(`/api/admin/email-hub/inbox/threads/${payload.threadId}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: selectedMailboxId, read: payload.read }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || "Update failed");
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/inbox/threads", selectedMailboxId] });
      void qc.invalidateQueries({
        queryKey: ["/api/admin/email-hub/inbox/thread-detail", selectedMailboxId, selectedThreadId],
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (payload: { threadId: number; archived: boolean }) => {
      if (selectedMailboxId == null) throw new Error("No mailbox");
      const res = await fetch(`/api/admin/email-hub/inbox/threads/${payload.threadId}/archive`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId: selectedMailboxId, archived: payload.archived }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || "Archive failed");
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/inbox/threads", selectedMailboxId] });
      void qc.invalidateQueries({
        queryKey: ["/api/admin/email-hub/inbox/thread-detail", selectedMailboxId, selectedThreadId],
      });
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/inbox/stats", selectedMailboxId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (selectedMailboxId == null || selectedThreadId == null) throw new Error("Select a thread");
      const res = await fetch("/api/admin/email-hub/inbox/reply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxAccountId: selectedMailboxId,
          threadId: selectedThreadId,
          htmlBody: replyHtml,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message || "Reply failed");
      }
    },
    onSuccess: () => {
      setReplyHtml("");
      void syncMutation.mutateAsync(selectedMailboxId!);
    },
  });

  const activeMailbox = useMemo(
    () => accounts.find((a) => a.id === selectedMailboxId) ?? null,
    [accounts, selectedMailboxId],
  );

  const onSelectThread = useCallback((id: number) => {
    setSelectedThreadId(id);
    setReplyHtml("");
  }, []);

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Connected mailboxes
          </CardTitle>
          <CardDescription>
            {isSuper ?
              "OAuth is separate from Google Calendar. Gmail and Microsoft each need their own sign-in app setup."
            : "Connecting Gmail or Microsoft here is separate from Calendar. If connect fails, ask your admin to finish mailbox setup."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/admin/email-hub/mailbox/gmail/start">Connect Gmail</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/admin/email-hub/mailbox/microsoft/start">Connect Microsoft</a>
          </Button>
          {accounts.length > 0 ?
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active</span>
              <select
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                value={selectedMailboxId ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setSelectedMailboxId(v);
                  setSelectedThreadId(null);
                  setSearchInput("");
                  setFromFilter("");
                  setUnreadOnly(false);
                  setFolder("inbox");
                }}
              >
                <option value="">Select mailbox…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.provider} — {a.emailAddress}
                  </option>
                ))}
              </select>
            </label>
          : null}
          {selectedMailboxId != null ?
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={syncMutation.isPending}
                onClick={() => void syncMutation.mutate(selectedMailboxId)}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", syncMutation.isPending && "animate-spin")} />
                Sync now
              </Button>
              {activeMailbox ?
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={disconnectMutation.isPending}
                  onClick={() => {
                    if (confirm(`Disconnect ${activeMailbox.emailAddress}?`)) {
                      void disconnectMutation.mutate(activeMailbox.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              : null}
            </>
          : null}
        </CardContent>
      </Card>

      {selectedMailboxId == null ?
        <p className="text-sm text-muted-foreground">
          Connect a mailbox, then pick it from the list to load inbox threads.
        </p>
      : <div className="space-y-4">
          {statsData?.limits ?
            <Card className="rounded-2xl border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Storage & retention</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Synced copy is capped per message (~{(statsData.limits.maxHtmlCharsPerMessage / 1024).toFixed(0)} KB
                  HTML), up to {statsData.limits.syncMaxThreads} threads per sync. Non-archived messages older than{" "}
                  {statsData.limits.retentionDaysNonArchived} days are removed automatically
                  {isSuper ? " (daily scheduled job)" : " overnight"}; <strong>archived</strong> threads stay in the hub
                  until you disconnect the mailbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    ~{(statsData.approxBodyBytes / (1024 * 1024)).toFixed(1)} MB stored ({statsData.messageCount}{" "}
                    messages)
                  </span>
                  <span>
                    Guidance ~{(statsData.limits.estimatedCapBytesPerMailbox / (1024 * 1024)).toFixed(0)} MB per mailbox
                  </span>
                </div>
                <Progress value={statsData.approxUsagePercent} className="h-2" />
              </CardContent>
            </Card>
          : null}
          <div className="grid gap-4 lg:grid-cols-5 min-h-[420px]">
          <Card className="rounded-2xl border-border/60 lg:col-span-2 flex flex-col max-h-[70vh]">
            <CardHeader className="pb-2 space-y-3">
              <div>
                <CardTitle className="text-sm font-medium">Threads</CardTitle>
                {activeMailbox ?
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Building2 className="h-3 w-3" />
                    {activeMailbox.emailAddress}
                  </CardDescription>
                : null}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subject or preview…"
                    className="pl-8 h-9 text-sm"
                    value={searchInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Participant email contains…"
                  className="h-9 text-sm"
                  value={fromFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromFilter(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unreadOnly}
                      onChange={(e) => setUnreadOnly(e.target.checked)}
                      className="rounded border-border"
                    />
                    Unread only
                  </label>
                  <span className="text-muted-foreground">|</span>
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value as "inbox" | "archived" | "all")}
                  >
                    <option value="inbox">Inbox (active)</option>
                    <option value="archived">Archived</option>
                    <option value="all">All threads</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-1 space-y-1">
              {threadsLoading ?
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto my-8" />
              : (threadsData?.threads.length ?? 0) === 0 ?
                <p className="text-sm text-muted-foreground py-6 text-center">No threads yet — try Sync now.</p>
              : (threadsData?.threads ?? []).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectThread(t.id)}
                    className={cn(
                      "w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors",
                      selectedThreadId === t.id ?
                        "border-primary bg-primary/10"
                      : "border-border/60 hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium line-clamp-2">{t.subject ?? "(no subject)"}</span>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {t.isArchived ?
                          <Badge variant="outline" className="text-[10px]">
                            Archived
                          </Badge>
                        : null}
                        {!t.isRead ?
                          <Badge variant="secondary" className="text-[10px]">
                            Unread
                          </Badge>
                        : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.snippet}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t.lastMessageAt ? formatLocaleDateTime(t.lastMessageAt, "monthDayTime", "") : ""}
                    </p>
                  </button>
                ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 lg:col-span-3 flex flex-col max-h-[70vh]">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <CardTitle className="text-sm font-medium">Conversation</CardTitle>
                {selectedThreadId != null && threadDetail?.thread ?
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={threadReadMutation.isPending}
                      onClick={() =>
                        void threadReadMutation.mutateAsync({
                          threadId: selectedThreadId,
                          read: !threadDetail.thread.isRead,
                        })
                      }
                    >
                      Mark {threadDetail.thread.isRead ? "unread" : "read"}
                    </Button>
                  </div>
                : null}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {selectedThreadId == null ?
                <p className="text-sm text-muted-foreground">Select a thread.</p>
              : detailLoading ?
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto my-8" />
              : !threadDetail ?
                <p className="text-sm text-muted-foreground">Could not load thread.</p>
              : <>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 border rounded-xl border-border/50 p-3 bg-muted/20">
                    {threadDetail.messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-lg border border-border/40 bg-card/80 p-3 text-sm",
                          !m.isRead && "ring-1 ring-primary/30",
                        )}
                      >
                        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            <span className="font-medium text-foreground">{m.fromName || m.fromEmail || "—"}</span>
                            {m.fromEmail ? ` <${m.fromEmail}>` : null}
                          </span>
                          <span>{m.internalDate ? formatLocaleDateTime(m.internalDate, "full", "") : ""}</span>
                        </div>
                        {m.htmlBody ?
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none mt-2 [&_a]:text-primary break-words"
                            // eslint-disable-next-line react/no-danger -- trusted admin-only mailbox HTML
                            dangerouslySetInnerHTML={{ __html: m.htmlBody }}
                          />
                        : <p className="mt-2 whitespace-pre-wrap">{m.snippet}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="shrink-0 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Reply (HTML)</p>
                    <Textarea
                      value={replyHtml}
                      onChange={(e) => setReplyHtml(e.target.value)}
                      placeholder="<p>Your reply…</p>"
                      className="min-h-[100px] font-mono text-xs"
                    />
                    <Button disabled={replyMutation.isPending || !replyHtml.trim()} onClick={() => void replyMutation.mutate()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send reply
                    </Button>
                  </div>
                </>
              }
            </CardContent>
          </Card>
        </div>
        </div>
      }
    </div>
  );
}
