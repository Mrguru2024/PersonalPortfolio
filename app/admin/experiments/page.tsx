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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/admin/experiments/new">New experiment</Link>
        </Button>
      </div>

      <ExperimentDashboard experimentCount={rows.length} />

      <div>
        <h2 className="text-lg font-medium mb-3">All experiments</h2>
        {isLoading ? (
          <div className="flex py-12 justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 border rounded-lg text-center">
            No experiments yet. Create one to get a stable <code className="text-xs">experiment_key</code> for tracking metadata.
          </p>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <ExperimentTable rows={rows} />
          </div>
        )}
      </div>
    </div>
  );
}
