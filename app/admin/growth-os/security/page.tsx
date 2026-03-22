"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, RefreshCw } from "lucide-react";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  formatGosAuditAction,
  labelForStoredResourceType,
} from "@/lib/growth-os/friendlyCopy";

interface AuditEvent {
  id: number;
  actorUserId: number | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  visibilityContext: string | null;
  createdAt: string;
}

export default function GrowthOsSecurityPage() {
  const { toast } = useToast();
  const [limit, setLimit] = useState(40);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["/api/admin/growth-os/audit", limit],
    queryFn: async () => {
      const res = await fetch(`/api/admin/growth-os/audit?limit=${limit}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load activity log");
      return res.json() as Promise<{ events: AuditEvent[] }>;
    },
  });

  const refresh = async () => {
    await refetch();
    toast({ title: "Refreshed" });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>What this log shows</AlertTitle>
        <AlertDescription className="mt-2 text-muted-foreground space-y-2">
          <p>
            Only <strong className="text-foreground">Growth OS</strong> actions appear here — client shares,
            team notes, visibility changes, and public opens of a share link. It is not a full site-wide audit.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="space-y-4 sm:flex sm:flex-row sm:items-start sm:justify-between sm:space-y-0 gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Activity &amp; privacy log
            </CardTitle>
            <CardDescription>
              Recent security-related events. Use the row details if you need to trace a share or override.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="audit-limit" className="text-xs">
                Rows
              </Label>
              <Select
                value={String(limit)}
                onValueChange={(v) => setLimit(Number.parseInt(v, 10))}
              >
                <SelectTrigger id="audit-limit" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="80">80</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Error"}
            </p>
          )}
          {!isLoading && !error && (data?.events?.length ?? 0) === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p className="font-medium text-foreground mb-1">Nothing here yet</p>
              <p>
                Create a team note or client share from <strong className="text-foreground">Overview</strong> or{" "}
                <strong className="text-foreground">Client shares</strong> to see entries.
              </p>
            </div>
          )}
          {!isLoading && data && data.events.length > 0 && (
            <ul className="space-y-2 text-sm">
              {data.events.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-lg border border-border/60 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{formatGosAuditAction(ev.action)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-foreground/90">
                        {labelForStoredResourceType(ev.resourceType)}
                      </span>
                      {ev.resourceId != null && ev.resourceId !== "" ? (
                        <>
                          {" "}
                          · id <span className="font-mono text-foreground/80">{ev.resourceId}</span>
                        </>
                      ) : null}
                      {ev.actorUserId != null ? (
                        <> · team user #{ev.actorUserId}</>
                      ) : (
                        <> · visitor or system</>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ev.createdAt}</div>
                  </div>
                  {ev.visibilityContext ? (
                    <VisibilityBadge tier={ev.visibilityContext} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
