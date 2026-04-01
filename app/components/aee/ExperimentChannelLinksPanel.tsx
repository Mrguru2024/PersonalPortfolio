"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

type PpcCampaign = { id: number; name: string; platform: string };

type ChannelLinkRow = {
  id: number;
  channelType: string;
  landingPath: string | null;
  ppcCampaignId: number | null;
  commCampaignId: number | null;
  variantId: number | null;
  notes: string | null;
};

const CHANNEL_OPTIONS = ["google_ads", "meta", "email", "web", "social_organic", "other"] as const;

export function ExperimentChannelLinksPanel({
  experimentId,
  variants,
}: {
  experimentId: number;
  variants: Array<{ id: number; key: string; name: string }>;
}) {
  const qc = useQueryClient();
  const [channelType, setChannelType] = useState<string>("google_ads");
  const [ppcCampaignId, setPpcCampaignId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("any");
  const [landingPath, setLandingPath] = useState("");
  const [notes, setNotes] = useState("");
  const needsPpc = channelType === "google_ads" || channelType === "meta";

  const { data: campaigns } = useQuery({
    queryKey: ["/api/admin/paid-growth/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paid-growth/campaigns");
      return res.json() as Promise<PpcCampaign[]>;
    },
  });

  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: ["/api/admin/experiments", experimentId, "channel-links"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/experiments/${experimentId}/channel-links`);
      return res.json() as Promise<{ links: ChannelLinkRow[] }>;
    },
  });

  const addLink = useMutation({
    mutationFn: async () => {
      const pid = ppcCampaignId ? Number.parseInt(ppcCampaignId, 10) : null;
      const vid = variantId === "any" ? null : Number.parseInt(variantId, 10);
      const res = await apiRequest("POST", `/api/admin/experiments/${experimentId}/channel-links`, {
        channelType,
        ppcCampaignId: Number.isFinite(pid as number) ? pid : null,
        variantId: Number.isFinite(vid as number) ? vid : null,
        landingPath: landingPath.trim() || null,
        notes: notes.trim() || null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/experiments", experimentId, "channel-links"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/experiments", experimentId] });
      setNotes("");
    },
  });

  const removeLink = useMutation({
    mutationFn: async (linkId: number) => {
      await apiRequest("DELETE", `/api/admin/experiments/${experimentId}/channel-links/${linkId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/experiments", experimentId, "channel-links"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/experiments", experimentId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Channel links</CardTitle>
        <CardDescription>
          Tie this experiment to a PPC campaign so rollup can merge <code className="text-xs">ppc_performance_snapshots</code>{" "}
          (spend, impressions, clicks) into daily metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:[&>*]:max-w-full">
          <div>
            <Label>Channel</Label>
            <Select value={channelType} onValueChange={setChannelType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>PPC campaign</Label>
            <Select value={ppcCampaignId || undefined} onValueChange={(v) => setPpcCampaignId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {(campaigns ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Variant (optional)</Label>
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Split by allocation weights</SelectItem>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Landing path (optional)</Label>
            <Input value={landingPath} onChange={(e) => setLandingPath(e.target.value)} placeholder="/page" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal note" />
          </div>
        </div>
        <Button
          type="button"
          onClick={() => addLink.mutate()}
          disabled={addLink.isPending || (needsPpc && !ppcCampaignId)}
        >
          {addLink.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Add channel link
        </Button>

        <div>
          <h4 className="text-sm font-medium mb-2">Linked</h4>
          {linksLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !links?.links?.length ? (
            <p className="text-sm text-muted-foreground">No links yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {links.links.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-2">
                  <span>
                    <strong>{l.channelType}</strong>
                    {l.ppcCampaignId != null ? ` · PPC #${l.ppcCampaignId}` : ""}
                    {l.variantId != null ? ` · variant #${l.variantId}` : ""}
                    {l.landingPath ? ` · ${l.landingPath}` : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={removeLink.isPending}
                    onClick={() => removeLink.mutate(l.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExperimentRollupActions({ experimentId }: { experimentId: number }) {
  const qc = useQueryClient();
  const rollup = useMutation({
    mutationFn: async () => {
      const to = new Date();
      const from = new Date(to.getTime() - 14 * 86_400_000);
      const res = await apiRequest("POST", "/api/admin/experiments/rollup", {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/experiments", String(experimentId)] });
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={rollup.isPending} onClick={() => rollup.mutate()}>
        {rollup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
        Recompute metrics (14d)
      </Button>
      {rollup.isError ? <span className="text-xs text-destructive">Rollup failed</span> : null}
      {rollup.isSuccess ? (
        <span className="text-xs text-muted-foreground">
          Inserted {rollup.data?.rowsInserted ?? 0} rows ({rollup.data?.visitorRowsScanned ?? 0} visitor rows scanned)
        </span>
      ) : null}
    </div>
  );
}
