"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricTooltip } from "@/components/aee/MetricTooltip";

export default function AdminExperimentsReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (
      !authLoading &&
      user &&
      (!user.isAdmin || !user.adminApproved) &&
      user.permissions?.experiments !== true &&
      user.isSuperUser !== true
    ) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const canSee =
    !!user &&
    ((user.isAdmin && user.adminApproved) || user.permissions?.experiments === true || user.isSuperUser === true);

  if (authLoading || !canSee) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg font-medium">Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Winners, losers, and revenue impact roll up from{" "}
          <code className="text-xs bg-muted px-1 rounded">aee_experiment_metrics_daily</code> plus CRM outcomes. Export
          actions will attach to each experiment detail page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MetricTooltip
              label="Top metrics"
              explanation="Conversion rate uses visitors and leads from daily slices. Revenue uses closed-won cents attributed in metrics or CRM events. Cost per lead merges spend from ppc_performance_snapshots when campaigns are linked."
            />
          </CardTitle>
          <CardDescription>Use an experiment&apos;s detail page for variant rollups and download once wired.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground">For now:</strong> open any experiment from the{" "}
            <Link href="/admin/experiments" className="text-primary hover:underline">
              overview table
            </Link>{" "}
            for heuristic winners / needs-data signals.
          </p>
          <p>
            Cross-experiment leaderboard and CSV export land in Phase 3 when nightly rollups write{" "}
            <code className="text-xs">dimensionKey=&quot;total&quot;</code> rows from{" "}
            <code className="text-xs">visitor_activity</code> and CRM.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
