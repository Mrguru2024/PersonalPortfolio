"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Smartphone, Clock, Shield, Bot, Loader2, Mail, Globe2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { FieldHint } from "@/lib/field-hint";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";

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
  notifyOnRoleChange: boolean;
  aiAgentCanPerformActions: boolean;
  aiAgentRequireActionConfirmation: boolean;
  aiMentorObserveUsage: boolean;
  aiMentorProactiveCheckpoints: boolean;
  /** Optional — layout prefs for admin dashboards (main, CRM). */
  adminUiLayouts?: Record<string, { order: string[]; hidden: string[] }> | null;
}

const DEFAULT_SETTINGS: AdminSettingsPayload = {
  emailNotifications: true,
  inAppNotifications: true,
  pushNotificationsEnabled: true,
  remindersEnabled: true,
  reminderFrequency: "realtime",
  notifyOnRoleChange: true,
  aiAgentCanPerformActions: false,
  aiAgentRequireActionConfirmation: true,
  aiMentorObserveUsage: false,
  aiMentorProactiveCheckpoints: true,
};

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [local, setLocal] = useState<AdminSettingsPayload>(DEFAULT_SETTINGS);

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

  const patchMutation = useMutation({
    mutationFn: async (updates: Partial<AdminSettingsPayload>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", updates);
      if (!res.ok) throw new Error("Failed to update");
      return res.json() as Promise<AdminSettingsPayload>;
    },
    onSuccess: (data) => {
      setLocal(data);
      queryClient.setQueryData(["/api/admin/settings"], data);
      toast({ title: "Settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const update = (key: keyof AdminSettingsPayload, value: boolean | string) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    patchMutation.mutate({ [key]: value });
  };

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  const isSuper = isAuthSuperUser(user);
  const saving = patchMutation.isPending;
  const osSaving = osPlatformMutation.isPending;

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
                  Allow push to this device for reminders and admin alerts. Subscribe from the Chat page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-enabled" className="cursor-pointer">Push notifications enabled</Label>
                  <Switch
                    id="push-enabled"
                    checked={local.pushNotificationsEnabled}
                    onCheckedChange={(v) => update("pushNotificationsEnabled", v)}
                    disabled={saving}
                  />
                </div>
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
