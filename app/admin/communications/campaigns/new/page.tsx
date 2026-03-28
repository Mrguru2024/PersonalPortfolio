"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMM_CAMPAIGN_TYPES, type CommSegmentFilters } from "@shared/communicationsSchema";
import { CommAudienceSegmentBuilder } from "@/components/communications/CommAudienceSegmentBuilder";

const DEFAULT_SEGMENT: CommSegmentFilters = {
  status: "new",
  excludeDoNotContact: true,
};

export default function NewCommCampaignPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuperUser = isAuthSuperUser(user);
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [emailDesignId, setEmailDesignId] = useState<string>("");
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [variantEmailDesignId, setVariantEmailDesignId] = useState<string>("");
  const [abVariantBPercent, setAbVariantBPercent] = useState("50");
  const [organizationIdText, setOrganizationIdText] = useState("");
  const [campaignType, setCampaignType] = useState("one_time");
  const [segmentFilters, setSegmentFilters] = useState<CommSegmentFilters>(DEFAULT_SEGMENT);
  const [savedListId, setSavedListId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: designs = [], isLoading: dLoading } = useQuery({
    queryKey: ["/api/admin/communications/designs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/designs");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ id: number; name: string }[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: savedLists = [] } = useQuery({
    queryKey: ["/api/admin/crm/saved-lists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/saved-lists");
      if (!res.ok) return [];
      return res.json() as Promise<{ id: number; name: string }[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/communications/audience-preview", {
        segmentFilters,
        savedListId: savedListId ? Number(savedListId) : undefined,
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const orgTrim = organizationIdText.trim();
      const organizationId =
        orgTrim === "" ? undefined : Number.isFinite(Number(orgTrim)) ? Number(orgTrim) : undefined;
      if (orgTrim !== "" && organizationId === undefined) {
        throw new Error("Organization must be a number");
      }
      const res = await apiRequest("POST", "/api/admin/communications/campaigns", {
        name,
        emailDesignId: Number(emailDesignId),
        campaignType,
        segmentFilters,
        savedListId: savedListId ? Number(savedListId) : undefined,
        abTestEnabled,
        variantEmailDesignId: abTestEnabled ? Number(variantEmailDesignId) : undefined,
        abVariantBPercent: abTestEnabled ? Number(abVariantBPercent) : undefined,
        organizationId,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        notes: notes || undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      return res.json() as Promise<{ id: number }>;
    },
    onSuccess: (row) => {
      toast({ title: "Campaign created" });
      router.push(`/admin/communications/campaigns/${row.id}`);
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

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/communications/campaigns">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Campaigns
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New campaign</CardTitle>
          <CardDescription>
            Choose who receives this send with the audience rules below. At least one rule is required before you send.
            The optional link tagging at the bottom labels tracked links for reports—it does not narrow the list unless you
            also add matching UTM rules in the audience section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q1 re-engagement — Marcus" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email design</Label>
              <Select value={emailDesignId} onValueChange={setEmailDesignId} disabled={dLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={dLoading ? "Loading…" : "Select design"} />
                </SelectTrigger>
                <SelectContent>
                  {designs.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMM_CAMPAIGN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
            <Checkbox
              id="ab-enabled"
              checked={abTestEnabled}
              onCheckedChange={(v) => setAbTestEnabled(v === true)}
            />
            <Label htmlFor="ab-enabled" className="cursor-pointer font-medium">
              A/B test (variant design)
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
                      .filter((d) => String(d.id) !== emailDesignId)
                      .map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>% of recipients on variant B</Label>
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
                placeholder="Multi-tenant — leave blank for default"
                inputMode="numeric"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Audience</Label>
            <p className="text-sm text-muted-foreground">
              Choose everyone in the CRM, filter by segment (status, tags, pipeline, etc.), hand-pick specific contacts,
              add one-off email addresses, or use only a pasted list — same pattern as other CRM sends. Use Preview
              audience to confirm count before you send.
            </p>
            <CommAudienceSegmentBuilder
              value={segmentFilters}
              onChange={setSegmentFilters}
              savedListId={savedListId}
              onSavedListIdChange={setSavedListId}
              savedLists={savedLists}
            />
          </div>

          <Button type="button" variant="secondary" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
            Preview audience
          </Button>

          <div className="rounded-md border border-dashed border-border p-4 space-y-2">
            <p className="text-sm font-medium">Link tagging (optional)</p>
            <p className="text-xs text-muted-foreground">Stored on the campaign for analytics on tracked links in the email.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>UTM source</Label>
                <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UTM medium</Label>
                <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UTM campaign</Label>
                <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Internal notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              !name.trim() ||
              !emailDesignId ||
              (abTestEnabled && (!variantEmailDesignId || !Number.isFinite(Number(abVariantBPercent)))) ||
              saveMutation.isPending
            }
          >
            <Save className="h-4 w-4 mr-2" />
            Create campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
