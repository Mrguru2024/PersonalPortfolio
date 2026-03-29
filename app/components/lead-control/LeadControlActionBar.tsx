"use client";

import { useState } from "react";
import type { LeadControlFollowUpPreset } from "@shared/leadControlFollowUp";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Mail,
  Voicemail,
  MessageSquare,
  Video,
  ClipboardCopy,
  StickyNote,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";

export interface LeadControlActionBarProps {
  contactId: number;
  phone?: string | null;
  email?: string | null;
}

export function LeadControlActionBar({ contactId, phone, email }: LeadControlActionBarProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  /** After a call/voicemail log, surface one-tap next steps without leaving the page. */
  const [fastCue, setFastCue] = useState<null | "post_call">(null);

  const act = useMutation({
    mutationFn: async (payload: { action: string; note?: string | null }) => {
      const res = await apiRequest("POST", `/api/admin/lead-control/contacts/${contactId}/actions`, payload);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "timeline"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-control/summary"] });
      toast({ title: "Logged to timeline" });
      setNote("");
      if (variables.action === "call_attempt" || variables.action === "voicemail") {
        setFastCue("post_call");
      } else {
        setFastCue(null);
      }
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const followUp = useMutation({
    mutationFn: async (preset: LeadControlFollowUpPreset) => {
      const res = await apiRequest("POST", `/api/admin/lead-control/contacts/${contactId}/follow-up-task`, {
        preset,
        note: note.trim() || null,
      });
      return res.json() as Promise<{ ok: boolean }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/tasks", contactId] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "timeline"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-control/summary"] });
      toast({ title: "CRM follow-up task created" });
      setNote("");
      setFastCue(null);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `Copied ${label}` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <Card className="border-teal-500/25 bg-gradient-to-br from-teal-500/[0.06] to-background" data-tour="lead-control-actions">
      <CardHeader className="pb-2 flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            Lead Control — actions
            <AdminHelpTip
              content="These buttons **log attempts on the timeline** (not a phone system). They extend **CRM** and the same Ascendra OS stack as funnel, campaigns, booking, and analytics — no parallel lead system. Use Call to open your device dialer, then log outcome. Future providers can plug in behind the same actions."
              ariaLabel="Help: Lead Control actions"
            />
          </CardTitle>
          <CardDescription>
            Record touches for speed-to-lead and follow-up discipline — see the **Activity** tab for the full timeline.
            Quick follow-ups create real **CRM tasks** (same API as the Tasks panel).
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/leads/settings">Routing rules</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/email-hub/compose?contactId=${contactId}`}>Email Hub</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fastCue === "post_call" ? (
          <div className="rounded-md border border-teal-500/35 bg-teal-500/[0.07] px-3 py-2.5 space-y-2">
            <p className="text-xs font-medium text-foreground">Fast workflow — what&apos;s next?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={followUp.isPending}
                onClick={() => followUp.mutate("tomorrow")}
              >
                Schedule follow-up (tomorrow)
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/admin/email-hub/compose?contactId=${contactId}`}>Compose email</Link>
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setFastCue(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Quick follow-up
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={followUp.isPending}
            onClick={() => followUp.mutate("tomorrow")}
          >
            {followUp.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Tomorrow
          </Button>
          <Button variant="secondary" size="sm" disabled={followUp.isPending} onClick={() => followUp.mutate("two_days")}>
            2 days
          </Button>
          <Button variant="secondary" size="sm" disabled={followUp.isPending} onClick={() => followUp.mutate("one_week")}>
            1 week
          </Button>
          <AdminHelpTip
            content="Creates a **crm_tasks** follow-up with due date at **9:00** local server time. Optional note above is copied into the task description."
            ariaLabel="Help: quick follow-up"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {phone ? (
            <>
              <Button variant="default" size="sm" asChild className="gap-1">
                <a href={`tel:${phone.trim().replace(/\s+/g, "")}`}>
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                disabled={act.isPending}
                onClick={() => act.mutate({ action: "call_attempt", note: note.trim() || null })}
              >
                {act.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                Log call attempt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={act.isPending}
                onClick={() => act.mutate({ action: "voicemail", note: note.trim() || null })}
              >
                <Voicemail className="h-4 w-4" />
                Voicemail left
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => copy("phone", phone)}>
                <ClipboardCopy className="h-4 w-4" />
                Copy phone
              </Button>
            </>
          ) : null}
          {email ? (
            <>
              <Button variant="outline" size="sm" asChild className="gap-1">
                <a href={`mailto:${email}`}>
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={act.isPending}
                onClick={() => act.mutate({ action: "email_sent", note: note.trim() || null })}
              >
                <Mail className="h-4 w-4" />
                Log email sent
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => copy("email", email)}>
                <ClipboardCopy className="h-4 w-4" />
                Copy email
              </Button>
            </>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={act.isPending}
            onClick={() => act.mutate({ action: "sms_sent", note: note.trim() || null })}
          >
            <MessageSquare className="h-4 w-4" />
            Log text sent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={act.isPending}
            onClick={() => act.mutate({ action: "meeting_started", note: note.trim() || null })}
          >
            <Video className="h-4 w-4" />
            Log meeting
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={act.isPending}
            onClick={() => act.mutate({ action: "log_touch", note: note.trim() || null })}
          >
            <StickyNote className="h-4 w-4" />
            Log touch
          </Button>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`lc-note-${contactId}`}>
            Optional note (included with the next log action you click)
          </label>
          <Textarea
            id={`lc-note-${contactId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Left VM — asked for budget range"
            className="text-sm resize-y min-h-[60px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
