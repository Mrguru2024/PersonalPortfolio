"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiRequest } from "@/lib/queryClient";
import { ExperimentDashboard } from "@/components/aee/ExperimentDashboard";
import { ExperimentTable, type ExperimentTableRow } from "@/components/aee/ExperimentTable";
import { ExperimentsWorkflowCard } from "@/components/aee/ExperimentsWorkflowCard";
import { AbTestingToolsPanel } from "@/components/aee/AbTestingToolsPanel";
import { ExperimentsAdvancedToolsPanel } from "@/components/aee/ExperimentsAdvancedToolsPanel";

type ListPayload = {
  experiments: Array<{
    id: number;
    key: string;
    name: string;
    status: string;
    workspaceKey: string;
    funnelStage: string | null;
    offerType: string | null;
    primaryPersonaKey: string | null;
    variantCount: number;
    updatedAt: string;
  }>;
};

export default function AdminExperimentsPage() {
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

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/experiments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/experiments");
      return res.json() as Promise<ListPayload>;
    },
    enabled: canSee,
  });

  if (authLoading || !canSee) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows: ExperimentTableRow[] = (data?.experiments ?? []).map((e) => ({
    ...e,
    updatedAt: typeof e.updatedAt === "string" ? e.updatedAt : new Date(e.updatedAt).toISOString(),
  }));

  const statusBreakdown = rows.reduce(
    (acc, r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "running") acc.running += 1;
      else if (s === "draft") acc.draft += 1;
      else if (s === "paused") acc.paused += 1;
      else if (s === "ended") acc.ended += 1;
      return acc;
    },
    { running: 0, draft: 0, paused: 0, ended: 0 },
  );

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Start a test, run the A/B calculator, or refresh rollups — all from here.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/admin/experiments/new">New experiment</Link>
        </Button>
      </div>

      <ExperimentsWorkflowCard />

      <ExperimentDashboard experimentCount={rows.length} statusBreakdown={statusBreakdown} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AbTestingToolsPanel />
        <ExperimentsAdvancedToolsPanel />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">All experiments</h2>
        </div>
        {isLoading ? (
          <div className="flex py-16 justify-center rounded-xl border border-dashed">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No experiments yet. Create one to get a stable{" "}
              <code className="text-xs bg-muted px-1 rounded">experiment_key</code> for tracking metadata and variant
              assignment.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/experiments/new">Create your first experiment</Link>
            </Button>
          </div>
        ) : (
          <ExperimentTable rows={rows} />
        )}
      </section>
    </div>
  );
}
