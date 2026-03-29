"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmailHubContactDetailSheet } from "@/components/email-hub/EmailHubCrmContacts";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLocaleDateTime } from "@/lib/localeDateTime";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EmailHubMessage } from "@shared/emailHubSchema";
import { useToast } from "@/hooks/use-toast";

export default function EmailHubSentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("msg");
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [contactSheetId, setContactSheetId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const retrySend = useMutation({
    mutationFn: async (messageId: number) => apiRequest("POST", `/api/admin/email-hub/messages/${messageId}/send-now`),
    onSuccess: async () => {
      toast({ title: "Retry sent", description: "Brevo accepted the send, or the row updated to failed again." });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/messages"] });
      await qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/overview"] });
    },
    onError: (e: Error) => toast({ title: "Retry failed", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (highlightId) setDrawerId(Number(highlightId));
  }, [highlightId]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/messages", "sent"],
    queryFn: async () => {
      const sentRes = await apiRequest("GET", "/api/admin/email-hub/messages?status=sent");
      const failedRes = await apiRequest("GET", "/api/admin/email-hub/messages?status=failed");
      const sent = (await sentRes.json()) as EmailHubMessage[];
      const failed = (await failedRes.json()) as EmailHubMessage[];
      return [...sent, ...failed].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: drawerData } = useQuery({
    queryKey: ["/api/admin/email-hub/messages", drawerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/email-hub/messages/${drawerId}`, { credentials: "include" });
      if (!res.ok) return null;
      return (await res.json()) as {
        message: EmailHubMessage;
        events: { id: number; eventType: string; recipientEmail: string; eventTimestamp: string }[];
      };
    },
    enabled: drawerId != null && !Number.isNaN(drawerId),
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sent & failed</h2>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground border rounded-2xl p-8 text-center bg-muted/20">No messages yet.</p>
      ) : (
        <div className="rounded-2xl border border-border/60 divide-y divide-border/50 overflow-hidden bg-card/80">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{m.subject}</p>
                <p className="text-xs text-muted-foreground truncate">{(m.toJson as string[]).join(", ")}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {m.sentAt ? formatLocaleDateTime(m.sentAt, "full") : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.status === "failed" ? "destructive" : "secondary"}>{m.status}</Badge>
                {m.relatedContactId ?
                  <Button variant="outline" size="sm" onClick={() => setContactSheetId(m.relatedContactId!)}>
                    Contact
                  </Button>
                : null}
                <Button variant="ghost" size="sm" onClick={() => setDrawerId(m.id)}>
                  Timeline
                </Button>
                {m.status === "failed" ?
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={retrySend.isPending}
                    onClick={() => retrySend.mutate(m.id)}
                  >
                    Send now
                  </Button>
                : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <EmailHubContactDetailSheet
        contactId={contactSheetId}
        open={contactSheetId != null}
        onOpenChange={(o) => {
          if (!o) setContactSheetId(null);
        }}
      />

      <Sheet open={drawerId != null} onOpenChange={(o) => !o && setDrawerId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Message activity</SheetTitle>
          </SheetHeader>
          {drawerData ?
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-muted-foreground">{drawerData.message.subject}</p>
              {drawerData.events.length === 0 ?
                <p className="text-muted-foreground">
                  {isSuper ?
                    "No provider events logged for this message yet."
                  : "No opens or clicks recorded for this message yet."}
                </p>
              : drawerData.events.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/50 p-2">
                    <Badge variant="outline" className="text-[10px]">
                      {e.eventType}
                    </Badge>
                    <p className="text-xs mt-1">{e.recipientEmail}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatLocaleDateTime(e.eventTimestamp, "monthDayTimeWithSeconds")}
                    </p>
                  </div>
                ))}
            </div>
          : <Loader2 className="h-6 w-6 animate-spin mt-6" />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
