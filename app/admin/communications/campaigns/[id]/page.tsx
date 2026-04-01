"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { describeCommSegmentFilters } from "@/lib/describe-comm-segment-filters";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { CommAudienceSegmentBuilder } from "@/components/communications/CommAudienceSegmentBuilder";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";

const DEFAULT_SEGMENT: CommSegmentFilters = {
  status: "new",
  excludeDoNotContact: true,
};

function mergeSegmentFilters(raw: Record<string, unknown> | null | undefined): CommSegmentFilters {
  return { ...DEFAULT_SEGMENT, ...(raw as CommSegmentFilters) };
}

type CampaignDetail = {
  id: number;
  name: string;
  status: string;
  campaignType: string;
  savedListId: number | null;
  segmentFilters: Record<string, unknown>;
  sentCount: number | null;
  openedCount: number | null;
  clickedCount: number | null;
  failedCount: number | null;
  totalRecipients: number | null;
  sentAt: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  abTestEnabled: boolean | null;
  abVariantBPercent: number | null;
  variantEmailDesignId: number | null;
  organizationId: number | null;
  design: { id: number; name: string; subject: string } | null;
  variantDesign: { id: number; name: string; subject: string } | null;
  sends: {
    id: number;
    recipientEmail: string;
    status: string;
    sentAt: string | null;
    abVariant: string | null;
    firstClickedBlockId: string | null;
  }[];
};

