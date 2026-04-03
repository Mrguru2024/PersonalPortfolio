"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { SystemEmailStatus } from "@shared/systemEmailTypes";

/**
 * Admin settings: IONOS system mailbox (SMTP/IMAP). Credentials stay server-side.
 */
export function AdminIonosEmailSettingsCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [futureNotify, setFutureNotify] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["/api/admin/system-email/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-email/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load IONOS status");
      return res.json() as Promise<SystemEmailStatus>;
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/system-email/test-send", {});
      return res.json() as Promise<{ ok: boolean; error?: string; to?: string }>;
    },
    onSuccess: (data) => {
      if (data.ok) toast({ title: "Test email queued", description: `Check ${data.to ?? "mailbox"}.` });
      else toast({ title: "Failed", description: data.error, variant: "destructive" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/admin/system-email"] }),
  });

  const s = statusQuery.data;

  return (
    <Card className="mb-6 border-muted">
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-5 w-5" />
          System email (IONOS)
        </CardTitle>
        <CardDescription>
          SMTP/IMAP using IONOS — separate from Brevo. Env: <code className="text-xs">IONOS_EMAIL</code>,{" "}
          <code className="text-xs">IONOS_PASSWORD</code>, optional host/port overrides. Passwords are never shown here.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4 space-y-4">
        {statusQuery.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : statusQuery.isError ? (
          <p className="text-sm text-destructive">Could not load status.</p>
        ) : s ? (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={s.smtpConfigured ? "default" : "destructive"}>
              {s.smtpConfigured ? "Credentials present" : "Missing IONOS env"}
            </Badge>
            {s.senderEmail ? (
              <Badge variant="outline" className="font-normal text-xs">
                Sender: {s.senderName} · {s.senderEmail}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="font-normal text-xs">
              {s.smtpHost}:{s.smtpPort} · IMAP {s.imapHost}:{s.imapPort}
            </Badge>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/system-email">Open system inbox</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!s?.smtpConfigured || testMutation.isPending}
            onClick={() => testMutation.mutate()}
          >
            {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Send test email
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border border-dashed border-border/80 px-3 py-2">
          <div>
            <Label className="text-sm">Future: route notifications via IONOS</Label>
            <p className="text-[11px] text-muted-foreground">Placeholder — not wired to jobs yet.</p>
          </div>
          <Switch checked={futureNotify} onCheckedChange={setFutureNotify} disabled />
        </div>
      </CardContent>
    </Card>
  );
}
