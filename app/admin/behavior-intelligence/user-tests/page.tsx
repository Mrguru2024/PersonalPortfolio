"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

type Campaign = {
  id: number;
  name: string;
  hypothesis: string | null;
  active: boolean;
  businessId: string | null;
  createdAt: string;
};

type Observation = {
  id: number;
  campaignId: number;
  sessionId: string | null;
  notes: string;
  createdAt: string;
};

export default function BehaviorUserTestsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [obsSessionId, setObsSessionId] = useState("");
  const [obsNotes, setObsNotes] = useState("");

  const campaignsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/user-tests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/behavior-intelligence/user-tests");
      return res.json() as Promise<Campaign[]>;
    },
  });

  const observationsQuery = useQuery({
    queryKey: ["/api/admin/behavior-intelligence/user-tests/observations", selectedCampaignId],
    queryFn: async () => {
      if (selectedCampaignId == null) return [];
      const res = await apiRequest(
        "GET",
        `/api/admin/behavior-intelligence/user-tests/observations?campaignId=${selectedCampaignId}`,
      );
      return res.json() as Promise<Observation[]>;
    },
    enabled: selectedCampaignId != null,
  });

  const createCampaignMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/behavior-intelligence/user-tests", {
        name,
        hypothesis: hypothesis.trim() || null,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setHypothesis("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/behavior-intelligence/user-tests"] });
    },
  });

  const addObsMut = useMutation({
    mutationFn: async () => {
      if (selectedCampaignId == null) throw new Error("campaign");
      const res = await apiRequest("POST", "/api/admin/behavior-intelligence/user-tests/observations", {
        campaignId: selectedCampaignId,
        sessionId: obsSessionId.trim() || null,
        notes: obsNotes,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setObsNotes("");
      void qc.invalidateQueries({
        queryKey: ["/api/admin/behavior-intelligence/user-tests/observations", selectedCampaignId],
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold">User testing</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/behavior-intelligence">← Overview</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-lg">
          <div className="space-y-1">
            <Label htmlFor="bi-ut-name">Name</Label>
            <Input id="bi-ut-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Booking funnel — mobile" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bi-ut-hyp">Hypothesis (optional)</Label>
            <Textarea
              id="bi-ut-hyp"
              rows={2}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Users abandon because the CTA is below the fold on small screens."
            />
          </div>
          <Button type="button" disabled={!name.trim() || createCampaignMut.isPending} onClick={() => createCampaignMut.mutate()}>
            {createCampaignMut.isPending ? "Saving…" : "Create campaign"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaigns & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaignsQuery.isLoading ?
            <Loader2 className="h-6 w-6 animate-spin" />
          : !(campaignsQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          : <ul className="space-y-2">
              {campaignsQuery.data.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded-lg border p-3 text-sm hover:bg-muted/60 ${selectedCampaignId === c.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedCampaignId(c.id)}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.hypothesis ?
                      <p className="text-muted-foreground text-xs mt-1">{c.hypothesis}</p>
                    : null}
                  </button>
                </li>
              ))}
            </ul>
          }

          {selectedCampaignId != null ?
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium">Add observation</h3>
              <div className="space-y-1">
                <Label htmlFor="bi-ut-sid">Session id (optional — paste from replays)</Label>
                <Input
                  id="bi-ut-sid"
                  value={obsSessionId}
                  onChange={(e) => setObsSessionId(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="uuid from behavior session"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bi-ut-notes">Notes</Label>
                <Textarea id="bi-ut-notes" rows={3} value={obsNotes} onChange={(e) => setObsNotes(e.target.value)} />
              </div>
              <Button type="button" disabled={!obsNotes.trim() || addObsMut.isPending} onClick={() => addObsMut.mutate()}>
                {addObsMut.isPending ? "Saving…" : "Save observation"}
              </Button>

              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Log</h4>
                {observationsQuery.isLoading ?
                  <Loader2 className="h-5 w-5 animate-spin" />
                : !(observationsQuery.data?.length) ?
                  <p className="text-xs text-muted-foreground">No observations.</p>
                : <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                    {observationsQuery.data.map((o) => (
                      <li key={o.id} className="rounded border p-2">
                        {o.sessionId ?
                          <p className="font-mono text-[10px] text-muted-foreground mb-1">{o.sessionId}</p>
                        : null}
                        <p>{o.notes}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                }
              </div>
            </div>
          : null}
        </CardContent>
      </Card>
    </div>
  );
}
