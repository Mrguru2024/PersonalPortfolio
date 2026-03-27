"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function EmailHubSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [senderForm, setSenderForm] = useState({
    name: "",
    email: "",
    replyToEmail: "",
    signatureHtml: "",
    grantUserId: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/settings");
      if (!res.ok) throw new Error("settings");
      return (await res.json()) as {
        brevoApiConfigured: boolean;
        webhookSecretConfigured: boolean;
        defaultReplyTo: string;
        trackingDomain: string;
        isSuper: boolean;
      };
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createSender = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/email-hub/senders", {
        name: senderForm.name,
        email: senderForm.email,
        replyToEmail: senderForm.replyToEmail || null,
        signatureHtml: senderForm.signatureHtml || null,
        isVerified: true,
        grantUserId: senderForm.grantUserId ? Number(senderForm.grantUserId) : user?.id,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "Failed");
      return body;
    },
    onSuccess: () => {
      toast({ title: "Sender saved" });
      qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/senders"] });
      setSenderForm({ name: "", email: "", replyToEmail: "", signatureHtml: "", grantUserId: "" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>Brevo is configured server-side; transactional sends use your API key.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {isLoading || !settings ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : <ul className="space-y-1 text-muted-foreground">
              <li>Brevo API key: {settings.brevoApiConfigured ? "set" : "missing"}</li>
              <li>Webhook secret: {settings.webhookSecretConfigured ? "set" : "missing"}</li>
              <li>Default reply-to (env): {settings.defaultReplyTo || "—"}</li>
              <li>Tracking domain (placeholder): {settings.trackingDomain || "—"}</li>
            </ul>
          }
        </CardContent>
      </Card>

      {settings?.isSuper ?
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle>Add sender identity</CardTitle>
            <CardDescription>
              Must match a verified sender in Brevo. Optionally grant a founder user id access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label>Display name</Label>
              <Input value={senderForm.name} onChange={(e) => setSenderForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Email (verified in Brevo)</Label>
              <Input
                value={senderForm.email}
                onChange={(e) => setSenderForm((s) => ({ ...s, email: e.target.value }))}
                type="email"
              />
            </div>
            <div className="grid gap-2">
              <Label>Reply-to override (optional)</Label>
              <Input
                value={senderForm.replyToEmail}
                onChange={(e) => setSenderForm((s) => ({ ...s, replyToEmail: e.target.value }))}
                type="email"
              />
            </div>
            <div className="grid gap-2">
              <Label>Signature HTML (optional)</Label>
              <Input
                value={senderForm.signatureHtml}
                onChange={(e) => setSenderForm((s) => ({ ...s, signatureHtml: e.target.value }))}
                placeholder="<p>— Name</p>"
              />
            </div>
            <div className="grid gap-2">
              <Label>Grant access to user id (optional; defaults to you)</Label>
              <Input
                value={senderForm.grantUserId}
                onChange={(e) => setSenderForm((s) => ({ ...s, grantUserId: e.target.value }))}
                placeholder={String(user.id)}
              />
            </div>
            <Button onClick={() => createSender.mutate()} disabled={createSender.isPending || !senderForm.email}>
              {createSender.isPending ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : "Save sender"}
            </Button>
          </CardContent>
        </Card>
      : <p className="text-sm text-muted-foreground">Only super admins can add sender mappings.</p>}
    </div>
  );
}
