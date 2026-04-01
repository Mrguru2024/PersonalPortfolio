"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2, Phone, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDevOnly } from "@/components/admin/AdminDevOnly";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type TrackedNumber = {
  id: number;
  phoneE164: string;
  label: string;
  provider: string;
  recordingEnabled: boolean;
  active: boolean;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
};

type CallLog = {
  id: number;
  trackedNumberId: number | null;
  direction: string;
  fromE164: string;
  toE164: string;
  callStatus: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
  recordingDurationSeconds: number | null;
  externalCallSid: string;
  crmContactId: number | null;
  loggedAt: string;
};

export default function PhoneTrackingPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [phoneE164, setPhoneE164] = useState("");
  const [label, setLabel] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [logDays, setLogDays] = useState(30);

  const numbersQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/phone-tracking/numbers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/phone-tracking/numbers");
      return (await res.json()) as TrackedNumber[];
    },
  });

  const callsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/phone-tracking/calls", logDays],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/phone-tracking/calls?limit=200&sinceDays=${logDays}`,
      );
      return (await res.json()) as CallLog[];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/behavior-intelligence/phone-tracking/numbers", {
        phoneE164,
        label: label.trim() || "Tracked line",
        recordingEnabled: true,
        active: true,
      });
      return (await res.json()) as TrackedNumber;
    },
    onSuccess: () => {
      setPhoneE164("");
      setLabel("");
      toast({ title: "Number added", description: "Calls matching this line will log when Twilio posts status callbacks." });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/phone-tracking/numbers"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/overview"] });
    },
    onError: (e: Error) => toast({ title: "Could not add", description: e.message, variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: async (input: { id: number; body: Record<string, unknown> }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/behavior-intelligence/phone-tracking/numbers/${input.id}`,
        input.body,
      );
      return (await res.json()) as TrackedNumber;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/phone-tracking/numbers"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/behavior-intelligence/phone-tracking/numbers/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Removed" });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/phone-tracking/numbers"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/overview"] });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            Phone tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Register the business lines you want in analytics. Supported today:{" "}
            <strong className="text-foreground">Twilio voice</strong> status callbacks to this app. Call recording is the
            default for playback when your Twilio flow sends a <code className="text-xs bg-muted px-1 rounded">RecordingUrl</code>{" "}
            on the callback; you can turn storage off per number below.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 text-left px-6 py-4 hover:bg-muted/30 rounded-t-lg border-b"
            >
              {setupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-medium text-sm">Twilio setup (voice status &amp; recording)</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Point your Twilio number’s <strong className="text-foreground">voice status callback</strong> (and recording
                  callback, if used) to this site’s webhook:{" "}
                  <code className="text-xs bg-muted px-1 rounded break-all">
                    …/api/webhooks/twilio/voice
                  </code>
                  . Same URL as Revenue Ops missed-call handling — both run together.
                </li>
                <li>
                  Enable call recording in your TwiML or console as you normally would for compliance. When Twilio includes{" "}
                  <code className="text-xs bg-muted px-1 rounded">RecordingUrl</code> on the callback, we store it for playback
                  here (unless you disable recording on the tracked number).
                </li>
                <li>
                  Add each E.164 number you own below. We only create log rows when <code className="text-xs bg-muted px-1 rounded">To</code>{" "}
                  (inbound) or <code className="text-xs bg-muted px-1 rounded">From</code> (outbound) matches a tracked line.
                </li>
              </ol>
              <AdminDevOnly>
                <p className="text-xs font-mono text-muted-foreground">
                  TWILIO_STATUS_CALLBACK_URL · TWILIO_ACCOUNT_SID · Configure recording on the Twilio side; this UI does not
                  start recordings by itself.
                </p>
              </AdminDevOnly>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add tracked number</CardTitle>
          <CardDescription>Use the same format Twilio sends (E.164 recommended).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end max-w-xl">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label htmlFor="pt-phone">Phone</Label>
            <Input
              id="pt-phone"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
              placeholder="+15551234567"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label htmlFor="pt-label">Label</Label>
            <Input id="pt-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Main line" />
          </div>
          <Button type="button" disabled={!phoneE164.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
            {createMut.isPending ? "Saving…" : "Add"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracked lines</CardTitle>
          <CardDescription>Toggle logging, recording playback storage, or remove a line.</CardDescription>
        </CardHeader>
        <CardContent>
          {numbersQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(numbersQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No numbers yet. Add your Twilio voice numbers above.</p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Recording playback</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbersQuery.data.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.label}</TableCell>
                    <TableCell className="font-mono text-sm">{n.phoneE164}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`rec-${n.id}`}
                          checked={n.recordingEnabled}
                          onCheckedChange={(c) => patchMut.mutate({ id: n.id, body: { recordingEnabled: c } })}
                          disabled={patchMut.isPending}
                        />
                        <Label htmlFor={`rec-${n.id}`} className="text-xs cursor-pointer">
                          Store recording URL
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        id={`act-${n.id}`}
                        checked={n.active}
                        onCheckedChange={(c) => patchMut.mutate({ id: n.id, body: { active: c } })}
                        disabled={patchMut.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label={`Remove ${n.label}`}
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm(`Remove tracked number ${n.phoneE164}?`)) deleteMut.mutate(n.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Call log</CardTitle>
            <CardDescription>Recent calls on tracked lines with duration and recording when available.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Window</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={logDays}
              onChange={(e) => setLogDays(Number(e.target.value))}
              aria-label="Log window days"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {callsQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(callsQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No calls logged yet for tracked numbers.</p>
          : <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Recording</TableHead>
                    <TableHead>CRM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callsQuery.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(c.loggedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs capitalize">{c.direction.replace(/-/g, " ")}</TableCell>
                      <TableCell className="text-xs font-mono max-w-[220px]">
                        <span className="break-all">{c.fromE164}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="break-all">{c.toE164}</span>
                      </TableCell>
                      <TableCell className="text-xs">{c.callStatus ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {c.durationSeconds != null ? `${c.durationSeconds}s` : "—"}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {c.recordingUrl ?
                          <audio controls className="h-8 w-full max-w-[260px]" preload="none">
                            <source src={c.recordingUrl} />
                          </audio>
                        : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.crmContactId != null ?
                          <Link className="text-primary underline" href={`/admin/crm/${c.crmContactId}`}>
                            #{c.crmContactId}
                          </Link>
                        : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
