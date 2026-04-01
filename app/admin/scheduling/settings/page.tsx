"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminSchedulingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [desc, setDesc] = useState("");
  const [aiParseResult, setAiParseResult] = useState<string | null>(null);
  const [aiScope, setAiScope] = useState<string>("global");
  const [bookingTypes, setBookingTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [aiApplyBusy, setAiApplyBusy] = useState(false);
  const [form, setForm] = useState({
    businessTimezone: "America/New_York",
    slotStepMinutes: 30,
    minNoticeHours: 2,
    maxDaysAhead: 45,
    publicBookingEnabled: true,
    aiAssistantEnabled: true,
    confirmationEmailSubject: "",
    confirmationEmailHtml: "",
    reminderEmailSubject: "",
    reminderEmailHtml: "",
    reminderOffsets: "1440,60",
    cancellationPolicyHtml: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/scheduling/settings", { credentials: "include" });
        const j = await res.json();
        const s = j.settings;
        const tr = await fetch("/api/admin/scheduling/booking-types", { credentials: "include" });
        const tj = await tr.json().catch(() => ({}));
        setBookingTypes((tj.types ?? []).map((x: { id: number; name: string }) => ({ id: x.id, name: x.name })));
        if (s) {
          setForm({
            businessTimezone: s.businessTimezone || "America/New_York",
            slotStepMinutes: s.slotStepMinutes ?? 30,
            minNoticeHours: s.minNoticeHours ?? 2,
            maxDaysAhead: s.maxDaysAhead ?? 45,
            publicBookingEnabled: !!s.publicBookingEnabled,
            aiAssistantEnabled: !!s.aiAssistantEnabled,
            confirmationEmailSubject: s.confirmationEmailSubject || "",
            confirmationEmailHtml: s.confirmationEmailHtml || "",
            reminderEmailSubject: s.reminderEmailSubject || "",
            reminderEmailHtml: s.reminderEmailHtml || "",
            reminderOffsets: Array.isArray(s.reminderOffsetsMinutes) ? s.reminderOffsetsMinutes.join(",") : "1440,60",
            cancellationPolicyHtml: s.cancellationPolicyHtml || "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const offsets = form.reminderOffsets
        .split(",")
        .map((x) => parseInt(x.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      await fetch("/api/admin/scheduling/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessTimezone: form.businessTimezone,
          slotStepMinutes: form.slotStepMinutes,
          minNoticeHours: form.minNoticeHours,
          maxDaysAhead: form.maxDaysAhead,
          publicBookingEnabled: form.publicBookingEnabled,
          aiAssistantEnabled: form.aiAssistantEnabled,
          confirmationEmailSubject: form.confirmationEmailSubject || null,
          confirmationEmailHtml: form.confirmationEmailHtml || null,
          reminderEmailSubject: form.reminderEmailSubject || null,
          reminderEmailHtml: form.reminderEmailHtml || null,
          reminderOffsetsMinutes: offsets.length ? offsets : [1440, 60],
          cancellationPolicyHtml: form.cancellationPolicyHtml || null,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function parseAi() {
    setAiParseResult(null);
    const res = await fetch("/api/admin/scheduling/ai/parse-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ description: desc }),
    });
    const j = await res.json();
    setAiParseResult(JSON.stringify(j, null, 2));
  }

  async function parseAiAndSave() {
    setAiApplyBusy(true);
    setAiParseResult(null);
    try {
      const bookingTypeId = aiScope === "global" ? null : parseInt(aiScope, 10);
      const res = await fetch("/api/admin/scheduling/availability/apply-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description: desc, bookingTypeId }),
      });
      const j = await res.json().catch(() => ({}));
      setAiParseResult(JSON.stringify(j, null, 2));
    } finally {
      setAiApplyBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Scheduling settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Template vars: {"{{guest_name}}"}, {"{{booking_type}}"}, {"{{start_display}}"}, {"{{manage_url}}"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/scheduling">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Availability assistant</CardTitle>
          <CardDescription>
            Describe your usual hours in plain language to preview parsed rules, or apply them to replace rules for the
            scope you choose. To edit in a grid, use{" "}
            <Link href="/admin/scheduling/availability" className="text-primary underline-offset-4 hover:underline">
              Availability
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="e.g. Mon–Fri 10am–4pm ET, closed weekends" />
          <div className="space-y-2 max-w-md">
            <Label>Save rules for</Label>
            <Select value={aiScope} onValueChange={setAiScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">All meeting types</SelectItem>
                {bookingTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={parseAi}>
              Preview parsed hours
            </Button>
            <Button type="button" onClick={parseAiAndSave} disabled={aiApplyBusy || !desc.trim()}>
              {aiApplyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as availability rules"}
            </Button>
          </div>
          {aiParseResult ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Technical preview (optional)</summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48">{aiParseResult}</pre>
            </details>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Business time zone</Label>
            <Input value={form.businessTimezone} onChange={(e) => setForm({ ...form, businessTimezone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slot step (minutes)</Label>
              <Input
                type="number"
                value={form.slotStepMinutes}
                onChange={(e) => setForm({ ...form, slotStepMinutes: parseInt(e.target.value, 10) || 30 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Min notice (hours)</Label>
              <Input
                type="number"
                value={form.minNoticeHours}
                onChange={(e) => setForm({ ...form, minNoticeHours: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max days ahead</Label>
              <Input
                type="number"
                value={form.maxDaysAhead}
                onChange={(e) => setForm({ ...form, maxDaysAhead: parseInt(e.target.value, 10) || 45 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Reminder offsets (minutes before, comma)</Label>
              <Input value={form.reminderOffsets} onChange={(e) => setForm({ ...form, reminderOffsets: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.publicBookingEnabled}
              onChange={(e) => setForm({ ...form, publicBookingEnabled: e.target.checked })}
            />
            Public booking enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.aiAssistantEnabled}
              onChange={(e) => setForm({ ...form, aiAssistantEnabled: e.target.checked })}
            />
            AI assistant on /book
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Confirmation subject</Label>
            <Input value={form.confirmationEmailSubject} onChange={(e) => setForm({ ...form, confirmationEmailSubject: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Confirmation HTML</Label>
            <Textarea
              rows={6}
              value={form.confirmationEmailHtml}
              onChange={(e) => setForm({ ...form, confirmationEmailHtml: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Reminder subject</Label>
            <Input value={form.reminderEmailSubject} onChange={(e) => setForm({ ...form, reminderEmailSubject: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Reminder HTML</Label>
            <Textarea rows={5} value={form.reminderEmailHtml} onChange={(e) => setForm({ ...form, reminderEmailHtml: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Cancellation policy (optional, for future guest page)</Label>
            <Textarea rows={3} value={form.cancellationPolicyHtml} onChange={(e) => setForm({ ...form, cancellationPolicyHtml: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="min-h-[48px]">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
      </Button>
    </div>
  );
}
