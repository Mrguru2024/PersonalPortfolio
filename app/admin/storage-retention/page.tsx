"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type TrashApi = {
  policy: { retentionDays: number; purgeGraceDays: number };
  behaviorTrash: Array<{
    id: number;
    sessionId: string;
    startTime: string;
    softDeletedAt: string | null;
    retentionImportant: boolean;
    retentionArchived: boolean;
  }>;
  funnelTrash: Array<{
    id: number;
    title: string;
    fileUrl: string;
    status: string;
    softDeletedAt: string | null;
  }>;
  sweep: unknown;
};

export default function StorageRetentionAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/storage-retention"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/storage-retention");
      return res.json() as Promise<TrashApi>;
    },
  });

  const restore = useMutation({
    mutationFn: async (body: { kind: "behavior_session"; sessionId: string } | { kind: "funnel_asset"; id: number }) => {
      await apiRequest("POST", "/api/admin/storage-retention", body);
    },
    onSuccess: () => {
      toast({ title: "Restored" });
      void qc.invalidateQueries({ queryKey: ["/api/admin/storage-retention"] });
    },
    onError: (e: Error) => toast({ title: "Restore failed", description: e.message, variant: "destructive" }),
  });

  const runSweep = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/admin/storage-retention?run=1");
      return res.json() as Promise<TrashApi>;
    },
    onSuccess: (payload) => {
      toast({
        title: "Sweep complete",
        description: payload.sweep ? JSON.stringify(payload.sweep) : undefined,
      });
      void qc.invalidateQueries({ queryKey: ["/api/admin/storage-retention"] });
    },
    onError: (e: Error) => toast({ title: "Sweep failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm px-4 py-8">Could not load retention status.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage &amp; retention</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Behavior sessions and draft funnel uploads default to{" "}
            <span className="font-medium text-foreground">{data.policy.retentionDays} days</span> before soft-delete.
            Rows marked important or archived are skipped. After{" "}
            <span className="font-medium text-foreground">{data.policy.purgeGraceDays} days</span> in trash, data is
            permanently removed (funnel files deleted from disk). Configure with{" "}
            <code className="text-xs bg-muted px-1 rounded">ASCENDRA_RETENTION_DAYS</code> and{" "}
            <code className="text-xs bg-muted px-1 rounded">ASCENDRA_RETENTION_PURGE_GRACE_DAYS</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={runSweep.isPending}
            onClick={() => runSweep.mutate()}
          >
            {runSweep.isPending ?
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : null}
            Run sweep now
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/behavior-intelligence/visitors">Visitors</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Behavior sessions in trash</CardTitle>
          <CardDescription>Restore clears soft-delete; replays and visitor rows reappear in admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.behaviorTrash.length === 0 ?
            <p className="text-sm text-muted-foreground">No trashed behavior sessions.</p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Trashed</TableHead>
                  <TableHead className="text-right">Restore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.behaviorTrash.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">{r.sessionId}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{r.startTime}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{r.softDeletedAt}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={restore.isPending}
                        onClick={() =>
                          restore.mutate({ kind: "behavior_session", sessionId: r.sessionId })
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draft funnel assets in trash</CardTitle>
          <CardDescription>Only draft assets are auto-trashed. Published files are never swept by this job.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.funnelTrash.length === 0 ?
            <p className="text-sm text-muted-foreground">No trashed funnel assets.</p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trashed</TableHead>
                  <TableHead className="text-right">Restore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.funnelTrash.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[240px] truncate">{r.title}</TableCell>
                    <TableCell className="text-xs">{r.status}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{r.softDeletedAt}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={restore.isPending}
                        onClick={() => restore.mutate({ kind: "funnel_asset", id: r.id })}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </div>
  );
}
