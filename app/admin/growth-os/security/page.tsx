"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";

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
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/growth-os/audit", 40],
    queryFn: async () => {
      const res = await fetch("/api/admin/growth-os/audit?limit=40", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load audit log");
      return res.json() as Promise<{ events: AuditEvent[] }>;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Growth OS audit trail
          </CardTitle>
          <CardDescription>
            Security-scoped events (shares, visibility changes, internal notes). This is not a full application
            audit log.
          </CardDescription>
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
              <p className="font-medium text-foreground mb-1">No events yet</p>
              <p>Create an internal note or client share from the Overview to populate this list.</p>
            </div>
          )}
          {!isLoading && data && data.events.length > 0 && (
            <ul className="space-y-2 text-sm">
              {data.events.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-lg border border-border/60 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="font-medium text-foreground">{ev.action}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {ev.resourceType ?? "—"} / {ev.resourceId ?? "—"} · actor {ev.actorUserId ?? "—"}
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
