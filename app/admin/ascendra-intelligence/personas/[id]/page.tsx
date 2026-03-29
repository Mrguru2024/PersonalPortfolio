"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";

interface Persona {
  id: string;
  displayName: string;
  segment: string | null;
  revenueBand: string | null;
  summary: string | null;
  strategicNote: string | null;
  problems: string[];
  goals: string[];
  objections: string[];
  dynamicSignals: string[];
  updatedAt: string;
}

function linesFromArr(a: string[]) {
  return a.join("\n");
}

function arrFromLines(s: string) {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AscendraPersonaDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ?? "";
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

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

  const { data, isLoading } = useQuery<{ persona: Persona }>({
    queryKey: ["/api/admin/ascendra-intelligence/personas", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ascendra-intelligence/personas/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  const persona = data?.persona;

  useEffect(() => {
    if (!persona) return;
    setDisplayName(persona.displayName);
    setSegment(persona.segment ?? "");
    setRevenueBand(persona.revenueBand ?? "");
    setSummary(persona.summary ?? "");
    setStrategicNote(persona.strategicNote ?? "");
    setProblems(linesFromArr(persona.problems));
    setGoals(linesFromArr(persona.goals));
    setObjections(linesFromArr(persona.objections));
    setDynamicSignals(linesFromArr(persona.dynamicSignals));
  }, [persona]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/admin/ascendra-intelligence/personas/${encodeURIComponent(id)}`, {
        displayName,
        segment: segment || null,
        revenueBand: revenueBand || null,
        summary: summary || null,
        strategicNote: strategicNote || null,
        problems: arrFromLines(problems),
        goals: arrFromLines(goals),
        objections: arrFromLines(objections),
        dynamicSignals: arrFromLines(dynamicSignals),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/personas"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/personas", id] });
      toast({ title: "Saved" });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-12 text-center text-muted-foreground">
        Persona not found.
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/admin/ascendra-intelligence/personas">Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ascendra-intelligence/personas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All personas
          </Link>
        </Button>

        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">{persona.id}</p>
          <h1 className="text-2xl font-bold">Edit persona</h1>
          <p className="text-sm text-muted-foreground mt-1">Updated {formatLocaleMediumDateTime(persona.updatedAt)}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Display fields used for internal messaging and AI context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="segment">Segment</Label>
                <Input id="segment" value={segment} onChange={(e) => setSegment(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenueBand">Revenue band</Label>
                <Input id="revenueBand" value={revenueBand} onChange={(e) => setRevenueBand(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategicNote">Strategic note (e.g. partner-level)</Label>
              <Textarea
                id="strategicNote"
                rows={3}
                value={strategicNote}
                onChange={(e) => setStrategicNote(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lists</CardTitle>
            <CardDescription>One item per line.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Problems</Label>
              <Textarea rows={5} value={problems} onChange={(e) => setProblems(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Goals</Label>
              <Textarea rows={5} value={goals} onChange={(e) => setGoals(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Objections</Label>
              <Textarea rows={5} value={objections} onChange={(e) => setObjections(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dynamic signals</Label>
              <Textarea rows={5} value={dynamicSignals} onChange={(e) => setDynamicSignals(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => save.mutate()} disabled={save.isPending || !displayName.trim()}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
