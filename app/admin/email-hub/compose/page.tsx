"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Save, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailHubSender } from "@shared/emailHubSchema";

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EmailHubComposePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get("contactId");
  const draftIdParam = searchParams.get("draftId");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [senderId, setSenderId] = useState<string>("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p></p>");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: senders = [], isLoading: sendersLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/senders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/senders");
      return (await res.json()) as EmailHubSender[];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  useEffect(() => {
    if (senders.length && !senderId) {
      const def = senders.find((s) => s.isDefault) ?? senders[0];
      if (def) setSenderId(String(def.id));
    }
  }, [senders, senderId]);

  const { data: contact } = useQuery({
    queryKey: ["/api/admin/crm/contacts", contactIdParam],
    queryFn: async () => {
      const res = await fetch(`/api/admin/crm/contacts/${contactIdParam}`, { credentials: "include" });
      if (!res.ok) return null;
      return (await res.json()) as { id: number; email: string; name: string; company?: string | null };
    },
    enabled: !!contactIdParam && !!user?.isAdmin,
  });

  useEffect(() => {
    if (contact?.email) setTo(contact.email);
  }, [contact]);

  const { data: existingDraft } = useQuery({
    queryKey: ["/api/admin/email-hub/drafts", draftIdParam],
    queryFn: async () => {
      const res = await fetch(`/api/admin/email-hub/drafts/${draftIdParam}`, { credentials: "include" });
      if (!res.ok) return null;
      return (await res.json()) as {
        id: number;
        senderId: number;
        toJson: string[];
        ccJson: string[] | null;
        bccJson: string[] | null;
        subject: string;
        htmlBody: string;
        scheduledFor: string | null;
        relatedContactId: number | null;
      };
    },
    enabled: !!draftIdParam && !!user?.isAdmin,
  });

  useEffect(() => {
    if (!existingDraft) return;
    setSenderId(String(existingDraft.senderId));
    setTo(existingDraft.toJson.join(", "));
    setCc((existingDraft.ccJson ?? []).join(", "));
    setBcc((existingDraft.bccJson ?? []).join(", "));
    setSubject(existingDraft.subject);
    setHtml(existingDraft.htmlBody || "<p></p>");
    if (existingDraft.scheduledFor) {
      const d = new Date(existingDraft.scheduledFor);
      if (!Number.isNaN(d.getTime())) setScheduledAt(d.toISOString().slice(0, 16));
    }
  }, [existingDraft]);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/email-hub/drafts", {
        id: draftIdParam ? Number(draftIdParam) : undefined,
        senderId: Number(senderId),
        to: parseEmails(to),
        cc: cc.trim() ? parseEmails(cc) : [],
        bcc: bcc.trim() ? parseEmails(bcc) : [],
        subject,
        htmlBody: html,
        scheduledFor: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: scheduledAt ? "scheduled" : "draft",
        relatedContactId:
          contactIdParam ? Number(contactIdParam) : existingDraft?.relatedContactId ?? null,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Draft saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-hub/drafts"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/email-hub/send", {
        draftId: draftIdParam ? Number(draftIdParam) : undefined,
        senderId: Number(senderId),
        to: parseEmails(to),
        cc: cc.trim() ? parseEmails(cc) : undefined,
        bcc: bcc.trim() ? parseEmails(bcc) : undefined,
        subject,
        htmlBody: html,
        relatedContactId:
          contactIdParam ? Number(contactIdParam) : existingDraft?.relatedContactId ?? null,
        scheduledFor: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "Send failed");
      return body;
    },
    onSuccess: (data: { scheduled?: boolean }) => {
      toast({
        title: data.scheduled ? "Scheduled" : "Sent",
        description: data.scheduled ? "Message is queued for sending." : "Message sent via Brevo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-hub/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-hub/messages"] });
      if (!data.scheduled) router.push("/admin/email-hub/sent");
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
    <Card className="rounded-2xl border-border/60 shadow-lg overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-xl">Compose</CardTitle>
        <CardDescription>
          Merge tags: {"{{firstName}}"}, {"{{company}}"}, {"{{companyName}}"}, {"{{offerName}}"}, {"{{bookingLink}}"},{" "}
          {"{{founderName}}"}, {"{{founderSignature}}"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {sendersLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : senders.length === 0 ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            No sender identities available. A super admin must add senders under Email Hub → Settings.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={senderId} onValueChange={setSenderId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Sender" />
              </SelectTrigger>
              <SelectContent>
                {senders.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} &lt;{s.email}&gt;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sched">Schedule (optional)</Label>
            <Input
              id="sched"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cc">Cc</Label>
            <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcc">Bcc</Label>
            <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub">Subject</Label>
          <Input id="sub" value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Body</Label>
          <div className="rounded-xl border border-border overflow-hidden min-h-[280px] bg-background">
            <RichTextEditor content={html} onChange={setHtml} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!senderId || !to.trim() || !subject.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ?
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Send className="h-4 w-4 mr-2" />}
            {scheduledAt ? "Schedule send" : "Send now"}
          </Button>
          <Button variant="secondary" onClick={() => saveDraftMutation.mutate()} disabled={!senderId || saveDraftMutation.isPending}>
            {saveDraftMutation.isPending ?
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Save className="h-4 w-4 mr-2" />}
            Save draft
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/email-hub/templates">
              <CalendarClock className="h-4 w-4 mr-2" />
              Templates
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
