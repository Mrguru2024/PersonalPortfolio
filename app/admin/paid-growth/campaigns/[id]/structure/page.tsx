"use client";

import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdGroup = { id: number; name: string; status: string };
type Keyword = { id: number; keywordText: string; matchType: string; isNegative: boolean };
type Destination = { id: number; kind: string; path: string; offerSlug: string | null; weight: number };
type CopyVariant = { id: number; label: string; copyAngle: string; isActive: boolean };

export default function PaidGrowthCampaignStructurePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = Number(params?.id);
  const qc = useQueryClient();
  const { toast } = useToast();

  const [agName, setAgName] = useState("");
  const [kwText, setKwText] = useState("");
  const [kwMatch, setKwMatch] = useState("phrase");
  const [kwNegative, setKwNegative] = useState(false);
  const [destPath, setDestPath] = useState("");
  const [destKind, setDestKind] = useState("primary");
  const [cvLabel, setCvLabel] = useState("");
  const [cvHeadline, setCvHeadline] = useState("");

  const [selectedAg, setSelectedAg] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: campaign } = useQuery({
    queryKey: ["/api/admin/paid-growth/campaigns", campaignId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/paid-growth/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { name: string };
    },
    enabled: !!user?.isAdmin && !!campaignId,
  });

  const { data: agData, isLoading: agLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/campaigns", campaignId, "ad-groups"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/paid-growth/campaigns/${campaignId}/ad-groups`);
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { adGroups: AdGroup[] };
    },
    enabled: !!user?.isAdmin && !!campaignId,
  });

  useEffect(() => {
    const ags = agData?.adGroups ?? [];
    if (selectedAg == null && ags.length > 0) setSelectedAg(ags[0].id);
  }, [agData?.adGroups, selectedAg]);

  const { data: kwData, isLoading: kwLoading } = useQuery({
    queryKey: ["/api/admin/paid-growth/ad-groups", selectedAg, "keywords"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/paid-growth/ad-groups/${selectedAg}/keywords`);
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { keywords: Keyword[] };
    },
    enabled: !!user?.isAdmin && selectedAg != null,
  });

  const { data: destData } = useQuery({
    queryKey: ["/api/admin/paid-growth/campaigns", campaignId, "destinations"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/paid-growth/campaigns/${campaignId}/destinations`);
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { destinations: Destination[] };
    },
    enabled: !!user?.isAdmin && !!campaignId,
  });

  const { data: cvData } = useQuery({
    queryKey: ["/api/admin/paid-growth/campaigns", campaignId, "copy-variants"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/paid-growth/campaigns/${campaignId}/copy-variants`);
      if (!res.ok) throw new Error("fail");
      return (await res.json()) as { variants: CopyVariant[] };
    },
    enabled: !!user?.isAdmin && !!campaignId,
  });

  const invalidateStructure = () => {
    void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", campaignId, "ad-groups"] });
    void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/ad-groups", selectedAg, "keywords"] });
    void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", campaignId, "destinations"] });
    void qc.invalidateQueries({ queryKey: ["/api/admin/paid-growth/campaigns", campaignId, "copy-variants"] });
  };

  const createAg = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/paid-growth/campaigns/${campaignId}/ad-groups`, {
        name: agName.trim(),
        status: "draft",
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      setAgName("");
      toast({ title: "Ad group created" });
      invalidateStructure();
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createKw = useMutation({
    mutationFn: async () => {
      if (selectedAg == null) throw new Error("no ag");
      const res = await apiRequest("POST", `/api/admin/paid-growth/ad-groups/${selectedAg}/keywords`, {
        keywordText: kwText.trim(),
        matchType: kwMatch,
        isNegative: kwNegative,
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      setKwText("");
      setKwNegative(false);
      toast({ title: "Keyword added" });
      invalidateStructure();
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createDest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/paid-growth/campaigns/${campaignId}/destinations`, {
        path: destPath.trim(),
        kind: destKind,
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      setDestPath("");
      toast({ title: "Destination added" });
      invalidateStructure();
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createCv = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/paid-growth/campaigns/${campaignId}/copy-variants`, {
        label: cvLabel.trim(),
        headlinesJson: cvHeadline.trim() ? [cvHeadline.trim()] : [],
        primaryTextsJson: [],
      });
      if (!res.ok) throw new Error("fail");
      return res.json();
    },
    onSuccess: () => {
      setCvLabel("");
      setCvHeadline("");
      toast({ title: "Copy set created" });
      invalidateStructure();
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const deleteKw = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/paid-growth/keywords/${id}`);
      if (!res.ok) throw new Error("fail");
    },
    onSuccess: () => {
      invalidateStructure();
    },
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const adGroups = agData?.adGroups ?? [];
  const keywords = kwData?.keywords ?? [];
  const destinations = destData?.destinations ?? [];
  const variants = cvData?.variants ?? [];

  return (
    <div className="space-y-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/paid-growth/campaigns/${campaignId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {campaign?.name ?? "Campaign"}
        </Link>
      </Button>

      <div>
        <h2 className="text-xl font-bold">Campaign structure</h2>
        <p className="text-sm text-muted-foreground">
          Search-style structure: ad groups, keywords (including negatives), funnel destinations, and modular copy sets. Sync
          to Google Ads remains a separate adapter when API credentials are live.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad groups</CardTitle>
          <CardDescription>Theme keywords by service or intent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {agLoading ?
              <Loader2 className="h-5 w-5 animate-spin" />
            : adGroups.map((g) => (
                <Button
                  key={g.id}
                  size="sm"
                  variant={selectedAg === g.id ? "default" : "outline"}
                  onClick={() => setSelectedAg(g.id)}
                >
                  {g.name}
                </Button>
              ))}
          </div>
          <div className="flex flex-wrap gap-2 items-end max-w-lg">
            <div className="flex-1 min-w-[12rem] space-y-1">
              <Label>New ad group name</Label>
              <Input value={agName} onChange={(e) => setAgName(e.target.value)} placeholder="e.g. Emergency HVAC" />
            </div>
            <Button onClick={() => createAg.mutate()} disabled={!agName.trim() || createAg.isPending}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>{selectedAg ? `Ad group #${selectedAg}` : "Select an ad group"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedAg ?
            <p className="text-sm text-muted-foreground">Create an ad group first.</p>
          : <>
              <div className="flex flex-wrap gap-2 items-end max-w-2xl">
                <div className="flex-1 min-w-[10rem] space-y-1">
                  <Label>Keyword</Label>
                  <Input value={kwText} onChange={(e) => setKwText(e.target.value)} />
                </div>
                <div className="w-32 space-y-1">
                  <Label>Match</Label>
                  <Select value={kwMatch} onValueChange={setKwMatch}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broad">Broad</SelectItem>
                      <SelectItem value="phrase">Phrase</SelectItem>
                      <SelectItem value="exact">Exact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input
                    type="checkbox"
                    checked={kwNegative}
                    onChange={(e) => setKwNegative(e.target.checked)}
                    className="rounded border-input"
                  />
                  Negative
                </label>
                <Button
                  onClick={() => createKw.mutate()}
                  disabled={!kwText.trim() || createKw.isPending}
                >
                  Add
                </Button>
              </div>
              <div className="text-sm space-y-2">
                {kwLoading ?
                  <Loader2 className="h-5 w-5 animate-spin" />
                : keywords.length === 0 ?
                  <p className="text-muted-foreground">No keywords yet.</p>
                : keywords.map((k) => (
                    <div key={k.id} className="flex justify-between gap-2 border-b border-border/40 py-1.5">
                      <span>
                        {k.isNegative ? <Badge variant="secondary">neg</Badge> : null} {k.keywordText}{" "}
                        <span className="text-muted-foreground text-xs">({k.matchType})</span>
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => deleteKw.mutate(k.id)}>
                        Remove
                      </Button>
                    </div>
                  ))
                }
              </div>
            </>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Landing destinations</CardTitle>
          <CardDescription>Primary, fallback, or variant paths — use with campaign UTMs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end max-w-2xl">
            <div className="flex-1 min-w-[12rem] space-y-1">
              <Label>Path</Label>
              <Input value={destPath} onChange={(e) => setDestPath(e.target.value)} placeholder="/your-funnel" />
            </div>
            <div className="w-36 space-y-1">
              <Label>Kind</Label>
              <Select value={destKind} onValueChange={setDestKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="fallback">Fallback</SelectItem>
                  <SelectItem value="variant">Variant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createDest.mutate()} disabled={!destPath.trim() || createDest.isPending}>
              Add
            </Button>
          </div>
          <ul className="text-sm space-y-1">
            {destinations.map((d) => (
              <li key={d.id}>
                <Badge variant="outline" className="mr-2">
                  {d.kind}
                </Badge>
                <code>{d.path}</code>
                {d.offerSlug ? <span className="text-muted-foreground text-xs ml-2">offer {d.offerSlug}</span> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Copy variants</CardTitle>
          <CardDescription>Modular headline / body sets for testing — extend via API for full arrays</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end max-w-2xl">
            <div className="flex-1 min-w-[10rem] space-y-1">
              <Label>Label</Label>
              <Input value={cvLabel} onChange={(e) => setCvLabel(e.target.value)} placeholder="Spring urgency" />
            </div>
            <div className="flex-1 min-w-[10rem] space-y-1">
              <Label>First headline</Label>
              <Input value={cvHeadline} onChange={(e) => setCvHeadline(e.target.value)} />
            </div>
            <Button onClick={() => createCv.mutate()} disabled={!cvLabel.trim() || createCv.isPending}>
              Add set
            </Button>
          </div>
          <ul className="text-sm space-y-1">
            {variants.map((v) => (
              <li key={v.id}>
                {v.label}{" "}
                <span className="text-muted-foreground text-xs">
                  ({v.copyAngle}) {v.isActive ? "" : "· inactive"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
