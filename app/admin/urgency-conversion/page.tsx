"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SurfaceRow = {
  id: number;
  surfaceKey: string;
  displayName: string;
  isActive: boolean;
  urgencyMode: string;
  scarcityMode: string;
  capacitySource: string;
  scarcityEngineConfigId: number | null;
  dailyCapacityMax: number | null;
  weeklyCapacityMax: number | null;
  countDisplayMode: string;
  batchEndsAt: string | null;
  dailyWindowEndLocal: string | null;
  timezone: string;
  prerequisiteSurfaceKey: string | null;
  earlyAccessLabel: string | null;
  qualificationFilterLabel: string | null;
  manualReviewLabel: string | null;
  proofTitle: string | null;
  proofBulletsJson: string[];
  lossTitle: string | null;
  lossBulletsJson: string[];
  defaultCtaVariantKey: string;
  growthExperimentKey: string | null;
  funnelSlugForScarcity: string | null;
  offerSlugForScarcity: string | null;
  leadMagnetSlugForScarcity: string | null;
  analyticsEnabled: boolean;
};

type DraftRow = SurfaceRow & { proofBulletsJsonText?: string; lossBulletsJsonText?: string };

type AnalyticsPayload = {
  viewsDay: number;
  viewsWeek: number;
  completionsDay: number;
  completionsWeek: number;
};

