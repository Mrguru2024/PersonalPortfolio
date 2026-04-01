"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Row = {
  id: number;
  workflowKey: string;
  triggerType: string;
  status: string;
  startedAt: string | null;
  relatedEntityType: string;
  relatedEntityId: number;
};

export function SchedulerWorkflowActivityCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/scheduler/workflow-activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/scheduler/workflow-activity?limit=12", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ executions: Row[] }>;
    },
  });

  const rows = data?.executions ?? [];

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Booking automations</CardTitle>
        <CardDescription>
          Recent workflow runs from the scheduler (tags, tasks, alerts when a CRM contact is linked).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/scheduler/workflows">Configure &amp; triggers</Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          </div>
        ) : isError ? (
          <p className="text-muted-foreground">Could not load activity.</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">
            No runs yet. After the next booking or status change, entries appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-md border border-border/50 text-xs">
            {rows.map((r) => (
              <li key={r.id} className="px-3 py-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-foreground capitalize">
                  {r.triggerType.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {r.startedAt
                    ? new Date(r.startedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"}
                  <span className="hidden sm:inline"> · </span>
                  <span className="block sm:inline">
                    {r.status}
                    {r.relatedEntityType === "contact" && r.relatedEntityId > 0 ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link
                          href={`/admin/crm/${r.relatedEntityId}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          CRM
                        </Link>
                      </>
                    ) : null}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
