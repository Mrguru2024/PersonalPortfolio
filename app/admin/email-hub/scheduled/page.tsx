"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { EmailHubDraft, EmailHubMessage } from "@shared/emailHubSchema";

export default function EmailHubScheduledPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

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
    queryKey: ["/api/admin/email-hub/messages", "scheduled"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/messages?status=scheduled");
      if (!res.ok) throw new Error("messages");
      return (await res.json()) as EmailHubMessage[];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const schedDrafts = drafts.filter((d) => d.status === "scheduled");

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Scheduled</h2>
      <p className="text-sm text-muted-foreground">
        Cron: <code className="text-xs bg-muted px-1 rounded">GET /api/cron/email-hub-scheduled</code> with{" "}
        <code className="text-xs bg-muted px-1 rounded">Authorization: Bearer CRON_SECRET</code>.
      </p>
      {ld || lm ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40">Queued messages</h3>
            {messages.length === 0 ?
              <p className="p-4 text-sm text-muted-foreground">None</p>
            : messages.map((m) => (
                <div key={m.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm">
                  <div>
                    <p className="font-medium">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">{(m.toJson as string[]).join(", ")}</p>
                  </div>
                  <Badge variant="secondary">
                    {m.scheduledFor ? format(new Date(m.scheduledFor), "MMM d, yyyy HH:mm") : "—"}
                  </Badge>
                </div>
              ))}
          </section>
          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40">Scheduled drafts (pending send)</h3>
            {schedDrafts.length === 0 ?
              <p className="p-4 text-sm text-muted-foreground">None</p>
            : schedDrafts.map((d) => (
                <div key={d.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm">
                  <div>
                    <p className="font-medium">{d.subject}</p>
                    <p className="text-xs text-muted-foreground">{(d.toJson as string[]).join(", ")}</p>
                  </div>
                  <Link href={`/admin/email-hub/compose?draftId=${d.id}`} className="text-primary text-sm underline">
                    Edit
                  </Link>
                </div>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}
