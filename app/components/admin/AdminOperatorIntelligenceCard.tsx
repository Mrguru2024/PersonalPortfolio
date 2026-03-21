"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles, CalendarDays, ListTodo } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IntelligencePayload {
  dailyTasks: Array<{ id: string; title: string; rationale?: string; href?: string | null }>;
  weeklyTasks: Array<{ id: string; title: string; rationale?: string; href?: string | null }>;
  tips: string[];
  generatedAt: string;
  source: "openai" | "fallback";
}

interface Profile {
  roleSelection: string;
  intelligence: IntelligencePayload | null;
}

interface AdminOperatorIntelligenceCardProps {
  /** Dashboard passes live counts so refresh stays accurate without extra API reads. */
  dashboardStats: {
    pendingAssessments: number;
    totalContacts: number;
    unaccessedResume: number;
  };
  compact?: boolean;
}

export function AdminOperatorIntelligenceCard({
  dashboardStats,
  compact = true,
}: AdminOperatorIntelligenceCardProps) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ profile: Profile }>({
    queryKey: ["/api/admin/operator-profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/operator-profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/operator-profile/refresh", dashboardStats);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Refresh failed");
      }
      return res.json() as Promise<{ profile: Profile }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/operator-profile"] });
      toast({ title: "AI plan updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const intel = data?.profile?.intelligence;

  if (isLoading) {
    return (
      <Card className="border-violet-500/20 bg-violet-500/[0.04]">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-background shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              Your AI task plan
            </CardTitle>
            <CardDescription>
              Based on your operator profile (role, mission, goals) and inbox signals. Refresh anytime.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/operator-profile">Edit profile</Link>
            </Button>
            <Button size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              {refresh.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh plan</span>
            </Button>
          </div>
        </div>
        {intel ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="text-xs font-normal">
              {intel.source === "openai" ? "AI generated" : "Smart fallback"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(intel.generatedAt).toLocaleString()}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-1">
            No plan yet — set your profile and run refresh, or open the full page.
          </p>
        )}
      </CardHeader>
      {intel && (
        <CardContent className="space-y-4 pt-0">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
              <ListTodo className="h-3.5 w-3.5" />
              Today
            </h4>
            <ul className="space-y-1.5">
              {(compact ? intel.dailyTasks.slice(0, 4) : intel.dailyTasks).map((t) => (
                <li key={t.id} className="text-sm">
                  {t.href ? (
                    <Link href={t.href} className="font-medium text-primary hover:underline">
                      {t.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{t.title}</span>
                  )}
                  {t.rationale && !compact && (
                    <p className="text-xs text-muted-foreground mt-0.5">{t.rationale}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
              <CalendarDays className="h-3.5 w-3.5" />
              This week
            </h4>
            <ul className="space-y-1.5">
              {(compact ? intel.weeklyTasks.slice(0, 3) : intel.weeklyTasks).map((t) => (
                <li key={t.id} className="text-sm">
                  {t.href ? (
                    <Link href={t.href} className="text-foreground/90 hover:text-primary hover:underline">
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
            <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.04] px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Tips</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-foreground/90">
                {(compact ? intel.tips.slice(0, 3) : intel.tips).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
