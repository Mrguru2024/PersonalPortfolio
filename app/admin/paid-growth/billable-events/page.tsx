"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type BillableRow = {
  id: number;
  crmContactId: number;
  ppcCampaignId: number | null;
  attributionSessionId: number | null;
  eventKind: string;
  amountCents: number | null;
  status: string;
  disputeNotes: string | null;
  createdAt: string;
  contact: ContactMini;
};

const STATUSES = ["pending", "approved", "disputed", "rejected", "invoiced"] as const;

export default function PaidGrowthBillableEventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [crmFilter, setCrmFilter] = useState("");
  const [editRow, setEditRow] = useState<BillableRow | null>(null);
  const [patchStatus, setPatchStatus] = useState("pending");
  const [patchDispute, setPatchDispute] = useState("");
  const [patchAmount, setPatchAmount] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const queryKey = useMemo(
    () => [
      "/api/admin/paid-growth/billable-events",
      statusFilter === "all" ? "" : statusFilter,
      crmFilter.trim(),
    ],
    [statusFilter, crmFilter],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("limit", "80");
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (crmFilter.trim() && Number.isFinite(Number(crmFilter.trim()))) {
        qs.set("crmContactId", crmFilter.trim());
      }
      const res = await apiRequest("GET", `/api/admin/paid-growth/billable-events?${qs.toString()}`);
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ events: BillableRow[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, status, disputeNotes, amountCents }: { id: number; status: string; disputeNotes: string; amountCents: string }) => {
      const body: Record<string, unknown> = { status };
      if (disputeNotes.trim()) body.disputeNotes = disputeNotes.trim();
      if (amountCents.trim()) {
        const dollars = Number.parseFloat(amountCents);
        if (Number.isFinite(dollars)) body.amountCents = Math.round(dollars * 100);
      }
      const res = await apiRequest("PATCH", `/api/admin/paid-growth/billable-events/${id}`, body);
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated" });
      setEditRow(null);
      void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/billable-events"] });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const events = data?.events ?? [];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold">Billable events</h2>
        <p className="text-sm text-muted-foreground">
          Performance and hybrid billing line items (e.g. verified leads). Approve, dispute, or reject before invoicing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Scope by status or CRM contact id.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2 w-48">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-48">
            <Label htmlFor="crmFilter">CRM contact id</Label>
            <Input
              id="crmFilter"
              placeholder="optional"
              value={crmFilter}
              onChange={(e) => setCrmFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queue</CardTitle>
          <CardDescription>{isLoading ? "Loading…" : `${events.length} row(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billable events match.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Contact</th>
                    <th className="p-3 font-medium">Kind</th>
                    <th className="p-3 font-medium">Campaign</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium w-28" />
                  </tr>
                </thead>
                <tbody>
                  {events.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="p-3">
                        {r.contact ? (
                          <>
                            <span className="font-medium">{r.contact.name}</span>
                            <br />
                            <span className="text-muted-foreground text-xs">{r.contact.email}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">#{r.crmContactId}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{r.eventKind}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{r.ppcCampaignId ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline">{r.status}</Badge>
                      </td>
                      <td className="p-3">
                        {r.amountCents != null ? `$${(r.amountCents / 100).toFixed(2)}` : "—"}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditRow(r);
                            setPatchStatus(r.status);
                            setPatchDispute(r.disputeNotes ?? "");
                            setPatchAmount(
                              r.amountCents != null ? (r.amountCents / 100).toFixed(2) : "",
                            );
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editRow ? (
        <Card>
          <CardHeader>
            <CardTitle>Update event #{editRow.id}</CardTitle>
            <CardDescription>Status and dispute notes — internal only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={patchStatus} onValueChange={setPatchStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (USD)</Label>
              <Input id="amt" type="number" step="0.01" value={patchAmount} onChange={(e) => setPatchAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dis">Dispute / notes</Label>
              <Input id="dis" value={patchDispute} onChange={(e) => setPatchDispute(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button
                disabled={patchMut.isPending}
                onClick={() =>
                  patchMut.mutate({
                    id: editRow.id,
                    status: patchStatus,
                    disputeNotes: patchDispute,
                    amountCents: patchAmount,
                  })
                }
              >
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button variant="link" asChild>
                <Link href={`/admin/crm/contacts/${editRow.crmContactId}`}>CRM</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
