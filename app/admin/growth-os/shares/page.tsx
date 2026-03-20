"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileKey } from "lucide-react";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";

export default function GrowthOsSharesPage() {
  const { toast } = useToast();
  const [resourceType, setResourceType] = useState("growth_diagnosis");
  const [resourceId, setResourceId] = useState("demo-report");
  const [summaryJson, setSummaryJson] = useState(
    JSON.stringify({ headline: "Summary only", topActions: ["A", "B"] }, null, 2),
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [lastToken, setLastToken] = useState<string | null>(null);

  const createShare = useMutation({
    mutationFn: async () => {
      let summaryPayload: Record<string, unknown>;
      try {
        summaryPayload = JSON.parse(summaryJson) as Record<string, unknown>;
      } catch {
        throw new Error("Summary must be valid JSON");
      }
      const res = await apiRequest("POST", "/api/admin/growth-os/client-shares", {
        resourceType,
        resourceId,
        summaryPayload,
        expiresAt: expiresAt.trim() || null,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed");
      }
      return res.json() as Promise<{
        token: string;
        id: number;
        message: string;
        pageUrl?: string;
        apiUrl?: string;
      }>;
    },
    onSuccess: (out) => {
      setLastToken(out.token);
      toast({
        title: "Share created",
        description: "Copy the token now — it is not shown again.",
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileKey className="h-5 w-5" />
            Client-safe report shares
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <VisibilityBadge tier="client_visible" />
            Creates a token linked to a <strong>sanitized</strong> JSON payload. Forbidden internal keys are
            stripped server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <Label>Resource type</Label>
            <Input value={resourceType} onChange={(e) => setResourceType(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Resource id</Label>
            <Input value={resourceId} onChange={(e) => setResourceId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Summary JSON (sanitized fields only)</Label>
            <Textarea
              value={summaryJson}
              onChange={(e) => setSummaryJson(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label>Expires at (optional ISO date)</Label>
            <Input
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              placeholder="e.g. 2026-12-31T23:59:59.000Z"
            />
          </div>
          <Button onClick={() => createShare.mutate()} disabled={createShare.isPending}>
            {createShare.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate share token
          </Button>
          {lastToken && (
            <div className="space-y-2">
              <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all border border-border">
                <span className="text-muted-foreground block mb-1">Last token (copy now)</span>
                {lastToken}
              </div>
              <p className="text-sm text-muted-foreground">
                Client-friendly page:{" "}
                <a
                  className="text-primary underline font-medium break-all"
                  href={`/gos/report/${encodeURIComponent(lastToken)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  /gos/report/…
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
