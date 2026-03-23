"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LESSON_DAYS, CHALLENGE_APPLY_CTA } from "@/lib/challenge/config";

export default function ChallengeDashboardPage() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/challenge/progress", registrationId],
    queryFn: async () => {
      const res = await fetch(`/api/challenge/progress?registrationId=${registrationId}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!registrationId,
  });

  const completeMutation = useMutation({
    mutationFn: async (day: number) => {
      const res = await fetch("/api/challenge/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: Number(registrationId), day }),
      });
      if (!res.ok) throw new Error("Failed to mark complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenge/progress", registrationId] });
    },
  });

  const progressList = (data?.progress ?? []) as { day: number; completedAt: string | null }[];
  const completedDays = progressList.filter((p) => p.completedAt).length;
  const progressPct = LESSON_DAYS.length ? (completedDays / LESSON_DAYS.length) * 100 : 0;

  if (!registrationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center mb-4">Missing registration. Start from the challenge page.</p>
            <Button asChild className="w-full">
              <Link href="/challenge">Go to challenge</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/challenge" className="text-sm text-muted-foreground hover:text-foreground">
            ← Challenge home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <h1 className="text-xl font-bold text-foreground">Your 5-day challenge</h1>
              <p className="text-muted-foreground">Work through each day. Mark complete when done.</p>
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{completedDays} of {LESSON_DAYS.length} days</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </CardHeader>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {LESSON_DAYS.map((item) => {
                const completed = progressList.some((p) => p.day === item.day && p.completedAt);
                return (
                  <Card key={item.day} className="border-border">
                    <CardContent className="py-4 px-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">Day {item.day}</p>
                          <p className="text-sm text-muted-foreground truncate">{item.title}</p>
                        </div>
                      </div>
                      {!completed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMutation.mutate(item.day)}
                          disabled={completeMutation.isPending}
                        >
                          {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark complete"}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Done</span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Next step</h2>
              <p className="text-sm text-muted-foreground">
                Run your growth diagnosis to see where to focus, then apply for a strategy call when you&apos;re ready.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="default" className="gap-2">
                <Link href="/diagnosis">
                  <BarChart3 className="h-4 w-4" />
                  Run growth diagnosis
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={registrationId ? `/challenge/apply?registrationId=${registrationId}` : "/challenge/apply"}>
                  {CHALLENGE_APPLY_CTA.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
