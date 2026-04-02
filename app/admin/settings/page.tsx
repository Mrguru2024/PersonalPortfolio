"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Smartphone,
  Clock,
  Shield,
  Bot,
  Loader2,
  Mail,
  Globe2,
  Eye,
  Volume2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { dispatchReadAloudStatusRefresh } from "@/lib/readAloudRefresh";
import { useToast } from "@/hooks/use-toast";
import { FieldHint } from "@/lib/field-hint";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAdminAudienceView, type AdminAudienceViewMode } from "@/contexts/AdminAudienceViewContext";
import { Checkbox } from "@/components/ui/checkbox";
import { GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT } from "@shared/readAloudGeminiVoices";
import { resolveReadAloudTts, type AdminTtsConfigStored, type ResolvedReadAloudTts } from "@shared/readAloudTtsConfig";
import { AdminPushSubscribeButton } from "@/components/admin/AdminPushSubscribeButton";

interface AscendraOsPlatformPayload {
  publicAccessEnabled: boolean;
  effectivePublicAccessEnabled: boolean;
  envLockForcesInternal: boolean;
  updatedAt: string | null;
}

interface AdminSettingsPayload {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotificationsEnabled: boolean;
  remindersEnabled: boolean;
  reminderFrequency: string;
  reminderPlanningDays: string[];
  reminderCityFocus: string | null;
  reminderEditorialHolidaysEnabled: boolean;
  reminderEditorialLocalEventsEnabled: boolean;
  reminderEditorialHorizonDays: number;
  notifyOnRoleChange: boolean;
  aiAgentCanPerformActions: boolean;
  aiAgentRequireActionConfirmation: boolean;
  aiMentorObserveUsage: boolean;
  aiMentorProactiveCheckpoints: boolean;
  /** Optional — layout prefs for admin dashboards (main, CRM). */
  adminUiLayouts?: Record<string, { order: string[]; hidden: string[] }> | null;
  /** Neural read-aloud overrides; null = env defaults + built-in voice lists only. */
  ttsConfig?: AdminTtsConfigStored | null;
}

type TtsFormDraft = {
  openaiModel: string;
  geminiModel: string;
  openaiVoicesExtra: string;
  geminiVoicesExtra: string;
};

const EMPTY_TTS_DRAFT: TtsFormDraft = {
  openaiModel: "",
  geminiModel: "",
  openaiVoicesExtra: "",
  geminiVoicesExtra: "",
};

function splitVoiceList(s: string): string[] {
  return [...new Set(s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean))];
}

function ttsConfigFromDraft(d: TtsFormDraft): AdminTtsConfigStored {
  return {
    openaiModel: d.openaiModel.trim() || null,
    geminiModel: d.geminiModel.trim() || null,
    openaiVoicesExtra: splitVoiceList(d.openaiVoicesExtra),
    geminiVoicesExtra: splitVoiceList(d.geminiVoicesExtra),
  };
}

function normalizedTtsSnapshot(c: AdminTtsConfigStored | null | undefined): AdminTtsConfigStored {
  if (!c) {
    return { openaiModel: null, geminiModel: null, openaiVoicesExtra: [], geminiVoicesExtra: [] };
  }
  return {
    openaiModel: c.openaiModel,
    geminiModel: c.geminiModel,
    openaiVoicesExtra: [...c.openaiVoicesExtra].sort(),
    geminiVoicesExtra: [...c.geminiVoicesExtra].sort(),
  };
}

function isTtsDraftDirty(draft: TtsFormDraft, saved: AdminTtsConfigStored | null | undefined): boolean {
  return (
    JSON.stringify(normalizedTtsSnapshot(saved ?? null)) !==
    JSON.stringify(normalizedTtsSnapshot(ttsConfigFromDraft(draft)))
  );
}

type ReadAloudStatusPayload = {
  openaiTts?: boolean;
  geminiTts?: boolean;
  envDefaults?: { openaiModel: string; geminiModel: string };
  resolved?: ResolvedReadAloudTts;
};

