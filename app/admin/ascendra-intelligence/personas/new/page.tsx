"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { linesToStringArray } from "@/lib/personaFormUtils";

export default function NewMarketingPersonaPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [id, setId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [segment, setSegment] = useState("");
  const [revenueBand, setRevenueBand] = useState("");
  const [summary, setSummary] = useState("");
  const [strategicNote, setStrategicNote] = useState("");
  const [problems, setProblems] = useState("");
  const [goals, setGoals] = useState("");
  const [objections, setObjections] = useState("");
  const [dynamicSignals, setDynamicSignals] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/ascendra-intelligence/personas", {
        id: id.trim().toLowerCase(),
        displayName: displayName.trim(),
        segment: segment.trim() || null,
        revenueBand: revenueBand.trim() || null,
        summary: summary.trim() || null,
        strategicNote: strategicNote.trim() || null,
        problems: linesToStringArray(problems),
        goals: linesToStringArray(goals),
        objections: linesToStringArray(objections),
        dynamicSignals: linesToStringArray(dynamicSignals),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { error?: string }).error || "Create failed";
        throw new Error(msg);
      }
      return res.json() as Promise<{ persona: { id: string } }>;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/personas"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/summary"] });
      toast({ title: "Persona created" });
      router.push(`/admin/ascendra-intelligence/personas/${encodeURIComponent(d.persona.id)}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slugOk = /^[a-z0-9][a-z0-9-]*$/.test(id.trim().toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ascendra-intelligence/personas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Personas
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>New marketing persona</CardTitle>
            <CardDescription>
              Stable <code className="text-xs bg-muted px-1 rounded">id</code> slug (e.g.{" "}
              <code className="text-xs bg-muted px-1 rounded">studio-owner</code>) — used in scripts and lead magnets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pid">Persona id (slug)</Label>
              <Input
                id="pid"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. studio-owner"
                autoComplete="off"
              />
              {!slugOk && id.trim() ? (
                <p className="text-xs text-destructive">Lowercase letters, numbers, hyphens; must start with a letter or digit.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dname">Display name</Label>
              <Input
                id="dname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex – Studio owner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seg">Segment</Label>
              <Input id="seg" value={segment} onChange={(e) => setSegment(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev">Revenue band</Label>
              <Input id="rev" value={revenueBand} onChange={(e) => setRevenueBand(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sum">Summary</Label>
              <Textarea id="sum" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strat">Strategic note</Label>
              <Textarea id="strat" rows={2} value={strategicNote} onChange={(e) => setStrategicNote(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prob">Problems (one per line)</Label>
              <Textarea id="prob" rows={4} value={problems} onChange={(e) => setProblems(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Goals (one per line)</Label>
              <Textarea id="goals" rows={4} value={goals} onChange={(e) => setGoals(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obj">Objections (one per line)</Label>
              <Textarea id="obj" rows={3} value={objections} onChange={(e) => setObjections(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dyn">Dynamic signals (one per line)</Label>
              <Textarea id="dyn" rows={3} value={dynamicSignals} onChange={(e) => setDynamicSignals(e.target.value)} />
            </div>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !slugOk || !displayName.trim()}
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create persona
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
