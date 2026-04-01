"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

/** Keep in sync with `PPC_LEAD_VERIFICATION_STATUSES` in shared/paidGrowthSchema (client-safe copy). */
const VERIFICATION_STATUSES = [
  "pending_verification",
  "verified_qualified",
  "verified_unqualified",
  "spam",
  "duplicate",
  "outside_service_area",
  "wrong_service",
  "no_intent",
  "unanswered",
] as const;

type Row = {
  id: number;
  crmContactId: number;
  ppcCampaignId: number | null;
  attributionSessionId: number | null;
  fitScore: number | null;
  leadValid: boolean | null;
  spamFlag: boolean | null;
  bookedCall: boolean | null;
  sold: boolean | null;
  verificationStatus: string | null;
  billableStatus: string | null;
  notes: string | null;
  contact?: { name: string; email: string };
};

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Pending verification",
  verified_qualified: "Verified · qualified",
  verified_unqualified: "Verified · unqualified",
  spam: "Spam",
  duplicate: "Duplicate",
  outside_service_area: "Outside service area",
  wrong_service: "Wrong service",
  no_intent: "No intent",
  unanswered: "Unanswered / lost",
};

export default function PpcVerificationQueuePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("pending_verification");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/lead-quality", "pending_verification"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        "/api/admin/paid-growth/lead-quality?verificationStatus=pending_verification&limit=80",
      );
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<Row[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const saveMut = useMutation({
    mutationFn: async (crmContactId: number) => {
      const res = await apiRequest("POST", "/api/admin/paid-growth/lead-quality", {
        crmContactId,
        verificationStatus,
        verificationNotes: notes || undefined,
        notes,
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Verification saved" });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/lead-quality"] });
      setEditId(null);
      setNotes("");
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead verification queue</CardTitle>
          <CardDescription>
            PPC and paid-attributed leads land here as <Badge variant="secondary">pending verification</Badge>. Resolve
            disposition to drive billable events and CRM accuracy.{" "}
            <Link href="/admin/paid-growth/lead-quality" className="text-primary underline-offset-4 hover:underline">
              All lead quality rows
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads awaiting verification.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {rows.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{r.contact?.name ?? `Contact #${r.crmContactId}`}</p>
                      <p className="text-sm text-muted-foreground">{r.contact?.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {r.ppcCampaignId != null ? (
                          <Badge variant="outline">Campaign #{r.ppcCampaignId}</Badge>
                        ) : null}
                        {r.attributionSessionId != null ? (
                          <Badge variant="outline">Session #{r.attributionSessionId}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/crm/contacts/${r.crmContactId}`}>CRM profile</Link>
                      </Button>
                      <Button size="sm" onClick={() => setEditId(r.id === editId ? null : r.id)}>
                        {editId === r.id ? "Close" : "Verify"}
                      </Button>
                    </div>
                  </div>
                  {editId === r.id ? (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Disposition</Label>
                        <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VERIFICATION_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s] ?? s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                      </div>
                      <Button
                        disabled={saveMut.isPending}
                        onClick={() => saveMut.mutate(r.crmContactId)}
                        className="w-full sm:w-auto"
                      >
                        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save disposition"}
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