const DEFAULT_SETTINGS: AdminSettingsPayload = {
  emailNotifications: true,
  inAppNotifications: true,
  pushNotificationsEnabled: true,
  remindersEnabled: true,
  reminderFrequency: "realtime",
  reminderPlanningDays: ["monday"],
  reminderCityFocus: null,
  reminderEditorialHolidaysEnabled: true,
  reminderEditorialLocalEventsEnabled: true,
  reminderEditorialHorizonDays: 21,
  notifyOnRoleChange: true,
  aiAgentCanPerformActions: false,
  aiAgentRequireActionConfirmation: true,
  aiMentorObserveUsage: false,
  aiMentorProactiveCheckpoints: true,
};

const PLANNING_DAY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { mode: audienceViewMode, setMode: setAudienceViewMode } = useAdminAudienceView();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [local, setLocal] = useState<AdminSettingsPayload>(DEFAULT_SETTINGS);
  const [ttsDraft, setTtsDraft] = useState<TtsFormDraft>(EMPTY_TTS_DRAFT);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: settings, isLoading } = useQuery<AdminSettingsPayload>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: ttsStatus, isLoading: ttsStatusLoading } = useQuery<ReadAloudStatusPayload>({
    queryKey: ["/api/admin/read-aloud/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/read-aloud/status");
      if (!res.ok) throw new Error("Failed to load read-aloud status");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: osPlatform, isLoading: osPlatformLoading } = useQuery<AscendraOsPlatformPayload>({
    queryKey: ["/api/admin/platform/ascendra-os"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/platform/ascendra-os");
      if (!res.ok) throw new Error("Failed to load Ascendra OS settings");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const osPlatformMutation = useMutation({
    mutationFn: async (publicAccessEnabled: boolean) => {
      const res = await apiRequest("PATCH", "/api/admin/platform/ascendra-os", { publicAccessEnabled });
      if (!res.ok) throw new Error("Failed to update");
      return res.json() as Promise<AscendraOsPlatformPayload>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/platform/ascendra-os"], data);
      toast({ title: "Ascendra OS access updated" });
    },
    onError: () => {
      toast({ title: "Failed to update Ascendra OS settings", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  useEffect(() => {
    const c = settings?.ttsConfig;
    if (!c) {
      setTtsDraft(EMPTY_TTS_DRAFT);
      return;
    }
    setTtsDraft({
      openaiModel: c.openaiModel ?? "",
      geminiModel: c.geminiModel ?? "",
      openaiVoicesExtra: (c.openaiVoicesExtra ?? []).join(", "),
      geminiVoicesExtra: (c.geminiVoicesExtra ?? []).join(", "),
    });
  }, [settings?.ttsConfig]);

  const patchMutation = useMutation({
    mutationFn: async (updates: Partial<AdminSettingsPayload> & { ttsConfig?: AdminTtsConfigStored | null }) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", updates);
      if (!res.ok) throw new Error("Failed to update");
      return res.json() as Promise<AdminSettingsPayload>;
    },
    onSuccess: (data) => {
      setLocal(data);
      queryClient.setQueryData(["/api/admin/settings"], data);
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/read-aloud/status"] });
      dispatchReadAloudStatusRefresh();
      toast({ title: "Settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const update = (key: keyof AdminSettingsPayload, value: AdminSettingsPayload[keyof AdminSettingsPayload]) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    patchMutation.mutate({ [key]: value });
  };

  const ttsDirty = useMemo(
    () => isTtsDraftDirty(ttsDraft, settings?.ttsConfig),
    [ttsDraft, settings?.ttsConfig],
  );

  const effectivePreview = useMemo(() => {
    const env = ttsStatus?.envDefaults;
    if (!env) return null;
    if (ttsDirty) {
      return resolveReadAloudTts(ttsConfigFromDraft(ttsDraft), env);
    }
    return ttsStatus?.resolved ?? null;
  }, [ttsStatus, ttsDirty, ttsDraft]);

  const openAiPresetValue = useMemo(() => {
    const m = ttsDraft.openaiModel.trim();
    if (!m) return "__env__";
    if (m === "tts-1") return "tts-1";
    if (m === "tts-1-hd") return "tts-1-hd";
    return "__custom__";
  }, [ttsDraft.openaiModel]);

  const geminiPresetValue = useMemo(() => {
    const m = ttsDraft.geminiModel.trim();
    if (!m) return "__env__";
    if (m === GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT) return "__default_flash__";
    return "__custom__";
  }, [ttsDraft.geminiModel]);

  const setOpenAiPreset = (v: string) => {
    if (v === "__env__") setTtsDraft((d) => ({ ...d, openaiModel: "" }));
    else if (v === "tts-1") setTtsDraft((d) => ({ ...d, openaiModel: "tts-1" }));
    else if (v === "tts-1-hd") setTtsDraft((d) => ({ ...d, openaiModel: "tts-1-hd" }));
    else
      setTtsDraft((d) => {
        const cur = d.openaiModel.trim();
        const wasPreset = !cur || cur === "tts-1" || cur === "tts-1-hd";
        return { ...d, openaiModel: wasPreset ? "" : d.openaiModel };
      });
  };

  const setGeminiPreset = (v: string) => {
    if (v === "__env__") setTtsDraft((d) => ({ ...d, geminiModel: "" }));
    else if (v === "__default_flash__")
      setTtsDraft((d) => ({ ...d, geminiModel: GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT }));
    else
      setTtsDraft((d) => {
        const cur = d.geminiModel.trim();
        const wasPreset = !cur || cur === GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT;
        return { ...d, geminiModel: wasPreset ? "" : d.geminiModel };
      });
  };

  const discardTtsDraft = () => {
    const c = settings?.ttsConfig;
    if (!c) setTtsDraft(EMPTY_TTS_DRAFT);
    else
      setTtsDraft({
        openaiModel: c.openaiModel ?? "",
        geminiModel: c.geminiModel ?? "",
        openaiVoicesExtra: (c.openaiVoicesExtra ?? []).join(", "),
        geminiVoicesExtra: (c.geminiVoicesExtra ?? []).join(", "),
      });
  };

  const saveTtsDraft = () => {
    patchMutation.mutate({ ttsConfig: ttsConfigFromDraft(ttsDraft) });
  };

  const openAiExtrasParsed = useMemo(() => splitVoiceList(ttsDraft.openaiVoicesExtra), [ttsDraft.openaiVoicesExtra]);
  const geminiExtrasParsed = useMemo(() => splitVoiceList(ttsDraft.geminiVoicesExtra), [ttsDraft.geminiVoicesExtra]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  const isSuper = isAuthSuperUser(user);
  const saving = patchMutation.isPending;
  const osSaving = osPlatformMutation.isPending;

  const togglePlanningDay = (day: string, checked: boolean) => {
    const next = new Set(local.reminderPlanningDays ?? []);
    if (checked) next.add(day);
    else next.delete(day);
    if (next.size === 0) {
      toast({ title: "Choose at least one planning day", variant: "destructive" });
      return;
    }
    update("reminderPlanningDays", [...next] as AdminSettingsPayload["reminderPlanningDays"]);
  };

  const commitCityFocus = () => {
    update("reminderCityFocus", (local.reminderCityFocus ?? "").trim() || null);
  };

  const commitEditorialHorizon = () => {
    const n = Number(local.reminderEditorialHorizonDays);
    if (!Number.isFinite(n)) {
      update("reminderEditorialHorizonDays", 21);
      return;
    }
    update("reminderEditorialHorizonDays", Math.max(3, Math.min(90, Math.round(n))));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-2">Admin settings</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Control notifications, push, reminders, and AI agent permissions. Role and permission changes are recognized by the backend and AI helpers.
        </p>

        <Card className="mb-6 border-dashed border-primary/25 bg-primary/5">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5" />
              Website &amp; community preview
            </CardTitle>
            <CardDescription>
              On the marketing site and AFN pages, hide Ascendra OS menus and use the account menu as a customer or community
              member would. Your real permissions are unchanged—you can still open any{" "}
              <code className="text-xs bg-muted px-1 rounded">/admin</code> URL. Stored in this browser only.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <RadioGroup
              value={audienceViewMode}
              onValueChange={(v) => setAudienceViewMode(v as AdminAudienceViewMode)}
              className="space-y-3"
            >
              {(
                [
                  {
                    id: "view-audience-admin",
                    value: "admin" as const,
                    title: "Ascendra OS (normal)",
                    body: "Full operator navigation, admin chat bell, and shortcuts on the public shell.",
                  },
                  {
                    id: "view-audience-customer",
                    value: "customer" as const,
                    title: "Customer — website + client dashboard",
                    body: "Same top navigation as visitors; account menu shows the client dashboard entry only (no operator links).",
                  },
                  {
                    id: "view-audience-community",
                    value: "community" as const,
                    title: "Community — AFN member",
                    body: "Account menu highlights AFN home, feed, and profile, plus the client dashboard—similar to a founder using the network.",
                  },
                ] as const
              ).map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/80 p-3 dark:bg-background/40"
                >
                  <RadioGroupItem value={opt.value} id={opt.id} className="mt-1" />
                  <Label htmlFor={opt.id} className="cursor-pointer font-normal leading-snug">
                    <span className="font-medium text-foreground">{opt.title}</span>
                    <p className="text-sm text-muted-foreground mt-1">{opt.body}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="mb-6 border-muted">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="h-5 w-5" />
              Ascendra OS — public vs internal
            </CardTitle>
            <CardDescription>
              {isSuper ?
                <>
                  Master switch for gated public tools such as <code className="text-xs">/api/market/*</code> and future
                  client lead-magnet flows. Admin AMIE at{" "}
                  <Link href="/admin/market-intelligence" className="text-primary underline font-medium">
                    Market intelligence
                  </Link>{" "}
                  stays available to your team either way. When you go live, turn this on for subscribers; layer
                  per-client auth and billing on top of this flag.
                </>
              : (
                <>
                  Controls whether selected public Ascendra OS experiences are available to subscribers. Your internal{" "}
                  <Link href="/admin/market-intelligence" className="text-primary underline font-medium">
                    Market intelligence
                  </Link>{" "}
                  workspace stays available to admins either way.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-4">
            {osPlatformLoading || !osPlatform ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading platform access…
              </div>
            ) : (
              <>
                {osPlatform.envLockForcesInternal && (
                  <p className="text-sm rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100">
                    {isSuper ?
                      <>
                        <strong className="font-medium">Environment lock:</strong>{" "}
                        <code className="text-xs">ASCENDRA_OS_PUBLIC_ACCESS_LOCK=internal</code> is set, so public tools
                        stay off until that variable is removed—regardless of the toggle below.
                      </>
                    : (
                      <>
                        <strong className="font-medium">Hosting lock:</strong> Public Ascendra OS access is forced off in
                        hosting configuration until your developer clears the internal lock.
                      </>
                    )}
                  </p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="ascendra-os-public" className="cursor-pointer">
                      Allow public Ascendra OS (market APIs & client tools)
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-lg">
                      Off = internal team only (default). On = effective access for public routes once you wire
                      subscription checks.{" "}
                      <span className="whitespace-nowrap">
                        Effective now:{" "}
                        <strong>{osPlatform.effectivePublicAccessEnabled ? "public allowed" : "internal only"}</strong>
                      </span>
                    </p>
                  </div>
                  <Switch
                    id="ascendra-os-public"
                    checked={osPlatform.publicAccessEnabled}
                    onCheckedChange={(v) => osPlatformMutation.mutate(v)}
                    disabled={osSaving}
                  />
                </div>
                {osPlatform.updatedAt && (
                  <p className="text-xs text-muted-foreground">Last updated {formatLocaleMediumDateTime(osPlatform.updatedAt)}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 border-muted">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="h-5 w-5" />
              Read-aloud (neural TTS)
            </CardTitle>
            <CardDescription>
              Controls the <strong>Listen</strong> button on admin pages (OpenAI and Gemini neural voices). Pick a
              preset below or open <strong>More options</strong> to add new voice names when the providers ship updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Server:</span>
              {ttsStatusLoading ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Checking…
                </span>
              ) : (
                <>
                  <Badge variant={ttsStatus?.openaiTts ? "default" : "secondary"} className="font-normal">
                    OpenAI {ttsStatus?.openaiTts ? "ready" : "not configured"}
                  </Badge>
                  <Badge variant={ttsStatus?.geminiTts ? "default" : "secondary"} className="font-normal">
                    Gemini {ttsStatus?.geminiTts ? "ready" : "not configured"}
                  </Badge>
                </>
              )}
            </div>

            {effectivePreview ? (
              <div
                className={cn(
                  "rounded-lg border p-3 text-xs space-y-1.5",
                  ttsDirty
                    ? "border-amber-500/40 bg-amber-500/5 text-foreground"
                    : "border-border/80 bg-muted/40 text-muted-foreground",
                )}
              >
                {ttsDirty ? (
                  <p className="font-medium text-amber-950 dark:text-amber-100">Preview (save to apply)</p>
                ) : (
                  <p className="font-medium text-foreground">Effective for your account</p>
                )}
                <p>
                  <span className="text-muted-foreground">OpenAI model:</span>{" "}
                  <code className="text-[11px] bg-background/80 px-1 rounded">{effectivePreview.openai.model}</code>
                  {" · "}
                  <span className="text-muted-foreground">
                    {effectivePreview.openai.voices.length} voices in picker
                    {openAiExtrasParsed.length > 0
                      ? ` (${openAiExtrasParsed.length} custom id${openAiExtrasParsed.length === 1 ? "" : "s"} below)`
                      : ""}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Gemini model:</span>{" "}
                  <code className="text-[11px] bg-background/80 px-1 rounded">{effectivePreview.gemini.model}</code>
                  {" · "}
                  <span className="text-muted-foreground">
                    {effectivePreview.gemini.voices.length} voices in picker
                    {geminiExtrasParsed.length > 0
                      ? ` (${geminiExtrasParsed.length} custom name${geminiExtrasParsed.length === 1 ? "" : "s"} below)`
                      : ""}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border/70 bg-background/50 p-3 dark:bg-background/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OpenAI</p>
                <div className="space-y-1.5">
                  <Label htmlFor="tts-oai-preset">Speech model</Label>
                  <Select value={openAiPresetValue} onValueChange={setOpenAiPreset} disabled={saving}>
                    <SelectTrigger id="tts-oai-preset" className="h-9">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__env__">Same as server env (or tts-1)</SelectItem>
                      <SelectItem value="tts-1">Standard — tts-1</SelectItem>
                      <SelectItem value="tts-1-hd">Higher quality — tts-1-hd</SelectItem>
                      <SelectItem value="__custom__">Custom model id…</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldHint>Uses OPENAI_READ_ALOUD_MODEL on the server when you pick “Same as server env”.</FieldHint>
                </div>
                {openAiPresetValue === "__custom__" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="tts-oai-custom">Custom OpenAI model id</Label>
                    <Input
                      id="tts-oai-custom"
                      className="h-9 font-mono text-xs"
                      placeholder="e.g. gpt-4o-mini-tts"
                      value={ttsDraft.openaiModel}
                      onChange={(e) => setTtsDraft((d) => ({ ...d, openaiModel: e.target.value }))}
                      disabled={saving}
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 bg-background/50 p-3 dark:bg-background/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gemini</p>
                <div className="space-y-1.5">
                  <Label htmlFor="tts-gem-preset">TTS model</Label>
                  <Select value={geminiPresetValue} onValueChange={setGeminiPreset} disabled={saving}>
                    <SelectTrigger id="tts-gem-preset" className="h-9">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__env__">Same as server env</SelectItem>
                      <SelectItem value="__default_flash__">
                        Recommended — {GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT}
                      </SelectItem>
                      <SelectItem value="__custom__">Custom model id…</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldHint>Uses GEMINI_READ_ALOUD_TTS_MODEL when you pick “Same as server env”.</FieldHint>
                </div>
                {geminiPresetValue === "__custom__" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="tts-gem-custom">Custom Gemini model id</Label>
                    <Input
                      id="tts-gem-custom"
                      className="h-9 font-mono text-xs"
                      placeholder="e.g. gemini-2.5-flash-preview-tts"
                      value={ttsDraft.geminiModel}
                      onChange={(e) => setTtsDraft((d) => ({ ...d, geminiModel: e.target.value }))}
                      disabled={saving}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <Collapsible className="rounded-lg border border-dashed border-border/80">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group w-full justify-between px-3 py-2 h-auto font-normal text-muted-foreground hover:text-foreground"
                  disabled={saving}
                >
                  <span className="text-left pr-2">
                    More options — extra voice ids (only if you need names not in the default lists)
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3 space-y-4 data-[state=closed]:animate-none">
                <Separator className="my-1" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tts-oai-voices">OpenAI — extra voices</Label>
                    <Input
                      id="tts-oai-voices"
                      className="h-9 font-mono text-xs"
                      placeholder="Lowercase, comma-separated (e.g. verse)"
                      value={ttsDraft.openaiVoicesExtra}
                      onChange={(e) => setTtsDraft((d) => ({ ...d, openaiVoicesExtra: e.target.value }))}
                      disabled={saving}
                    />
                    {openAiExtrasParsed.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {openAiExtrasParsed.slice(0, 12).map((id) => (
                          <Badge key={id} variant="secondary" className="text-[10px] font-mono font-normal">
                            {id}
                          </Badge>
                        ))}
                        {openAiExtrasParsed.length > 12 ? (
                          <span className="text-[10px] text-muted-foreground self-center">
                            +{openAiExtrasParsed.length - 12} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No extra ids — built-in list only.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tts-gem-voices">Gemini — extra voices</Label>
                    <Input
                      id="tts-gem-voices"
                      className="h-9 font-mono text-xs"
                      placeholder="PascalCase, comma-separated (e.g. Kore)"
                      value={ttsDraft.geminiVoicesExtra}
                      onChange={(e) => setTtsDraft((d) => ({ ...d, geminiVoicesExtra: e.target.value }))}
                      disabled={saving}
                    />
                    {geminiExtrasParsed.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {geminiExtrasParsed.slice(0, 12).map((id) => (
                          <Badge key={id} variant="secondary" className="text-[10px] font-mono font-normal">
                            {id}
                          </Badge>
                        ))}
                        {geminiExtrasParsed.length > 12 ? (
                          <span className="text-[10px] text-muted-foreground self-center">
                            +{geminiExtrasParsed.length - 12} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No extra names — built-in list only.</p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Invalid tokens are removed when you save. See{" "}
                  <a
                    href="https://platform.openai.com/docs/guides/text-to-speech"
                    className="text-primary underline font-medium"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenAI TTS
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://ai.google.dev/gemini-api/docs/speech-generation"
                    className="text-primary underline font-medium"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Gemini speech
                  </a>
                  .
                </p>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" disabled={saving || !ttsDirty} onClick={saveTtsDraft}>
                Save read-aloud
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving || !ttsDirty}
                onClick={discardTtsDraft}
              >
                Discard changes
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                disabled={saving || !settings?.ttsConfig}
                onClick={() => patchMutation.mutate({ ttsConfig: null })}
              >
                Clear saved overrides
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              After saving, open any admin page and use the <strong>Listen</strong> control to try voices.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" />
              Brevo email delivery
            </CardTitle>
            <CardDescription>
              Check API key status, authorized IPs, and sender env vars. Use this when test sends fail with an IP or auth error.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/settings/brevo">Open Brevo setup</Link>
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Email and in-app notifications for admin events (e.g. chat, feedback, role changes).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="cursor-pointer">Email notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={local.emailNotifications}
                    onCheckedChange={(v) => update("emailNotifications", v)}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-app-notifications" className="cursor-pointer">In-app notifications</Label>
                  <Switch
                    id="in-app-notifications"
                    checked={local.inAppNotifications}
                    onCheckedChange={(v) => update("inAppNotifications", v)}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone className="h-5 w-5" />
                  Push notifications
                </CardTitle>
                <CardDescription>
                  Browser push for new form submissions, inbox items, internal chat (when enabled), and reminder runs.
                  Requires VAPID keys in server env. Subscribe each browser you use.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-enabled" className="cursor-pointer">Push notifications enabled</Label>
                  <Switch
                    id="push-enabled"
                    checked={local.pushNotificationsEnabled}
                    onCheckedChange={(v) => update("pushNotificationsEnabled", v)}
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminPushSubscribeButton />
                </div>
                <FieldHint>
                  Also available from <Link href="/admin/chat" className="text-primary underline-offset-2 hover:underline">Internal chat</Link>{" "}
                  and <Link href="/admin/inbox" className="text-primary underline-offset-2 hover:underline">Inbound inbox</Link>.
                </FieldHint>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Reminders
                </CardTitle>
                <CardDescription>
                  Growth reminders (overdue tasks, follow-ups, discovery, etc.). When disabled, the reminders list is empty and no push is sent for new reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminders-enabled" className="cursor-pointer">Reminders enabled</Label>
                  <Switch
                    id="reminders-enabled"
                    checked={local.remindersEnabled}
                    onCheckedChange={(v) => update("remindersEnabled", v)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reminder check frequency</Label>
                  <Select
                    value={local.reminderFrequency}
                    onValueChange={(v) => update("reminderFrequency", v)}
                    disabled={saving}
                  >
                    <SelectTrigger id="reminder-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Realtime (when you load reminders)</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldHint>
                    Controls how often the app rechecks for overdue tasks and follow-ups — not how often emails
                    are sent (that depends on your workflow).
                  </FieldHint>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Editorial targeting reminders</p>
                  <p>
                    Adds reminders for content planning days, holiday windows, and local events based on your
                    city-focus targeting settings.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Content planning days</Label>
                  <div className="flex flex-wrap gap-2">
                    {PLANNING_DAY_OPTIONS.map((day) => (
                      <label
                        key={day.value}
                        className="inline-flex items-center gap-2 rounded-md border border-border/70 px-2.5 py-1.5 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={(local.reminderPlanningDays ?? []).includes(day.value)}
                          onCheckedChange={(v) => togglePlanningDay(day.value, Boolean(v))}
                          disabled={saving}
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                  <FieldHint>
                    Generates weekly content-planning reminders on the selected days.
                  </FieldHint>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder-city-focus">Targeting city focus</Label>
                  <Input
                    id="reminder-city-focus"
                    value={local.reminderCityFocus ?? ""}
                    onChange={(e) =>
                      setLocal((prev) => ({ ...prev, reminderCityFocus: e.target.value.slice(0, 120) }))
                    }
                    onBlur={commitCityFocus}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitCityFocus();
                    }}
                    placeholder="e.g. Austin, TX"
                    disabled={saving}
                  />
                  <FieldHint>
                    Used for local-event editorial reminders in your content planning flow.
                  </FieldHint>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminder-holidays" className="cursor-pointer">Holiday editorial reminders</Label>
                      <p className="text-xs text-muted-foreground">Prompts for upcoming seasonal/holiday opportunities.</p>
                    </div>
                    <Switch
                      id="reminder-holidays"
                      checked={local.reminderEditorialHolidaysEnabled}
                      onCheckedChange={(v) => update("reminderEditorialHolidaysEnabled", v)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminder-local-events" className="cursor-pointer">Local-event editorial reminders</Label>
                      <p className="text-xs text-muted-foreground">Uses your targeting city focus for local angles.</p>
                    </div>
                    <Switch
                      id="reminder-local-events"
                      checked={local.reminderEditorialLocalEventsEnabled}
                      onCheckedChange={(v) => update("reminderEditorialLocalEventsEnabled", v)}
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editorial-horizon">Editorial reminder horizon (days)</Label>
                  <Input
                    id="editorial-horizon"
                    type="number"
                    min={3}
                    max={90}
                    step={1}
                    value={local.reminderEditorialHorizonDays}
                    onChange={(e) =>
                      setLocal((prev) => ({
                        ...prev,
                        reminderEditorialHorizonDays: Number(e.target.value || prev.reminderEditorialHorizonDays),
                      }))
                    }
                    onBlur={commitEditorialHorizon}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEditorialHorizon();
                    }}
                    disabled={saving}
                  />
                  <FieldHint>
                    How far ahead to look for content-planning, holiday, and local-event editorial reminders.
                  </FieldHint>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Role & permission updates
                </CardTitle>
                <CardDescription>
                  Your role and permissions are used by the backend and AI (e.g. playbook tips, reminder filtering). Get notified when your role or permissions change.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-role-change" className="cursor-pointer">Notify on role/permission change</Label>
                  <Switch
                    id="notify-role-change"
                    checked={local.notifyOnRoleChange}
                    onCheckedChange={(v) => update("notifyOnRoleChange", v)}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  AI admin agent
                </CardTitle>
                <CardDescription>
                  When enabled, the floating AI assistant can perform actions you request (e.g. navigate, open reminders, generate reminders). The agent is always available for questions and navigation; this setting only allows it to execute actions on your behalf. Build a private knowledge base on{" "}
                  <Link href="/admin/agent-knowledge" className="text-primary underline font-medium">
                    Assistant knowledge
                  </Link>{" "}
                  so replies can use your notes when those entries are enabled for the assistant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="ai-agent-actions" className="cursor-pointer">Allow agent to perform actions</Label>
                  <Switch
                    id="ai-agent-actions"
                    checked={local.aiAgentCanPerformActions}
                    onCheckedChange={(v) => update("aiAgentCanPerformActions", v)}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-agent-confirm" className="cursor-pointer">Confirm before running actions</Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      When on, navigation and reminder runs need a tap to confirm in the assistant panel.
                    </p>
                  </div>
                  <Switch
                    id="ai-agent-confirm"
                    checked={local.aiAgentRequireActionConfirmation}
                    onCheckedChange={(v) => update("aiAgentRequireActionConfirmation", v)}
                    disabled={saving}
                  />
                </div>
                <div className="rounded-lg border border-border/80 bg-muted/30 p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Mentor companion (opt-in)</p>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      The floating assistant can learn coarse <strong>admin navigation only</strong> (page paths and time on page) to personalize checkpoints — never form fields, keystrokes, or customer PII. Pair with{" "}
                      <strong>Allow agent to perform actions</strong> if you want it to suggest runnable steps (you still confirm when confirmation is on).
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-mentor-observe" className="cursor-pointer">Let mentor learn my admin navigation</Label>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Aggregates repeat routes so the mentor understands habits and stuck loops. Data stays on this deployment.
                      </p>
                    </div>
                    <Switch
                      id="ai-mentor-observe"
                      checked={local.aiMentorObserveUsage}
                      onCheckedChange={(v) => update("aiMentorObserveUsage", v)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="ai-mentor-checkpoints" className="cursor-pointer">Occasional checkpoint prompts</Label>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Rare, soft questions in the assistant panel — not blocking popups. Ignored if navigation learning is off and there is no prior memory yet.
                      </p>
                    </div>
                    <Switch
                      id="ai-mentor-checkpoints"
                      checked={local.aiMentorProactiveCheckpoints}
                      onCheckedChange={(v) => update("aiMentorProactiveCheckpoints", v)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
