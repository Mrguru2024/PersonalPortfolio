"use client";

import { useEffect, useState, useCallback, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Link2,
  Calendar,
  Share2,
} from "lucide-react";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationId, IntegrationStatus } from "@/api/admin/integrations/types";

export default function AdminIntegrationsPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isSuperUser = isAuthSuperUser(user);

  const [services, setServices] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<IntegrationId | null>(null);
  const [testResult, setTestResult] = useState<{ id: IntegrationId; ok: boolean; message: string } | null>(null);
  const [gcalFlash, setGcalFlash] = useState<string | null>(null);
  const [socialFlash, setSocialFlash] = useState<string | null>(null);
  const [gcalCalendarId, setGcalCalendarId] = useState("primary");
  const [gcalSaving, setGcalSaving] = useState(false);
  const [fbDisconnecting, setFbDisconnecting] = useState(false);
  const [contentStudioSocial, setContentStudioSocial] = useState<{
    facebookPage: boolean;
    facebookOAuthConnected: boolean;
    facebookOAuthAvailable: boolean;
    facebookPageDisplay: { pageId: string; pageName: string } | null;
    facebookContentStudioRedirectUri: string;
    linkedin: boolean;
    x: boolean;
    webhook: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("gcal") === "connected") {
      setGcalFlash("Google Calendar connected. New bookings will create events on your calendar.");
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const err = q.get("gcal_error");
    if (err) {
      setGcalFlash(`Google Calendar: ${decodeURIComponent(err)}`);
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (q.get("social") === "facebook_connected") {
      setSocialFlash("Facebook Page connected. Content Studio can publish to this Page when calendar slots target facebook_page.");
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const socialErr = q.get("social_error");
    if (socialErr) {
      setSocialFlash(`Facebook: ${decodeURIComponent(socialErr)}`);
      window.history.replaceState({}, "", "/admin/integrations");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (!authLoading && user && !isSuperUser) {
      router.push("/admin/dashboard");
    }
  }, [mounted, user, authLoading, router, isSuperUser]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/integrations/status", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || "Failed to load integrations");
      }
      const payload = data as {
        services?: IntegrationStatus[];
        contentStudioSocial?: {
          facebookPage: boolean;
          facebookOAuthConnected: boolean;
          facebookOAuthAvailable: boolean;
          facebookPageDisplay: { pageId: string; pageName: string } | null;
          facebookContentStudioRedirectUri: string;
          linkedin: boolean;
          x: boolean;
          webhook: boolean;
        };
      };
      setServices(payload.services ?? []);
      setContentStudioSocial(payload.contentStudioSocial ?? null);
      const gcal = ((data as { services?: IntegrationStatus[] }).services ?? []).find(
        (x) => x.id === "google_calendar",
      );
      if (gcal?.configured) {
        try {
          const cr = await fetch("/api/admin/integrations/google-calendar/settings", { credentials: "include" });
          const cj = await cr.json().catch(() => ({}));
          if (typeof (cj as { calendarId?: string }).calendarId === "string") {
            setGcalCalendarId((cj as { calendarId: string }).calendarId);
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoading(true);
    void fetchStatus();
  }, [user, isSuperUser, fetchStatus]);

  async function disconnectContentStudioFacebook() {
    if (!confirm("Disconnect Facebook Page from Content Studio? You can reconnect anytime; env-based tokens still work if configured."))
      return;
    setFbDisconnecting(true);
    try {
      await apiRequest("POST", "/api/admin/integrations/social/facebook/disconnect");
      setSocialFlash("Facebook Page disconnected from Integrations.");
      await fetchStatus();
    } catch (e) {
      setSocialFlash(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setFbDisconnecting(false);
    }
  }

  async function disconnectGoogleCalendar() {
    if (!confirm("Disconnect Google Calendar? New bookings will not sync until you connect again.")) return;
    try {
      await apiRequest("POST", "/api/admin/integrations/google-calendar/disconnect");
      setGcalFlash("Google Calendar disconnected.");
      await fetchStatus();
    } catch (e) {
      setGcalFlash(e instanceof Error ? e.message : "Disconnect failed");
    }
  }

  async function saveGcalCalendarId() {
    setGcalSaving(true);
    try {
      await apiRequest("PATCH", "/api/admin/integrations/google-calendar/settings", {
        calendarId: gcalCalendarId.trim() || "primary",
      });
      setGcalFlash("Calendar target saved.");
    } catch (e) {
      setGcalFlash(e instanceof Error ? e.message : "Save failed");
    } finally {
      setGcalSaving(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setTestResult(null);
    fetchStatus();
  };

  const handleTest = async (id: IntegrationId) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/integrations/test", { service: id });
      const data = await res.json().catch(() => ({}));
      setTestResult({
        id,
        ok: data.ok === true,
        message: data.message ?? (res.ok ? "OK" : "Test failed"),
      });
    } catch {
      setTestResult({ id, ok: false, message: "Request failed" });
    } finally {
      setTestingId(null);
    }
  };

  const statusIcon = (s: IntegrationStatus) => {
    if (s.status === "ok") return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />;
    if (s.status === "error") return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  const statusBadge = (s: IntegrationStatus) => {
    const v = s.status === "ok" ? "default" : s.status === "error" ? "destructive" : "secondary";
    return (
      <Badge variant={v}>
        {s.status === "ok" ? "Connected" : s.status === "error" ? "Error" : "Not configured"}
      </Badge>
    );
  };

  if (!mounted || authLoading || (user && !isSuperUser)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-muted-foreground text-sm">
            Test and reconnect services: Facebook Login, email, Google Calendar, and Content Studio social publishing
            (Facebook Page / LinkedIn / X — via env vars).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {socialFlash ? (
        <p className="mb-4 text-sm rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground">{socialFlash}</p>
      ) : null}

      {/* Integrated services */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected services
          </CardTitle>
          <CardDescription>
            Status is based on environment variables. Use Test to verify; use Reconnect to open provider settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Could not load integrations. Ensure you are logged in as a super admin.
            </p>
          ) : (
            services.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-muted/20"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {statusIcon(s)}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      {statusBadge(s)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                    {s.message && (
                      <p className="text-xs text-muted-foreground mt-1">{s.message}</p>
                    )}
                    {testResult?.id === s.id && (
                      <p
                        className={`text-sm mt-2 ${testResult.ok ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
                      >
                        {testResult.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {s.connectHref ? (
                      <Button variant="default" size="sm" asChild>
                        <a href={s.connectHref}>Connect Google Calendar</a>
                      </Button>
                    ) : null}
                    {s.id === "google_calendar" && s.configured ? (
                      <Button variant="outline" size="sm" type="button" onClick={disconnectGoogleCalendar}>
                        Disconnect
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(s.id)}
                      disabled={testingId !== null}
                    >
                      {testingId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                    {s.reconnectUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={s.reconnectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Google Cloud
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {s.id === "google_calendar" && s.configured ? (
                    <div className="flex flex-col gap-1 w-full sm:w-64">
                      <Label className="text-xs text-muted-foreground">Calendar ID (primary or email)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={gcalCalendarId}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setGcalCalendarId(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                          disabled={gcalSaving}
                          onClick={() => void saveGcalCalendarId()}
                        >
                          {gcalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Content Studio: where scheduling lives + how to “connect” pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Connect social pages for post scheduling
          </CardTitle>
          <CardDescription>
            Scheduling happens in <strong className="font-medium text-foreground">Content Studio → Calendar</strong>. Each
            slot can target platforms such as <code className="text-xs">facebook_page</code>,{" "}
            <code className="text-xs">linkedin</code>, or <code className="text-xs">x</code>. Connect a Facebook Page below
            (Meta app with{" "}
            <code className="text-xs">FACEBOOK_APP_ID</code> / <code className="text-xs">FACEBOOK_APP_SECRET</code> plus the
            admin callback URI in your app settings), or set Page token + ID in server environment as a fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {contentStudioSocial?.facebookOAuthAvailable && !contentStudioSocial.facebookOAuthConnected ? (
              <Button size="sm" asChild>
                <a href="/api/admin/integrations/social/facebook/start">Connect Facebook Page</a>
              </Button>
            ) : null}
            {contentStudioSocial?.facebookOAuthConnected ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={fbDisconnecting}
                onClick={() => void disconnectContentStudioFacebook()}
              >
                {fbDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect Facebook Page"}
              </Button>
            ) : null}
            <Button size="sm" asChild>
              <Link href="/admin/content-studio/calendar">Content Studio calendar</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/content-studio">Content Studio hub</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.facebook.com/docs/pages-api/posts" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1 inline" />
                Meta: Page posts API
              </a>
            </Button>
          </div>

          {contentStudioSocial ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 p-3 text-sm">
              <p className="font-medium text-foreground mb-1">Meta: whitelist this exact redirect URI</p>
              <p className="text-muted-foreground text-xs mb-2">
                Facebook Login → Settings → Valid OAuth Redirect URIs. Must match character-for-character (including{" "}
                <code className="text-xs">http</code> vs <code className="text-xs">https</code>, <code className="text-xs">www</code>, and port). Enable{" "}
                <strong className="text-foreground">Client OAuth Login</strong> and <strong className="text-foreground">Web OAuth Login</strong>.
              </p>
              <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                {contentStudioSocial.facebookContentStudioRedirectUri}
              </code>
            </div>
          ) : null}

          {contentStudioSocial && (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium mb-2">Publishing channels (this deployment)</p>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {contentStudioSocial.facebookPage ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <strong className="text-foreground">Facebook Page</strong>
                      {contentStudioSocial.facebookOAuthConnected && contentStudioSocial.facebookPageDisplay ? (
                        <>
                          {" "}
                          — connected as{" "}
                          <span className="text-foreground font-medium">
                            {contentStudioSocial.facebookPageDisplay.pageName}
                          </span>{" "}
                          <span className="text-xs">({contentStudioSocial.facebookPageDisplay.pageId})</span>
                        </>
                      ) : contentStudioSocial.facebookPage ? (
                        <> — connected via server environment (token + Page ID)</>
                      ) : (
                        <> — use Connect Facebook Page or env vars below</>
                      )}
                    </span>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!contentStudioSocial.facebookOAuthAvailable ? (
                    <p>
                      Add <code className="text-xs">FACEBOOK_APP_ID</code> and{" "}
                      <code className="text-xs">FACEBOOK_APP_SECRET</code>, and register the Content Studio callback under
                      Valid OAuth Redirect URIs to enable the Connect button (see the highlighted URL above after you set
                      app keys).
                    </p>
                  ) : null}
                  <p>
                    Optional env fallback: <code className="text-xs">FACEBOOK_ACCESS_TOKEN</code> (
                    <code className="text-xs">META_ACCESS_TOKEN</code>) +{" "}
                    <code className="text-xs">FACEBOOK_PAGE_ID</code> (<code className="text-xs">META_PAGE_ID</code>).
                  </p>
                </li>
                <li className="flex items-center gap-2">
                  {contentStudioSocial.linkedin ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <strong className="text-foreground">LinkedIn</strong> —{" "}
                    <code className="text-xs">LINKEDIN_ACCESS_TOKEN</code> +{" "}
                    <code className="text-xs">LINKEDIN_AUTHOR_URN</code>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {contentStudioSocial.x ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <strong className="text-foreground">X (Twitter)</strong> —{" "}
                    <code className="text-xs">X_OAUTH2_ACCESS_TOKEN</code> (or TWITTER_* variants)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {contentStudioSocial.webhook ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <strong className="text-foreground">Webhook hub</strong> (Buffer / Make / Zapier-style) —{" "}
                    <code className="text-xs">CONTENT_STUDIO_PUBLISH_WEBHOOK_URL</code>
                  </span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Use <strong className="text-foreground">Refresh</strong> after changing env vars. Cron{" "}
                <code className="text-xs">/api/cron/content-studio-publish</code> needs <code className="text-xs">CRON_SECRET</code>{" "}
                in production. See <code className="text-xs">.env.example</code> (Content Studio section) and repo{" "}
                <code className="text-xs">Docs/setup/FACEBOOK-APP-SETTINGS.md</code>.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Blog scheduling (separate)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Admin → Blog can schedule publish times for site posts. That path is not the same as Content Studio social
                slots; use the calendar above for Facebook / LinkedIn / X via adapters.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/admin/blog">Open Blog</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