export default function CommCampaignDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuperUser = isAuthSuperUser(user);
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { toast } = useToast();
  const qc = useQueryClient();

  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [variantEmailDesignId, setVariantEmailDesignId] = useState<string>("");
  const [abVariantBPercent, setAbVariantBPercent] = useState("50");
  const [organizationIdText, setOrganizationIdText] = useState("");
  const [segmentFilters, setSegmentFilters] = useState<CommSegmentFilters>(DEFAULT_SEGMENT);
  const [savedListId, setSavedListId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: c, isLoading } = useQuery({
    queryKey: ["/api/admin/communications/campaigns", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/communications/campaigns/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<CampaignDetail>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  useEffect(() => {
    if (!c) return;
    setAbTestEnabled(!!c.abTestEnabled);
    setVariantEmailDesignId(c.variantEmailDesignId != null ? String(c.variantEmailDesignId) : "");
    setAbVariantBPercent(String(c.abVariantBPercent ?? 50));
    setOrganizationIdText(
      c.organizationId != null && Number.isFinite(c.organizationId) ? String(c.organizationId) : ""
    );
    setSegmentFilters(mergeSegmentFilters(c.segmentFilters));
    setSavedListId(c.savedListId != null && Number.isFinite(c.savedListId) ? String(c.savedListId) : "");
  }, [c]);

  const { data: designs = [], isLoading: dLoading } = useQuery({
    queryKey: ["/api/admin/communications/designs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/designs");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ id: number; name: string }[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!c && c.status === "draft",
  });

  const { data: savedLists = [] } = useQuery({
    queryKey: ["/api/admin/crm/saved-lists", "comm-campaign-detail"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/saved-lists");
      if (!res.ok) return [];
      return res.json() as Promise<{ id: number; name: string }[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!c && c.status === "draft",
  });

  const previewAudienceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/communications/audience-preview", {
        segmentFilters,
        savedListId: savedListId.trim() ? Number(savedListId) : undefined,
      });
      if (!res.ok) throw new Error("Preview failed");
      return res.json() as Promise<{ count: number; sample: { id: number; email: string; name: string }[] }>;
    },
    onSuccess: (d) => {
      toast({
        title: "Audience preview",
        descriptionKey: "communications.audiencePreviewDescription",
        values: { count: String(d.count) },
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const primaryId = c?.design?.id;
      const body: Record<string, unknown> = {
        segmentFilters,
        savedListId: savedListId.trim() ? Number(savedListId) : null,
        abTestEnabled,
        abVariantBPercent: Number(abVariantBPercent),
        variantEmailDesignId: abTestEnabled ? Number(variantEmailDesignId) : null,
      };
      if (isSuperUser) {
        const orgTrim = organizationIdText.trim();
        const organizationId =
          orgTrim === "" ? null : Number.isFinite(Number(orgTrim)) ? Number(orgTrim) : NaN;
        if (orgTrim !== "" && !Number.isFinite(organizationId)) {
          throw new Error("Organization must be a number");
        }
        body.organizationId = orgTrim === "" ? null : organizationId;
      }
      if (abTestEnabled) {
        if (!variantEmailDesignId || Number(variantEmailDesignId) === primaryId) {
          throw new Error("Pick a variant design different from the primary");
        }
      }
      const res = await apiRequest("PATCH", `/api/admin/communications/campaigns/${id}`, body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Campaign saved", description: "Audience and settings were updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns", id] });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/communications/campaigns/${id}/send`, {});
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Send failed");
      }
      return res.json() as Promise<{ sent: number; failed: number }>;
    },
    onSuccess: (r) => {
      toast({
        title: "Send complete",
        descriptionKey: "communications.sendCompleteDescription",
        values: { sent: String(r.sent), failed: String(r.failed) },
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns", id] });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/campaigns"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/analytics"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !c) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canSend = c.status !== "sending" && c.status !== "sent";
  const primaryDesignId = c.design?.id;

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/communications/campaigns">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Campaigns
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{c.name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge>{c.status}</Badge>
            <Badge variant="outline">{c.campaignType.replace(/_/g, " ")}</Badge>
            {c.abTestEnabled && <Badge variant="secondary">A/B</Badge>}
          </div>
        </div>
        <Button onClick={() => sendMutation.mutate()} disabled={!canSend || sendMutation.isPending} className="gap-2">
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send now
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Design</CardTitle>
          <CardDescription>
            {c.design ? (
              <>
                <span className="font-medium text-foreground">A (primary):</span> {c.design.name} — {c.design.subject}
                <Link className="block text-primary underline mt-1 text-sm" href={`/admin/communications/designs/${c.design.id}`}>
                  Edit primary design
                </Link>
              </>
            ) : (
              "Missing design"
            )}
            {c.abTestEnabled && c.variantDesign && (
              <span className="block mt-3">
                <span className="font-medium text-foreground">B (variant):</span> {c.variantDesign.name} — {c.variantDesign.subject}
                <Link
                  className="block text-primary underline mt-1 text-sm"
                  href={`/admin/communications/designs/${c.variantDesign.id}`}
                >
                  Edit variant design
                </Link>
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {c.status === "draft" && (
        <Card>
          <CardHeader>
            <CardTitle>Audience</CardTitle>
            <CardDescription>
              Same choices as other CRM workflows: all contacts, segment rules, selected people, extra emails, or
              email-only list. Use Preview audience for the match count, then save. Audience locks after send.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CommAudienceSegmentBuilder
              value={segmentFilters}
              onChange={setSegmentFilters}
              savedListId={savedListId}
              onSavedListIdChange={setSavedListId}
              savedLists={savedLists}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => previewAudienceMutation.mutate()}
              disabled={previewAudienceMutation.isPending}
            >
              {previewAudienceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Preview audience
            </Button>
          </CardContent>
        </Card>
      )}

      {c.status === "draft" && (
        <Card>
          <CardHeader>
            <CardTitle>A/B & organization</CardTitle>
            <CardDescription>Editable while the campaign is in draft. Save before sending.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox
                id="detail-ab"
                checked={abTestEnabled}
                onCheckedChange={(v) => setAbTestEnabled(v === true)}
              />
              <Label htmlFor="detail-ab" className="cursor-pointer font-medium">
                A/B test enabled
              </Label>
            </div>
            {abTestEnabled && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Variant B design</Label>
                  <Select value={variantEmailDesignId} onValueChange={setVariantEmailDesignId} disabled={dLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={dLoading ? "Loading…" : "Select variant"} />
                    </SelectTrigger>
                    <SelectContent>
                      {designs
                        .filter((d) => d.id !== primaryDesignId)
                        .map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>% recipients on B</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={abVariantBPercent}
                    onChange={(e) => setAbVariantBPercent(e.target.value)}
                  />
                </div>
              </div>
            )}
            {isSuperUser ? (
              <div className="space-y-2">
                <Label>Organization ID (optional)</Label>
                <Input
                  value={organizationIdText}
                  onChange={(e) => setOrganizationIdText(e.target.value)}
                  inputMode="numeric"
                />
              </div>
            ) : null}
            <Button
              type="button"
              onClick={() => saveSettingsMutation.mutate()}
              disabled={
                saveSettingsMutation.isPending ||
                (abTestEnabled &&
                  (!variantEmailDesignId || Number(variantEmailDesignId) === primaryDesignId || !Number.isFinite(Number(abVariantBPercent))))
              }
            >
              {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save audience and settings
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Recipients {c.totalRecipients ?? 0} · Sent {c.sentCount ?? 0} · Failed {c.failedCount ?? 0} · Opens{" "}
            {c.openedCount ?? 0} · Clicks {c.clickedCount ?? 0}
            {c.sentAt && (
              <span className="block text-xs mt-1">Last send: {formatLocaleMediumDateTime(c.sentAt)}</span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link tagging (UTM)</CardTitle>
          <CardDescription>
            {c.utmSource || c.utmMedium || c.utmCampaign
              ? `${c.utmSource ?? "—"} / ${c.utmMedium ?? "—"} / ${c.utmCampaign ?? "—"}`
              : isSuperUser
                ? "None set. Can be added via API if needed."
                : "None set."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.status === "draft" ? "Audience summary" : "Audience"}</CardTitle>
          <CardDescription>
            {c.status === "draft" ?
              "Current saved rules (update the form above, then save)."
            : "How recipients were selected for this campaign."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc pl-5 text-sm space-y-1 text-foreground">
            {describeCommSegmentFilters(
              (c.status === "draft" ? segmentFilters : c.segmentFilters) as Record<string, unknown>,
            ).map((line, i) => (
              <li key={`${i}-${line.slice(0, 48)}`}>{line}</li>
            ))}
          </ul>
          {isSuperUser ? (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical details (site owner)
              </summary>
              <pre className="mt-2 bg-muted p-3 rounded-md overflow-x-auto text-[11px]">
                {JSON.stringify(c.status === "draft" ? segmentFilters : c.segmentFilters, null, 2)}
              </pre>
            </details>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send log</CardTitle>
          <CardDescription>
            One row per recipient. Shows A/B version and whether they clicked a tracked link in the email.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">A/B</th>
                <th className="py-2 pr-4">{isSuperUser ? "First link (internal ref)" : "Clicked link"}</th>
                <th className="py-2">Sent</th>
              </tr>
            </thead>
            <tbody>
              {c.sends.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    No sends yet.
                  </td>
                </tr>
              ) : (
                c.sends.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 pr-4">{s.recipientEmail}</td>
                    <td className="py-2 pr-4">{s.status}</td>
                    <td className="py-2 pr-4 tabular-nums">{s.abVariant ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {isSuperUser ? (s.firstClickedBlockId ?? "—") : s.firstClickedBlockId ? "Yes" : "—"}
                    </td>
                    <td className="py-2 text-muted-foreground">{s.sentAt ? formatLocaleMediumDateTime(s.sentAt) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
