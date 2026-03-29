"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, Users, Share2, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function EmailHubSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [senderForm, setSenderForm] = useState({
    name: "",
    email: "",
    replyToEmail: "",
    signatureHtml: "",
    shareWithEmailOrUsername: "",
    orgWide: false,
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
      return apiRequest("POST", "/api/admin/email-hub/senders", {
        name: senderForm.name,
        email: senderForm.email,
        replyToEmail: senderForm.replyToEmail.trim() || null,
        signatureHtml: senderForm.signatureHtml.trim() || null,
        isVerified: true,
        isDefault: isSuper && senderForm.orgWide,
        ...(isSuper && senderForm.shareWithEmailOrUsername.trim() ?
          { grantEmailOrUsername: senderForm.shareWithEmailOrUsername.trim() }
        : {}),
      }).then((r) => r.json());
    },
    onSuccess: () => {
      toast({ title: "Sender saved" });
      qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/senders"] });
      setSenderForm({
        name: "",
        email: "",
        replyToEmail: "",
        signatureHtml: "",
        shareWithEmailOrUsername: "",
        orgWide: false,
      });
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
          <CardDescription>
            {isSuper ?
              "Brevo is configured on the server; sending uses your organization’s API credentials."
            : "Your organization’s email provider connection is managed on the server."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {isLoading || !settings ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : <ul className="space-y-1 text-muted-foreground">
              <li>
                {isSuper ? "Brevo API key" : "Email delivery"}: {settings.brevoApiConfigured ? "ready" : "not configured"}
              </li>
              <li>
                {isSuper ? "Inbound event secret (webhooks)" : "Open/click event capture"}:{" "}
                {settings.webhookSecretConfigured ? "ready" : "not configured"}
              </li>
              {isSuper ?
                <>
                  <li>Default reply-to (hosting env): {settings.defaultReplyTo || "—"}</li>
                  <li>Tracking domain (env): {settings.trackingDomain || "—"}</li>
                </>
              : settings.defaultReplyTo || settings.trackingDomain ?
                <li>
                  Organization defaults: reply-to {settings.defaultReplyTo || "—"}
                  {settings.trackingDomain ? ` · tracking ${settings.trackingDomain}` : ""}
                </li>
              : null}
            </ul>
          }
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            CRM, integrations & team tools
          </CardTitle>
          <CardDescription>
            Shared across all approved admins—same pipeline, same contacts—while each person keeps their own Email Hub
            preferences (for example tracking defaults under Tracking).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Button variant="outline" className="w-full sm:w-fit rounded-xl justify-start gap-2" asChild>
            <Link href="/admin/crm">
              <Users className="h-4 w-4 shrink-0" />
              CRM — contacts, deals, sequences
            </Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-fit rounded-xl justify-start gap-2" asChild>
            <Link href="/admin/integrations">
              <Share2 className="h-4 w-4 shrink-0" />
              Integrations — social posting, mailboxes, third-party apps
            </Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-fit rounded-xl justify-start" asChild>
            <Link href="/admin/communications">Communications — broadcast campaigns & designs</Link>
          </Button>
          <p className="text-xs text-muted-foreground pt-1">
            Use <Link href="/admin/email-hub/contacts" className="text-primary underline-offset-2 hover:underline">Email Hub → Contacts</Link>{" "}
            to jump straight into CRM picks for merge tags; personal Gmail/Microsoft inbox sync is under{" "}
            <Link href="/admin/email-hub/inbox" className="text-primary underline-offset-2 hover:underline">Inbox</Link>.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60">
        <CardHeader>
          <CardTitle>Add sender identity</CardTitle>
          <CardDescription>
            The address must already be verified in Brevo. After saving, you can select it in Compose immediately.{" "}
            {!isSuper ?
              "By default only you can use this sender; a super admin can make it org-wide or grant another admin’s account."
            : "Use the options below if this address should be available to other admins, not just you."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="eh-name">From name</Label>
            <Input
              id="eh-name"
              className="rounded-xl"
              value={senderForm.name}
              onChange={(e) => setSenderForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eh-email">From email</Label>
            <Input
              id="eh-email"
              className="rounded-xl"
              value={senderForm.email}
              onChange={(e) => setSenderForm((s) => ({ ...s, email: e.target.value }))}
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eh-reply">Reply-to</Label>
            <Input
              id="eh-reply"
              className="rounded-xl"
              value={senderForm.replyToEmail}
              onChange={(e) => setSenderForm((s) => ({ ...s, replyToEmail: e.target.value }))}
              type="email"
              placeholder="Uses from-email if empty"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eh-sig">Signature</Label>
            <Textarea
              id="eh-sig"
              className="rounded-xl min-h-[88px] font-mono text-xs md:text-sm"
              value={senderForm.signatureHtml}
              onChange={(e) => setSenderForm((s) => ({ ...s, signatureHtml: e.target.value }))}
              placeholder={'Example: <p>Thanks,<br />Alex</p>'}
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">Appended to the bottom of outgoing HTML.</p>
          </div>
          {isSuper ? (
            <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label htmlFor="eh-org-wide" className="text-sm font-medium">
                    All admins can use this sender
                  </Label>
                  <p id="eh-org-wide-hint" className="text-xs text-muted-foreground leading-snug">
                    Lets every approved admin pick this address in Email Hub.
                  </p>
                </div>
                <Switch
                  id="eh-org-wide"
                  checked={senderForm.orgWide}
                  onCheckedChange={(on) => setSenderForm((s) => ({ ...s, orgWide: on }))}
                  aria-describedby="eh-org-wide-hint"
                />
              </div>
              <div className="grid gap-2 max-w-md">
                <Label htmlFor="eh-share-person" className="text-sm">
                  Also share with admin (email or username)
                </Label>
                <Input
                  id="eh-share-person"
                  className="rounded-xl"
                  value={senderForm.shareWithEmailOrUsername}
                  onChange={(e) => setSenderForm((s) => ({ ...s, shareWithEmailOrUsername: e.target.value }))}
                  placeholder="e.g. alex@company.com or alex.admin"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  You always keep access. Must match an existing <span className="font-medium">approved admin</span> account
                  (same email or username they use to sign in).
                </p>
              </div>
            </div>
          ) : null}
          <Button
            className="rounded-xl"
            onClick={() => createSender.mutate()}
            disabled={createSender.isPending || !senderForm.email.trim()}
          >
            {createSender.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Save sender"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
