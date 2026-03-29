"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CommunityShell } from "@/components/community/CommunityShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Sparkles, Target, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type DashboardPayload = {
  profile: unknown;
  tags: unknown;
  intelligence: {
    activationScore?: number;
    networkingScore?: number;
    collaborationScore?: number;
  } | null;
  nextBestAction: { id: string; title: string; description: string; href: string };
  topSuggestions: { userId: number; score: number; reasons: string[] }[];
  modules: Record<string, { href: string; label: string }>;
};

export default function CommunityHomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth?redirect=/community/home");
  }, [user, authLoading, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/community/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/dashboard");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<DashboardPayload>;
    },
    enabled: !!user,
  });

  if (authLoading || !user) return null;

  return (
    <CommunityShell>
      <div className="container max-w-4xl py-8 px-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your AFN home</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Calm, intentional next steps — not a feed.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">Could not load dashboard. Try refreshing.</p>
        )}

        {data && (
          <>
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <Target className="h-4 w-4" />
                  <CardTitle className="text-base">Next best action</CardTitle>
                </div>
                <CardDescription>{data.nextBestAction.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="gap-2">
                  <Link href={data.nextBestAction.href}>
                    {data.nextBestAction.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {data.intelligence && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Activation</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {data.intelligence.activationScore ?? "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Networking</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {data.intelligence.networkingScore ?? "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Collaboration</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {data.intelligence.collaborationScore ?? "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <CardTitle className="text-base">Suggested people</CardTitle>
                </div>
                <CardDescription>Based on your profile tags and focus.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topSuggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Complete onboarding and add tags to see stronger matches.
                  </p>
                ) : (
                  data.topSuggestions.map((s) => (
                    <div
                      key={s.userId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex flex-wrap gap-1">
                        {s.reasons.slice(0, 3).map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs font-normal">
                            {r}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/community/inbox?with=${s.userId}`}>Connect</Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <CardTitle className="text-base">Programs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {Object.entries(data.modules).map(([key, mod]) => (
                  <Button key={key} variant="secondary" asChild className="justify-start">
                    <Link href={mod.href}>{mod.label}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CommunityShell>
  );
}