export default function UrgencyConversionAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [draft, setDraft] = useState<DraftRow | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [authLoading, router, user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/urgency-conversion", "analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/urgency-conversion?analytics=1");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        surfaces: SurfaceRow[];
        analyticsBySurface?: Record<string, AnalyticsPayload>;
      }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const surfaces = data?.surfaces ?? [];

  useEffect(() => {
    if (!selectedKey && surfaces.length > 0) {
      setSelectedKey(surfaces[0]!.surfaceKey);
    }
  }, [selectedKey, surfaces]);

  const selected = useMemo(
    () => surfaces.find((s) => s.surfaceKey === selectedKey) ?? null,
    [surfaces, selectedKey],
  );

  useEffect(() => {
    if (selected) {
      setDraft({
        ...selected,
        proofBulletsJsonText: (selected.proofBulletsJson ?? []).join("\n"),
        lossBulletsJsonText: (selected.lossBulletsJson ?? []).join("\n"),
      });
    }
  }, [selected]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/urgency-conversion/seed", {});
      if (!res.ok) throw new Error("Seed failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Defaults ensured", description: "Starter rows inserted where missing." });
      void qc.invalidateQueries({ queryKey: ["/api/admin/urgency-conversion"] });
      void refetch();
    },
    onError: () => toast({ title: "Seed failed", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/admin/urgency-conversion", body);
      if (!res.ok) throw new Error("Save failed");
      return res.json() as Promise<{ warnings?: string[] }>;
    },
    onSuccess: (res) => {
      toast({
        title: "Saved",
        description:
          res.warnings?.length ? `Warnings: ${res.warnings.join(" · ")}` : "Urgency surface updated.",
      });
      void qc.invalidateQueries({ queryKey: ["/api/admin/urgency-conversion"] });
      void refetch();
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const analytics = data?.analyticsBySurface?.[selectedKey ?? ""];

  function handleSave() {
    if (!draft?.surfaceKey || !draft.displayName) {
      toast({ title: "Missing fields", description: "surfaceKey and displayName required.", variant: "destructive" });
      return;
    }
    const proofBulletsJson = (draft.proofBulletsJsonText ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const lossBulletsJson = (draft.lossBulletsJsonText ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    saveMutation.mutate({
      id: draft.id,
      surfaceKey: draft.surfaceKey,
      displayName: draft.displayName,
      isActive: draft.isActive,
      urgencyMode: draft.urgencyMode,
      scarcityMode: draft.scarcityMode,
      capacitySource: draft.capacitySource,
      scarcityEngineConfigId: draft.scarcityEngineConfigId,
      dailyCapacityMax: draft.dailyCapacityMax,
      weeklyCapacityMax: draft.weeklyCapacityMax,
      countDisplayMode: draft.countDisplayMode,
      batchEndsAt: draft.batchEndsAt,
      dailyWindowEndLocal: draft.dailyWindowEndLocal,
      timezone: draft.timezone,
      prerequisiteSurfaceKey: draft.prerequisiteSurfaceKey,
      earlyAccessLabel: draft.earlyAccessLabel,
      qualificationFilterLabel: draft.qualificationFilterLabel,
      manualReviewLabel: draft.manualReviewLabel,
      proofTitle: draft.proofTitle,
      proofBulletsJson,
      lossTitle: draft.lossTitle,
      lossBulletsJson,
      defaultCtaVariantKey: draft.defaultCtaVariantKey,
      growthExperimentKey: draft.growthExperimentKey,
      funnelSlugForScarcity: draft.funnelSlugForScarcity,
      offerSlugForScarcity: draft.offerSlugForScarcity,
      leadMagnetSlugForScarcity: draft.leadMagnetSlugForScarcity,
      analyticsEnabled: draft.analyticsEnabled,
    });
  }

  const d = draft;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/scarcity-engine">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Scarcity Engine
            </Link>
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Seed default surfaces
          </Button>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="h-10 w-10 text-primary shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Urgency &amp; Scarcity Manager</h1>
            <p className="text-muted-foreground mt-1 max-w-3xl text-sm sm:text-base">
              Honest urgency tied to real deadlines and capacity. Timers only render when a batch end or daily window is
              configured. For CRM-level intake caps, pair surfaces with the{" "}
              <Link href="/admin/scarcity-engine" className="text-primary underline underline-offset-2">
                Scarcity Engine
              </Link>
              .
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="border-rose-500/40">
            <CardHeader>
              <CardTitle>Failed to load</CardTitle>
              <CardDescription>Check database (run npm run db:push) and try again.</CardDescription>
            </CardHeader>
          </Card>
        ) : surfaces.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No surfaces</CardTitle>
              <CardDescription>Run “Seed default surfaces”, then enable each tool when ready.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Surfaces</CardTitle>
                <CardDescription>Lead magnets &amp; booking flows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select surface" />
                  </SelectTrigger>
                  <SelectContent>
                    {surfaces.map((s) => (
                      <SelectItem key={s.surfaceKey} value={s.surfaceKey}>
                        {s.displayName} {s.isActive ? "· on" : "· off"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {analytics ? (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border mt-2">
                    <div>Views today: {analytics.viewsDay}</div>
                    <div>Views week: {analytics.viewsWeek}</div>
                    <div>Completions today: {analytics.completionsDay}</div>
                    <div>Completions week: {analytics.completionsWeek}</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Edit “{d?.displayName ?? selectedKey}”</CardTitle>
                <CardDescription>Turn on only when copy and limits are accurate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {d ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label>Active</Label>
                        <p className="text-xs text-muted-foreground">Public pages show the zone only when active.</p>
                      </div>
                      <Switch
                        checked={d.isActive}
                        onCheckedChange={(v) => setDraft({ ...d, isActive: v })}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sk">surfaceKey</Label>
                        <Input id="sk" value={d.surfaceKey} disabled className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="dn">displayName</Label>
                        <Input
                          id="dn"
                          value={d.displayName}
                          className="mt-1"
                          onChange={(e) => setDraft({ ...d, displayName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Urgency mode</Label>
                        <Select
                          value={d.urgencyMode}
                          onValueChange={(v) => setDraft({ ...d, urgencyMode: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["none", "batch_close", "daily_window", "weekly_review", "results_unlock", "early_access"].map(
                              (m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Scarcity mode</Label>
                        <Select
                          value={d.scarcityMode}
                          onValueChange={(v) => setDraft({ ...d, scarcityMode: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "none",
                              "capacity",
                              "qualified_access",
                              "manual_review",
                              "beta_pilot",
                              "tool_unlock",
                            ].map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Capacity source</Label>
                        <Select
                          value={d.capacitySource}
                          onValueChange={(v) => setDraft({ ...d, capacitySource: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["none", "scarcity_engine", "daily_count", "weekly_count"].map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Count display</Label>
                        <Select
                          value={d.countDisplayMode}
                          onValueChange={(v) => setDraft({ ...d, countDisplayMode: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["exact", "approximate", "hidden"].map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dmax">dailyCapacityMax</Label>
                        <Input
                          id="dmax"
                          type="number"
                          className="mt-1"
                          value={d.dailyCapacityMax ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...d,
                              dailyCapacityMax: e.target.value ? parseInt(e.target.value, 10) : null,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="wmax">weeklyCapacityMax</Label>
                        <Input
                          id="wmax"
                          type="number"
                          className="mt-1"
                          value={d.weeklyCapacityMax ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...d,
                              weeklyCapacityMax: e.target.value ? parseInt(e.target.value, 10) : null,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="seid">scarcityEngineConfigId</Label>
                        <Input
                          id="seid"
                          type="number"
                          className="mt-1"
                          value={d.scarcityEngineConfigId ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...d,
                              scarcityEngineConfigId: e.target.value ? parseInt(e.target.value, 10) : null,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="batch">batchEndsAt (ISO)</Label>
                        <Input
                          id="batch"
                          className="mt-1"
                          placeholder="2026-04-15T21:00:00.000Z"
                          value={d.batchEndsAt ?? ""}
                          onChange={(e) => setDraft({ ...d, batchEndsAt: e.target.value || null })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dw">dailyWindowEndLocal (HH:mm)</Label>
                        <Input
                          id="dw"
                          className="mt-1"
                          placeholder="17:00"
                          value={d.dailyWindowEndLocal ?? ""}
                          onChange={(e) => setDraft({ ...d, dailyWindowEndLocal: e.target.value || null })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tz">timezone</Label>
                      <Input
                        id="tz"
                        className="mt-1"
                        value={d.timezone}
                        onChange={(e) => setDraft({ ...d, timezone: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="pre">prerequisiteSurfaceKey</Label>
                      <Input
                        id="pre"
                        className="mt-1"
                        placeholder="startup-growth-kit"
                        value={d.prerequisiteSurfaceKey ?? ""}
                        onChange={(e) => setDraft({ ...d, prerequisiteSurfaceKey: e.target.value || null })}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ea">earlyAccessLabel</Label>
                        <Input
                          id="ea"
                          className="mt-1"
                          value={d.earlyAccessLabel ?? ""}
                          onChange={(e) => setDraft({ ...d, earlyAccessLabel: e.target.value || null })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="qf">qualificationFilterLabel</Label>
                        <Input
                          id="qf"
                          className="mt-1"
                          value={d.qualificationFilterLabel ?? ""}
                          onChange={(e) => setDraft({ ...d, qualificationFilterLabel: e.target.value || null })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mr">manualReviewLabel</Label>
                      <Input
                        id="mr"
                        className="mt-1"
                        value={d.manualReviewLabel ?? ""}
                        onChange={(e) => setDraft({ ...d, manualReviewLabel: e.target.value || null })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ge">growthExperimentKey (A/B)</Label>
                      <Input
                        id="ge"
                        className="mt-1"
                        value={d.growthExperimentKey ?? ""}
                        onChange={(e) => setDraft({ ...d, growthExperimentKey: e.target.value || null })}
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="fs">funnelSlugForScarcity</Label>
                        <Input
                          id="fs"
                          className="mt-1"
                          value={d.funnelSlugForScarcity ?? ""}
                          onChange={(e) => setDraft({ ...d, funnelSlugForScarcity: e.target.value || null })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="os">offerSlugForScarcity</Label>
                        <Input
                          id="os"
                          className="mt-1"
                          value={d.offerSlugForScarcity ?? ""}
                          onChange={(e) => setDraft({ ...d, offerSlugForScarcity: e.target.value || null })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lm">leadMagnetSlugForScarcity</Label>
                        <Input
                          id="lm"
                          className="mt-1"
                          value={d.leadMagnetSlugForScarcity ?? ""}
                          onChange={(e) => setDraft({ ...d, leadMagnetSlugForScarcity: e.target.value || null })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pt">proofTitle</Label>
                      <Input
                        id="pt"
                        className="mt-1"
                        value={d.proofTitle ?? ""}
                        onChange={(e) => setDraft({ ...d, proofTitle: e.target.value || null })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pb">proof bullets (one per line)</Label>
                      <Textarea
                        id="pb"
                        className="mt-1 min-h-[88px]"
                        value={d.proofBulletsJsonText ?? ""}
                        onChange={(e) => setDraft({ ...d, proofBulletsJsonText: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lt">lossTitle</Label>
                      <Input
                        id="lt"
                        className="mt-1"
                        value={d.lossTitle ?? ""}
                        onChange={(e) => setDraft({ ...d, lossTitle: e.target.value || null })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lb">loss bullets (one per line)</Label>
                      <Textarea
                        id="lb"
                        className="mt-1 min-h-[88px]"
                        value={d.lossBulletsJsonText ?? ""}
                        onChange={(e) => setDraft({ ...d, lossBulletsJsonText: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label>Analytics events</Label>
                        <p className="text-xs text-muted-foreground">urgency_surface_view + CTA clicks</p>
                      </div>
                      <Switch
                        checked={d.analyticsEnabled}
                        onCheckedChange={(v) => setDraft({ ...d, analyticsEnabled: v })}
                      />
                    </div>

                    <Button type="button" onClick={handleSave} disabled={saveMutation.isPending} className="w-full sm:w-auto">
                      {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save surface
                    </Button>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
