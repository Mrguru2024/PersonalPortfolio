"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ADMIN_OPERATOR_ROLE_OPTIONS,
  ADMIN_OPERATOR_ROLE_LABELS,
  type AdminOperatorRoleSelection,
} from "@shared/schema";

interface IntelligencePayload {
  dailyTasks: Array<{ id: string; title: string; rationale?: string; href?: string | null }>;
  weeklyTasks: Array<{ id: string; title: string; rationale?: string; href?: string | null }>;
  tips: string[];
  generatedAt: string;
  source: "openai" | "fallback";
}

interface Profile {
  userId: number;
  roleSelection: string;
  mission: string | null;
  vision: string | null;
  goals: string | null;
  taskFocus: string | null;
  intelligence: IntelligencePayload | null;
  updatedAt: string;
}

export default function AdminOperatorProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [roleSelection, setRoleSelection] = useState("general");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [goals, setGoals] = useState("");
  const [taskFocus, setTaskFocus] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ profile: Profile }>({
    queryKey: ["/api/admin/operator-profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/operator-profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const profile = data?.profile;

  useEffect(() => {
    if (!profile) return;
    setRoleSelection(profile.roleSelection);
    setMission(profile.mission ?? "");
    setVision(profile.vision ?? "");
    setGoals(profile.goals ?? "");
    setTaskFocus(profile.taskFocus ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/admin/operator-profile", {
        roleSelection,
        mission: mission.trim() || null,
        vision: vision.trim() || null,
        goals: goals.trim() || null,
        taskFocus: taskFocus.trim() || null,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/operator-profile"] });
      toast({ title: "Profile saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/operator-profile/refresh", {
        pendingAssessments: 0,
        totalContacts: 0,
        unaccessedResume: 0,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Refresh failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/operator-profile"] });
      toast({ title: "AI plan regenerated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const intel = profile.intelligence;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-3xl space-y-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Operator profile</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Your role focus, mission, vision, and goals shape daily and weekly tasks, AI tips, and dashboard
              priorities. Regenerate after big changes.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Who you are in the system</CardTitle>
            <CardDescription>
              This does not change app permissions — it guides nudges and the intelligence plan. Set{" "}
              <code className="text-xs bg-muted px-1 rounded">OPENAI_API_KEY</code> for full AI; otherwise a smart
              fallback runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Role focus</Label>
              <Select value={roleSelection} onValueChange={setRoleSelection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_OPERATOR_ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ADMIN_OPERATOR_ROLE_LABELS[r as AdminOperatorRoleSelection]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission</Label>
              <Textarea
                id="mission"
                rows={3}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Why your work matters day to day…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vision">Vision</Label>
              <Textarea
                id="vision"
                rows={3}
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Where you’re steering the business or your function…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Goals</Label>
              <Textarea
                id="goals"
                rows={4}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Quarterly or monthly outcomes (bullet sentences are fine)…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskFocus">Current priority / context</Label>
              <Input
                id="taskFocus"
                value={taskFocus}
                onChange={(e) => setTaskFocus(e.target.value)}
                placeholder="e.g. Q1 launch, hiring push, CRM cleanup week"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save profile
              </Button>
              <Button variant="secondary" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
                {refresh.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Regenerate AI plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-violet-500/[0.03]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Intelligence output
            </CardTitle>
            <CardDescription>Daily and weekly tasks plus coaching tips — updated when you refresh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!intel ? (
              <p className="text-sm text-muted-foreground">
                No plan yet. Save your profile, then click <strong>Regenerate AI plan</strong> (dashboard refresh uses
                live inbox counts).
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{intel.source === "openai" ? "OpenAI" : "Fallback engine"}</Badge>
                  <span className="text-xs text-muted-foreground self-center">
                    Generated {new Date(intel.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Today</h3>
                  <ul className="space-y-3">
                    {intel.dailyTasks.map((t) => (
                      <li key={t.id} className="text-sm border-l-2 border-violet-500/30 pl-3">
                        {t.href ? (
                          <Link href={t.href} className="font-medium text-primary hover:underline">
                            {t.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{t.title}</span>
                        )}
                        {t.rationale ? <p className="text-xs text-muted-foreground mt-1">{t.rationale}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">This week</h3>
                  <ul className="space-y-2">
                    {intel.weeklyTasks.map((t) => (
                      <li key={t.id} className="text-sm">
                        {t.href ? (
                          <Link href={t.href} className="text-foreground hover:text-primary hover:underline">
                            {t.title}
                          </Link>
                        ) : (
                          <span>{t.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {intel.tips.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-2">AI tips</h3>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/90">
                        {intel.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
