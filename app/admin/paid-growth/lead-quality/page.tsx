"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Row = {
  id: number;
  crmContactId: number;
  fitScore: number | null;
  leadValid: boolean | null;
  spamFlag: boolean | null;
  bookedCall: boolean | null;
  sold: boolean | null;
  notes: string | null;
  contact?: { name: string; email: string };
};

export default function PaidGrowthLeadQualityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [fitScore, setFitScore] = useState("");
  const [notes, setNotes] = useState("");
  const [leadValid, setLeadValid] = useState(true);
  const [spam, setSpam] = useState(false);
  const [booked, setBooked] = useState(false);
  const [sold, setSold] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/lead-quality"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/lead-quality?limit=60");
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<Row[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const saveMut = useMutation({
    mutationFn: async (crmContactId: number) => {
      const res = await apiRequest("POST", "/api/admin/paid-growth/lead-quality", {
        crmContactId,
        fitScore: fitScore ? Number(fitScore) : null,
        notes,
        leadValid,
        spamFlag: spam,
        bookedCall: booked,
        sold,
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Saved" });
      qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/lead-quality"] });
      setEditId(null);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Score paid-sourced leads for fit and outcomes. Data lives in <code className="text-xs">ppc_lead_quality</code> keyed
        by CRM contact — no duplicate lead table.
      </p>
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <Link className="hover:underline" href={`/admin/crm/${r.crmContactId}`}>
                      {r.contact?.name ?? r.contact?.email ?? `Contact #${r.crmContactId}`}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    Fit {r.fitScore ?? "—"} · Booked {r.bookedCall ? "yes" : "no"} · Sold {r.sold ? "yes" : "no"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editId === r.crmContactId ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Fit score (0–100)</Label>
                          <Input value={fitScore} onChange={(e) => setFitScore(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center text-sm">
                        <label className="flex items-center gap-2">
                          <Switch checked={leadValid} onCheckedChange={setLeadValid} />
                          Valid lead
                        </label>
                        <label className="flex items-center gap-2">
                          <Switch checked={spam} onCheckedChange={setSpam} />
                          Spam / low quality
                        </label>
                        <label className="flex items-center gap-2">
                          <Switch checked={booked} onCheckedChange={setBooked} />
                          Booked call
                        </label>
                        <label className="flex items-center gap-2">
                          <Switch checked={sold} onCheckedChange={setSold} />
                          Sold
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveMut.mutate(r.crmContactId)} disabled={saveMut.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between gap-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{r.notes || "—"}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(r.crmContactId);
                          setFitScore(r.fitScore != null ? String(r.fitScore) : "");
                          setNotes(r.notes ?? "");
                          setLeadValid(r.leadValid !== false);
                          setSpam(!!r.spamFlag);
                          setBooked(!!r.bookedCall);
                          setSold(!!r.sold);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
