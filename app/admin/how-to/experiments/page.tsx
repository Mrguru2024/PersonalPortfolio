"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadAloudButton } from "@/components/admin/ReadAloudButton";
import { ExperimentsAbTestingTutorial } from "@/components/how-to/ExperimentsAbTestingTutorial";
import { getExperimentsTutorialReadAloudText } from "@/lib/experimentsHowToTutorial";

export default function AdminHowToExperimentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const readAloud = getExperimentsTutorialReadAloudText();

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-4xl py-8 px-4 sm:px-6 lg:max-w-5xl">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href="/admin/how-to">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All how-tos
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/experiments">Experiments hub</Link>
          </Button>
        </div>

        <header className="mb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal gap-1">
              <FlaskConical className="h-3 w-3" aria-hidden />
              Interactive tutorial
            </Badge>
            <Badge variant="outline" className="font-normal">
              Checked against AEE code paths
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 sm:h-9 sm:w-9 text-primary shrink-0" aria-hidden />
            A/B testing &amp; experiment tools
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base leading-relaxed">
            Learn how the <strong className="text-foreground font-medium">Revenue experiments</strong> hub works end to
            end: creating variants, reading rollups, using the calculator, linking paid campaigns, and (optionally) AI
            insights. Use the tabs and checklist — progress saves in your browser. Technical names (
            <code className="text-xs bg-muted px-1 rounded">growth_experiments</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">aee_experiment_metrics_daily</code>) match the live implementation.
          </p>
          <ReadAloudButton text={readAloud} label="Listen to full tutorial" variant="secondary" className="w-full sm:w-auto" />
        </header>

        <ExperimentsAbTestingTutorial />
      </div>
    </div>
  );
}
