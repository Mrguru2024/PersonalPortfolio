"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailHubContactDetailSheet } from "@/components/email-hub/EmailHubCrmContacts";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { formatLocaleDateTime } from "@/lib/localeDateTime";
import type { EmailHubDraft, EmailHubMessage } from "@shared/emailHubSchema";
import { useToast } from "@/hooks/use-toast";

export default function EmailHubScheduledPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [contactSheetId, setContactSheetId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: drafts = [], isLoading: ld } = useQuery({
    queryKey: ["/api/admin/email-hub/drafts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/drafts");
      if (!res.ok) throw new Error("drafts");
      return (await res.json()) as EmailHubDraft[];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: messages = [], isLoading: lm } = useQuery({
    queryKey: ["/api/admin/email-hub/messages", "queued"],
    queryFn: async () => {
      const [schedRes, pendRes] = await Promise.all([
        apiRequest("GET", "/api/admin/email-hub/messages?status=scheduled"),
        apiRequest("GET", "/api/admin/email-hub/messages?status=pending"),
      ]);
      const scheduled = (await schedRes.json()) as EmailHubMessage[];
      const pending = (await pendRes.json()) as EmailHubMessage[];
      const merged = [...scheduled, ...pending];
      const seen = new Set<number>();
      return merged.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const schedDrafts = drafts.filter((d) => d.status === "scheduled");

  const sendMessageNow = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest("POST", `/api/admin/email-hub/messages/${messageId}/send-now`);
    },
    onSuccess: async () => {
      toast({ title: "Sending", description: "Message was delivered now (or moved to failed if Brevo rejected it)." });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/messages"] });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/overview"] });
    },
    onError: (e: Error) => toast({ title: "Send now failed", description: e.message, variant: "destructive" }),
  });

  const sendDraftNow = useMutation({
    mutationFn: async (draftId: number) => {
      return apiRequest("POST", `/api/admin/email-hub/drafts/${draftId}/send-now`);
    },
    onSuccess: async () => {
      toast({ title: "Sent", description: "Draft was sent and removed from scheduled drafts." });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/drafts"] });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/messages"] });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/overview"] });
    },
    onError: (e: Error) => toast({ title: "Send now failed", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmailHubContactDetailSheet
        contactId={contactSheetId}
        open={contactSheetId != null}
        onOpenChange={(o) => {
          if (!o) setContactSheetId(null);
        }}
      />

      <h2 className="text-lg font-semibold">Scheduled</h2>
      {isSuper ?
        <p className="text-sm text-muted-foreground">
          Scheduled sends are processed by a server job:{" "}
          <code className="text-xs bg-muted px-1 rounded">GET /api/cron/email-hub-scheduled</code> with{" "}
          <code className="text-xs bg-muted px-1 rounded">Authorization: Bearer CRON_SECRET</code>.
        </p>
      : <p className="text-sm text-muted-foreground">Queued messages send automatically at the time you set.</p>}
      {ld || lm ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40">Queued messages</h3>
            {messages.length === 0 ?
              <p className="p-4 text-sm text-muted-foreground">None</p>
            : messages.map((m) => (
                <div key={m.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm items-center">
                  <div>
                    <p className="font-medium">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">{(m.toJson as string[]).join(", ")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {m.relatedContactId ?
                      <Button variant="outline" size="sm" onClick={() => setContactSheetId(m.relatedContactId!)}>
                        Contact
                      </Button>
                    : null}
                    <Badge variant="outline" className="font-normal">
                      {m.status}
                    </Badge>
                    <Badge variant="secondary">
                      {m.scheduledFor ? formatLocaleDateTime(m.scheduledFor, "full") : "—"}
                    </Badge>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={sendMessageNow.isPending}
                      onClick={() => sendMessageNow.mutate(m.id)}
                    >
                      Send now
                    </Button>
                  </div>
                </div>
              ))}
          </section>
          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40">Scheduled drafts (pending send)</h3>
            {schedDrafts.length === 0 ?
              <p className="p-4 text-sm text-muted-foreground">None</p>
            : schedDrafts.map((d) => (
                <div key={d.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm items-center">
                  <div>
                    <p className="font-medium">{d.subject}</p>
                    <p className="text-xs text-muted-foreground">{(d.toJson as string[]).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.relatedContactId ?
                      <Button variant="ghost" size="sm" onClick={() => setContactSheetId(d.relatedContactId!)}>
                        Contact
                      </Button>
                    : null}
                    <Link href={`/admin/email-hub/compose?draftId=${d.id}`} className="text-primary text-sm underline">
                      Edit
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={sendDraftNow.isPending}
                      onClick={() => sendDraftNow.mutate(d.id)}
                    >
                      Send now
                    </Button>
                  </div>
                </div>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}
