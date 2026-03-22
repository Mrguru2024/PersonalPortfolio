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
import { Loader2, FileKey, RotateCcw } from "lucide-react";
import { VisibilityBadge } from "@/components/growth-os/VisibilityBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SHARE_RESOURCE_PRESETS, presetByValue } from "@/lib/growth-os/friendlyCopy";

const SAMPLE_SUMMARY = {
  headline: "Q1 growth snapshot",
  topActions: ["Refresh homepage hero", "Publish two case studies", "Enable email nurture"],
  summaryForClient:
    "We recommend focusing on proof and follow-up; full internal scores are not included here.",
};

const PRESET_VALUES = new Set(SHARE_RESOURCE_PRESETS.map((p) => p.value));

export default function GrowthOsSharesPage() {
  const { toast } = useToast();
  const [resourceType, setResourceType] = useState("growth_diagnosis");
  const [resourceId, setResourceId] = useState("client-acme-jan");
  const [summaryJson, setSummaryJson] = useState(JSON.stringify(SAMPLE_SUMMARY, null, 2));
  const [expiresAt, setExpiresAt] = useState("");
  const [lastToken, setLastToken] = useState<string | null>(null);

  const kindSelectValue = PRESET_VALUES.has(resourceType) ? resourceType : "custom";

  const createShare = useMutation({
    mutationFn: async () => {
      let summaryPayload: Record<string, unknown>;
      try {
        summaryPayload = JSON.parse(summaryJson) as Record<string, unknown>;
      } catch {
        throw new Error("Summary must be valid JSON — check commas and quotes.");
      }
      const res = await apiRequest("POST", "/api/admin/growth-os/client-shares", {
        resourceType: resourceType.trim(),
        resourceId: resourceId.trim(),
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
        title: "Share link created",
        description: "Copy the token now — it will not be shown again.",
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>How client shares work</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-muted-foreground">
          <p>
            You pick <strong className="text-foreground">what the share is about</strong> (type + id) and paste a{" "}
            <strong className="text-foreground">short JSON summary</strong>. The server removes sensitive keys
            before storing. Your customer opens a simple page with only that safe payload.
          </p>
          <p className="text-xs">
            Tip: keep fields like headlines, bullet actions, and short blurbs — avoid internal scores or raw AI
            dumps.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileKey className="h-5 w-5" />
            Build a client-safe link
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <VisibilityBadge tier="client_visible" />
            Creates a token linked to a <strong>sanitized</strong> summary. Forbidden internal keys are removed
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSummaryJson(JSON.stringify(SAMPLE_SUMMARY, null, 2))}
            >
              Load friendly example JSON
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setResourceType("growth_diagnosis");
                setResourceId("client-acme-jan");
                setExpiresAt("");
                setLastToken(null);
                toast({ title: "Form cleared to defaults" });
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset form
            </Button>
          </div>

          <div className="space-y-1">
            <Label htmlFor="share-kind">What is this share about?</Label>
            <Select
              value={kindSelectValue}
              onValueChange={(v) => {
                if (v === "custom") {
                  setResourceType((prev) => (PRESET_VALUES.has(prev) ? "" : prev));
                } else {
                  setResourceType(v);
                  const p = presetByValue(SHARE_RESOURCE_PRESETS, v);
                  if (p) setResourceId(p.exampleId);
                }
              }}
            >
              <SelectTrigger id="share-kind">
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {SHARE_RESOURCE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Other… (type below)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {presetByValue(SHARE_RESOURCE_PRESETS, resourceType)?.hint ??
                "Choose a preset or enter your own category name for records."}
            </p>
          </div>

          {!PRESET_VALUES.has(resourceType) ? (
            <div className="space-y-1">
              <Label htmlFor="share-type-custom">Custom category</Label>
              <Input
                id="share-type-custom"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                placeholder="e.g. growth_report"
                autoComplete="off"
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="share-res-id">Record id</Label>
            <Input
              id="share-res-id"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              placeholder={
                presetByValue(SHARE_RESOURCE_PRESETS, resourceType)?.exampleId
                  ? `e.g. ${presetByValue(SHARE_RESOURCE_PRESETS, resourceType)!.exampleId}`
                  : "e.g. client-acme-jan"
              }
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Should match the id of the diagnosis, report, or audit you are summarizing.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="share-json">Summary (JSON)</Label>
            <Textarea
              id="share-json"
              value={summaryJson}
              onChange={(e) => setSummaryJson(e.target.value)}
              rows={10}
              className="font-mono text-xs"
              placeholder='{ "headline": "…", "topActions": ["…"] }'
            />
            <p className="text-xs text-muted-foreground">
              Use the example button above if you are unsure — edit the text fields inside the JSON to match your
              client-facing wording.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="share-expires">Link expiry (optional)</Label>
            <Input
              id="share-expires"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              placeholder="2026-12-31T23:59:59.000Z"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Leave blank for no automatic expiry (if your policy allows).</p>
          </div>

          <Button
            onClick={() => createShare.mutate()}
            disabled={createShare.isPending || !resourceType.trim() || !resourceId.trim()}
          >
            {createShare.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate share link
          </Button>

          {lastToken && (
            <div className="space-y-2">
              <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all border border-border">
                <span className="text-muted-foreground block mb-1">Token — copy now</span>
                {lastToken}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(lastToken);
                    toast({ title: "Copied", description: "Token copied to clipboard." });
                  }}
                >
                  Copy token
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/gos/report/${encodeURIComponent(lastToken)}`;
                    void navigator.clipboard.writeText(url);
                    toast({ title: "Copied", description: "Full page URL copied." });
                  }}
                >
                  Copy page URL
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Client page:{" "}
                <a
                  className="text-primary underline font-medium break-all"
                  href={`/gos/report/${encodeURIComponent(lastToken)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in new tab
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
