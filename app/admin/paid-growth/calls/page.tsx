"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ContactMini = { id: number; name: string; email: string } | null;

type CallRow = {
  id: number;
  crmContactId: number | null;
  ppcCampaignId: number | null;
  attributionSessionId: number | null;
  direction: string;
  callerNumber: string | null;
  trackingNumber: string | null;
  durationSeconds: number | null;
  answeredByClient: boolean | null;
  disposition: string | null;
  verificationStatus: string | null;
  billableStatus: string | null;
  createdAt: string;
  contact: ContactMini;
};

const VERIFY_OPTS = [
  "pending",
  "verified_qualified",
  "verified_unqualified",
  "spam",
  "duplicate",
  "outside_service_area",
  "wrong_service",
  "no_intent",
  "unanswered",
] as const;

export default function PaidGrowthCallsQueuePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [verifyFilter, setVerifyFilter] = useState<string>("all");

  const [crmContactId, setCrmContactId] = useState("");
  const [callerNumber, setCallerNumber] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [answered, setAnswered] = useState(false);

  const [editCall, setEditCall] = useState<CallRow | null>(null);
  const [editVerify, setEditVerify] = useState("pending");
  const [editBillable, setEditBillable] = useState("pending");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const queryKey = useMemo(
    () => ["/api/admin/paid-growth/tracked-calls", verifyFilter],
    [verifyFilter],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("limit", "80");
      if (verifyFilter !== "all") qs.set("verificationStatus", verifyFilter);
      const res = await apiRequest("GET", `/api/admin/paid-growth/tracked-calls?${qs.toString()}`);
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ calls: CallRow[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        callerNumber: callerNumber.trim() || null,
        durationSeconds: durationSeconds.trim() ? Number(durationSeconds) : null,
        answeredByClient: answered,
        internalNotes: internalNotes.trim() || undefined,
        verificationStatus: "pending",
        billableStatus: "pending",
      };
      if (crmContactId.trim() && Number.isFinite(Number(crmContactId))) {
        body.crmContactId = Number(crmContactId);
      }
      const res = await apiRequest("POST", "/api/admin/paid-growth/tracked-calls", body);
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Call logged" });
      setCallerNumber("");
      setDurationSeconds("");
      setInternalNotes("");
      setCrmContactId("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/tracked-calls"] });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, verificationStatus, billableStatus }: { id: number; verificationStatus: string; billableStatus: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/paid-growth/tracked-calls/${id}`, {
        verificationStatus,
        billableStatus,
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Saved" });
      setEditCall(null);
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/tracked-calls"] });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const calls = data?.calls ?? [];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold inline-flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call tracking queue
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manual call log and verification until a telephony provider webhook is connected. Tie rows to CRM contacts and
          campaigns when known.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log inbound call</CardTitle>
          <CardDescription>Minimal fields — expand via API or future import.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="cid">CRM contact id (optional)</Label>
            <Input id="cid" value={crmContactId} onChange={(e) => setCrmContactId(e.target.value)} placeholder="e.g. 42" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caller">Caller number</Label>
            <Input id="caller" value={callerNumber} onChange={(e) => setCallerNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dur">Duration (seconds)</Label>
            <Input id="dur" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch id="ans" checked={answered} onCheckedChange={setAnswered} />
            <Label htmlFor="ans">Answered by client / team</Label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Button disabled={createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log call"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Queue</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Verification filter</span>
            <Select value={verifyFilter} onValueChange={setVerifyFilter}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {VERIFY_OPTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No calls in this filter.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {calls.map((c) => (
                <li key={c.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline">#{c.id}</Badge>
                      <Badge variant="secondary">{c.direction}</Badge>
                      <Badge variant="outline">{c.verificationStatus ?? "—"}</Badge>
                      <Badge variant="outline">{c.billableStatus ?? "—"}</Badge>
                    </div>
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">From </span>
                      {c.callerNumber ?? "unknown"}
                      {c.durationSeconds != null ? (
                        <span className="text-muted-foreground"> · {c.durationSeconds}s</span>
                      ) : null}
                    </p>
                    {c.contact ? (
                      <p className="text-sm text-muted-foreground">
                        {c.contact.name} · {c.contact.email}
                      </p>
                    ) : c.crmContactId ? (
                      <Button variant="link" className="h-auto p-0 text-sm" asChild>
                        <Link href={`/admin/crm/contacts/${c.crmContactId}`}>CRM #{c.crmContactId}</Link>
                      </Button>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditCall(c);
                      setEditVerify(c.verificationStatus ?? "pending");
                      setEditBillable(c.billableStatus ?? "pending");
                    }}
                  >
                    Review
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editCall ? (
        <Card>
          <CardHeader>
            <CardTitle>Call #{editCall.id}</CardTitle>
            <CardDescription>Verification and billable flags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Verification</Label>
              <Select value={editVerify} onValueChange={setEditVerify}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFY_OPTS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billable</Label>
              <Select value={editBillable} onValueChange={setEditBillable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["pending", "eligible", "not_eligible", "billed", "disputed"] as const).map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={patchMut.isPending}
                onClick={() =>
                  patchMut.mutate({
                    id: editCall.id,
                    verificationStatus: editVerify,
                    billableStatus: editBillable,
                  })
                }
              >
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditCall(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
